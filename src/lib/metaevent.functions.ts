import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  eventName: z.enum(["PageView", "ViewContent", "Lead", "InitiateCheckout", "StartTrial"]),
  sessionId: z.string().min(1).max(64),
  eventId: z.string().min(1).max(120),
  path: z.string().max(300).optional().nullable(),
  contentName: z.string().max(120).optional().nullable(),
  contentId: z.string().max(60).optional().nullable(),
  valueCents: z.number().int().min(0).max(10_000_000).optional().nullable(),
  fbp: z.string().max(120).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
});

/**
 * Report a site-side conversion to Meta. Called from the browser only after
 * the consent gate passes; silently no-ops when the pixel isn't configured.
 */
export const reportSiteMetaEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { reportSiteEvent } = await import("@/lib/bot/meta.server");
    const { checkRateLimit } = await import("@/lib/rate-limit.server");
    const { getCatalogItem } = await import("@/lib/catalog");
    // Unauthenticated relay into the ad account: cap it, and never trust a
    // browser-supplied value — the catalog price for the SKU is the value.
    const allowed = await checkRateLimit("meta_event", data.sessionId, {
      max: 60,
      windowMs: 10 * 60 * 1000,
    });
    if (!allowed) return { ok: false };
    const catalogValue = data.contentId ? getCatalogItem(data.contentId)?.amountCents : undefined;
    await reportSiteEvent({
      eventName: data.eventName,
      sessionId: data.sessionId,
      eventId: data.eventId,
      path: data.path ?? undefined,
      contentName: data.contentName ?? undefined,
      contentId: data.contentId ?? undefined,
      valueCents: catalogValue,
      fbp: data.fbp ?? undefined,
      userAgent: data.userAgent ?? undefined,
    });
    return { ok: true };
  });
