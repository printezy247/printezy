// Ad attribution dashboard: joins ad_clicks to enrollments on session_id so we
// can see which Meta campaigns actually drive paid enrollments.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdClickRow = {
  sessionId: string;
  fbclid: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPath: string | null;
  createdAt: string;
  tier: string | null;
  status: string | null;
  amountCents: number | null;
  currency: string | null;
  enrolledAt: string | null;
};

export type CampaignRow = {
  campaign: string;
  source: string;
  clicks: number;
  enrollments: number;
  paid: number;
  revenueCents: number;
  currency: string;
};

export type AdDashboard = {
  totals: { clicks: number; enrollments: number; paid: number; revenueCents: number };
  campaigns: CampaignRow[];
  rows: AdClickRow[];
};

export const getAdDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdDashboard> => {
    const { assertAdmin } = await import("@/lib/admin-check.server");
    await assertAdmin(context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [clicksRes, enrollRes] = await Promise.all([
      supabaseAdmin
        .from("ad_clicks")
        .select("session_id, fbclid, utm_source, utm_medium, utm_campaign, landing_path, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("enrollments")
        .select("session_id, tier, status, amount_cents, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (clicksRes.error) throw new Error("Could not load ad clicks.");
    if (enrollRes.error) throw new Error("Could not load enrollments.");

    const bySession = new Map<string, (typeof enrollRes.data)[number]>();
    for (const e of enrollRes.data ?? []) {
      if (e.session_id && !bySession.has(e.session_id)) bySession.set(e.session_id, e);
    }

    const rows: AdClickRow[] = (clicksRes.data ?? []).map((c) => {
      const e = c.session_id ? bySession.get(c.session_id) : undefined;
      return {
        sessionId: c.session_id,
        fbclid: c.fbclid,
        utmSource: c.utm_source,
        utmMedium: c.utm_medium,
        utmCampaign: c.utm_campaign,
        landingPath: c.landing_path,
        createdAt: c.created_at,
        tier: e?.tier ?? null,
        status: e?.status ?? null,
        amountCents: e?.amount_cents ?? null,
        currency: e?.currency ?? null,
        enrolledAt: e?.created_at ?? null,
      };
    });

    const map = new Map<string, CampaignRow>();
    for (const r of rows) {
      const campaign = r.utmCampaign ?? (r.fbclid ? "(meta – untagged)" : "(direct)");
      const source = r.utmSource ?? (r.fbclid ? "facebook" : "(none)");
      const k = `${source}|${campaign}`;
      const cur = map.get(k) ?? {
        campaign,
        source,
        clicks: 0,
        enrollments: 0,
        paid: 0,
        revenueCents: 0,
        currency: r.currency ?? "usd",
      };
      cur.clicks += 1;
      if (r.tier) cur.enrollments += 1;
      if (r.status === "paid" || r.status === "active") {
        cur.paid += 1;
        cur.revenueCents += r.amountCents ?? 0;
        if (r.currency) cur.currency = r.currency;
      }
      map.set(k, cur);
    }

    const campaigns = [...map.values()].sort((a, b) => b.clicks - a.clicks);
    const totals = campaigns.reduce(
      (acc, c) => ({
        clicks: acc.clicks + c.clicks,
        enrollments: acc.enrollments + c.enrollments,
        paid: acc.paid + c.paid,
        revenueCents: acc.revenueCents + c.revenueCents,
      }),
      { clicks: 0, enrollments: 0, paid: 0, revenueCents: 0 },
    );

    return { totals, campaigns, rows };
  });
