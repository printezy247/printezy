import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type MemberSignal = {
  id: string;
  symbol: string;
  direction: string;
  minTier: string;
  entryPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  status: string;
  resultPips: number | null;
  note: string | null;
  publishedAt: string;
};

export type MemberTrade = {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number | null;
  exitPrice: number | null;
  size: number | null;
  pips: number | null;
  pnl: number | null;
  status: string;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
};

export type MemberBilling = {
  id: string;
  tier: string;
  tierName: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
  activatedAt: string | null;
  expiresAt?: string | null;
};

export type MemberDashboard = {
  authenticated: boolean;
  member?: { name: string | null; handle: string | null };
  tier?: { id: string; name: string; perks: string[] };
  signals?: MemberSignal[];
  trades?: MemberTrade[];
  billing?: MemberBilling[];
  stats?: {
    trades: number;
    closed: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPips: number;
    totalPnl: number;
  };
};

/** Step 1 of sign-in: the bot sends a 6-digit code to the member's chat. */
export const requestLoginCode = createServerFn({ method: "POST" })
  .inputValidator(z.object({ handle: z.string().min(2).max(64) }))
  .handler(async ({ data }): Promise<{ sent: boolean; message: string }> => {
    const { findMemberByHandle, issueLoginCode } = await import("@/lib/bot/member.server");
    const { checkRateLimit } = await import("@/lib/rate-limit.server");
    const handle = data.handle.trim().replace(/^@+/, "").toLowerCase();
    // Each request DMs a fresh code and invalidates the previous one, so cap
    // per handle (and per IP inside checkRateLimit) to stop code spam.
    const allowed = await checkRateLimit("login_code", handle, { max: 3, windowMs: 10 * 60 * 1000 });
    if (!allowed) {
      return { sent: false, message: "Too many code requests — wait a few minutes and try again." };
    }
    const member = await findMemberByHandle(data.handle);
    // Same reply whether or not the handle exists, so this endpoint can't be
    // used to enumerate members.
    if (member) await issueLoginCode(member.telegram_id);
    return {
      sent: true,
      message:
        "If that handle belongs to a member, a code is on its way — check your Telegram chat with the bot. New here? Open the bot and send /start first.",
    };
  });

/** Step 2: exchange the code for a long-lived browser session token. */
export const verifyLoginCode = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ handle: z.string().min(2).max(64), code: z.string().min(4).max(8) }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; token?: string; message?: string }> => {
    const { findMemberByHandle, verifyCode } = await import("@/lib/bot/member.server");
    const member = await findMemberByHandle(data.handle);
    if (!member) return { ok: false, message: "Unknown handle." };

    const result = await verifyCode(member.telegram_id, data.code);
    if (!result.ok) {
      const message =
        result.reason === "expired"
          ? "That code expired. Request a new one."
          : result.reason === "locked"
            ? "Too many attempts. Request a fresh code."
            : "That code is not right.";
      return { ok: false, message };
    }
    return { ok: true, token: result.token };
  });

export const signOutMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(8).max(200) }))
  .handler(async ({ data }) => {
    const { destroySession } = await import("@/lib/bot/member.server");
    await destroySession(data.token);
    return { ok: true };
  });

const sessionInput = z.object({ token: z.string().min(8).max(200) });

export const getDashboard = createServerFn({ method: "POST" })
  .inputValidator(sessionInput)
  .handler(async ({ data }): Promise<MemberDashboard> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveSession, highestActiveTier, TIER_RANK } = await import(
      "@/lib/bot/member.server"
    );
    const { getTier } = await import("@/lib/bot/tiers");

    const telegramId = await resolveSession(data.token);
    if (!telegramId) return { authenticated: false };

    const [memberRes, enrollRes, tradeRes] = await Promise.all([
      supabaseAdmin
        .from("bot_users")
        .select("first_name, username")
        .eq("telegram_id", telegramId)
        .maybeSingle(),
      supabaseAdmin
        .from("enrollments")
        .select("id, tier, amount_cents, currency, status, created_at, activated_at, expires_at")
        .eq("telegram_id", telegramId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("trades")
        .select(
          "id, symbol, direction, entry_price, exit_price, size, pips, pnl, status, notes, opened_at, closed_at",
        )
        .eq("telegram_id", telegramId)
        .order("opened_at", { ascending: false })
        .limit(200),
    ]);

    const memberRow = memberRes.data as {
      first_name: string | null;
      username: string | null;
    } | null;
    const enrollments = (enrollRes.data ?? []) as Array<{
      id: string;
      tier: string;
      amount_cents: number;
      currency: string;
      status: string;
      created_at: string;
      activated_at: string | null;
      expires_at: string | null;
    }>;

    const tierId = highestActiveTier(enrollments);
    const tier = getTier(tierId);
    const rank = TIER_RANK[tierId] ?? 0;
    const allowedTiers = Object.keys(TIER_RANK).filter((t) => (TIER_RANK[t] ?? 0) <= rank);

    const signalRes = await supabaseAdmin
      .from("signals")
      .select(
        "id, symbol, direction, min_tier, entry_price, stop_price, target_price, status, result_pips, note, published_at",
      )
      .in("min_tier", allowedTiers)
      .order("published_at", { ascending: false })
      .limit(100);

    const trades: MemberTrade[] = (tradeRes.data ?? []).map((t) => ({
      id: t.id,
      symbol: t.symbol,
      direction: t.direction,
      entryPrice: t.entry_price,
      exitPrice: t.exit_price,
      size: t.size,
      pips: t.pips,
      pnl: t.pnl,
      status: t.status,
      notes: t.notes,
      openedAt: t.opened_at,
      closedAt: t.closed_at,
    }));

    const signals: MemberSignal[] = (signalRes.data ?? []).map((s) => ({
      id: s.id,
      symbol: s.symbol,
      direction: s.direction,
      minTier: s.min_tier,
      entryPrice: s.entry_price,
      stopPrice: s.stop_price,
      targetPrice: s.target_price,
      status: s.status,
      resultPips: s.result_pips,
      note: s.note,
      publishedAt: s.published_at,
    }));

    const closed = trades.filter((t) => t.status === "closed");
    const wins = closed.filter((t) => (t.pnl ?? t.pips ?? 0) > 0).length;
    const losses = closed.filter((t) => (t.pnl ?? t.pips ?? 0) < 0).length;

    return {
      authenticated: true,
      member: { name: memberRow?.first_name ?? null, handle: memberRow?.username ?? null },
      tier: { id: tierId, name: tier?.name ?? tierId, perks: tier?.perks ?? [] },
      signals,
      trades,
      billing: enrollments.map((e) => ({
        id: e.id,
        tier: e.tier,
        tierName: getTier(e.tier)?.name ?? e.tier,
        amountCents: e.amount_cents,
        currency: e.currency,
        status: e.status,
        createdAt: e.created_at,
        activatedAt: e.activated_at,
        expiresAt: e.expires_at,
      })),
      stats: {
        trades: trades.length,
        closed: closed.length,
        wins,
        losses,
        winRate: closed.length ? Math.round((wins / closed.length) * 100) : 0,
        totalPips: Math.round(closed.reduce((sum, t) => sum + (t.pips ?? 0), 0) * 10) / 10,
        totalPnl: Math.round(closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0) * 100) / 100,
      },
    };
  });

const numeric = z.union([z.number(), z.null()]).optional();

export const saveTrade = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(8).max(200),
      id: z.string().uuid().optional(),
      symbol: z.string().min(1).max(24),
      direction: z.enum(["buy", "sell"]),
      entryPrice: numeric,
      exitPrice: numeric,
      size: numeric,
      pips: numeric,
      pnl: numeric,
      status: z.enum(["open", "closed"]),
      notes: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveSession } = await import("@/lib/bot/member.server");
    const telegramId = await resolveSession(data.token);
    if (!telegramId) return { ok: false };

    const payload = {
      telegram_id: telegramId,
      symbol: data.symbol.toUpperCase(),
      direction: data.direction,
      entry_price: data.entryPrice ?? null,
      exit_price: data.exitPrice ?? null,
      size: data.size ?? null,
      pips: data.pips ?? null,
      pnl: data.pnl ?? null,
      status: data.status,
      notes: data.notes ?? null,
      closed_at: data.status === "closed" ? new Date().toISOString() : null,
    };

    if (data.id) {
      // Scoped by telegram_id so a session can only touch its own rows.
      const { error } = await supabaseAdmin
        .from("trades")
        .update(payload as never)
        .eq("id", data.id)
        .eq("telegram_id", telegramId);
      if (error) console.error("[member] trade update failed", error);
      return { ok: !error };
    }

    const { error } = await supabaseAdmin.from("trades").insert(payload as never);
    if (error) console.error("[member] trade insert failed", error);
    return { ok: !error };
  });

export const deleteTrade = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(8).max(200), id: z.string().uuid() }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveSession } = await import("@/lib/bot/member.server");
    const telegramId = await resolveSession(data.token);
    if (!telegramId) return { ok: false };
    const { error } = await supabaseAdmin
      .from("trades")
      .delete()
      .eq("id", data.id)
      .eq("telegram_id", telegramId);
    return { ok: !error };
  });
