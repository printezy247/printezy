// Server-only member account layer: one-time-code sign-in, browser sessions
// and the data each signed-in member is allowed to see.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage } from "./telegram.server";
import { getTier, SITE_URL, type TierId } from "./tiers";

const CODE_TTL_MINUTES = 10;
const SESSION_TTL_DAYS = 30;
const MAX_CODE_ATTEMPTS = 5;

export const TIER_RANK: Record<string, number> = {
  free: 0,
  vantage: 2,
  beginner: 1,
  pro: 2,
  premium: 3,
  elite: 4,
};

export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "").toLowerCase();
}

function randomToken(): string {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
}

function sixDigitCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + ((buf[0] ?? 0) % 900000));
}

export async function findMemberByHandle(handle: string) {
  const clean = normalizeHandle(handle);
  if (!clean) return null;
  const { data } = await supabaseAdmin
    .from("bot_users")
    .select("telegram_id, username, first_name")
    .ilike("username", clean)
    .maybeSingle();
  return (data as { telegram_id: number; username: string | null; first_name: string | null } | null) ?? null;
}

/** Generates a code, stores it and delivers it through the bot chat. */
export async function issueLoginCode(telegramId: number): Promise<void> {
  const code = sixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();

  // Invalidate any codes still outstanding for this member.
  await supabaseAdmin
    .from("login_codes")
    .update({ used_at: new Date().toISOString() } as never)
    .eq("telegram_id", telegramId)
    .is("used_at", null);

  const { error } = await supabaseAdmin.from("login_codes").insert({
    telegram_id: telegramId,
    code,
    expires_at: expiresAt,
  } as never);
  if (error) {
    console.error("[member] code insert failed", error);
    return;
  }

  await sendMessage(
    telegramId,
    `🔐 <b>${code}</b> is your EzyMap ALGO sign-in code.\n\nIt expires in ${CODE_TTL_MINUTES} minutes. If you did not request it, ignore this message.`,
  );
}

export type VerifyResult =
  | { ok: true; token: string }
  | { ok: false; reason: "invalid" | "expired" | "locked" };

export async function verifyCode(telegramId: number, code: string): Promise<VerifyResult> {
  const { data } = await supabaseAdmin
    .from("login_codes")
    .select("id, code, attempts, expires_at")
    .eq("telegram_id", telegramId)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as
    | { id: string; code: string; attempts: number; expires_at: string }
    | null;
  if (!row) return { ok: false, reason: "expired" };
  if (row.attempts >= MAX_CODE_ATTEMPTS) return { ok: false, reason: "locked" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };

  if (row.code !== code.trim()) {
    await supabaseAdmin
      .from("login_codes")
      .update({ attempts: row.attempts + 1 } as never)
      .eq("id", row.id);
    return { ok: false, reason: "invalid" };
  }

  await supabaseAdmin
    .from("login_codes")
    .update({ used_at: new Date().toISOString() } as never)
    .eq("id", row.id);

  const token = randomToken();
  const { error } = await supabaseAdmin.from("member_sessions").insert({
    token,
    telegram_id: telegramId,
    expires_at: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString(),
  } as never);
  if (error) {
    console.error("[member] session insert failed", error);
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, token };
}

/** Resolves a browser session token to a telegram id, or null. */
export async function resolveSession(token: string): Promise<number | null> {
  if (!token || token.length < 16) return null;
  const { data } = await supabaseAdmin
    .from("member_sessions")
    .select("telegram_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  const row = data as { telegram_id: number; expires_at: string } | null;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  await supabaseAdmin
    .from("member_sessions")
    .update({ last_seen_at: new Date().toISOString() } as never)
    .eq("token", token);
  return row.telegram_id;
}

/** Mints a browser session for a known member. */
export async function createMemberSession(telegramId: number): Promise<string | null> {
  const token = randomToken();
  const { error } = await supabaseAdmin.from("member_sessions").insert({
    token,
    telegram_id: telegramId,
    expires_at: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString(),
  } as never);
  if (error) {
    console.error("[member] session insert failed", error);
    return null;
  }
  return token;
}

/** Exchanges a bot portal link token for a full member session. */
export async function sessionFromPortalToken(portalToken: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("enrollments")
    .select("telegram_id")
    .eq("portal_token", portalToken)
    .maybeSingle();
  const row = data as { telegram_id: number } | null;
  if (!row) return null;
  const token = randomToken();
  const { error } = await supabaseAdmin.from("member_sessions").insert({
    token,
    telegram_id: row.telegram_id,
    expires_at: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString(),
  } as never);
  if (error) {
    console.error("[member] portal session insert failed", error);
    return null;
  }
  return token;
}

export async function destroySession(token: string) {
  await supabaseAdmin.from("member_sessions").delete().eq("token", token);
}

export type EnrollmentRow = {
  id: string;
  tier: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  activated_at: string | null;
  expires_at?: string | null;
};

/** Highest active package the member holds (free when they hold none). */
export function highestActiveTier(rows: EnrollmentRow[]): TierId {
  const now = Date.now();
  const active = rows.filter(
    (r) =>
      r.status === "active" &&
      (!r.expires_at || new Date(r.expires_at).getTime() > now),
  );
  let best: TierId = "free";
  for (const r of active) {
    if ((TIER_RANK[r.tier] ?? 0) > (TIER_RANK[best] ?? 0)) best = r.tier as TierId;
  }
  return best;
}

export function accountLink(sessionToken: string) {
  return `${SITE_URL}/account?s=${sessionToken}`;
}

export { getTier };
