import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const authAttempt = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("magic_link"),
    email: z.string().trim().email().max(320),
  }),
  z.object({
    action: z.literal("google_oauth"),
    email: z.string().trim().email().max(320).optional(),
  }),
]);

/** Rate-limit auth initiation before the browser calls Supabase Auth. */
export const checkAuthAttempt = createServerFn({ method: "POST" })
  .inputValidator(authAttempt)
  .handler(async ({ data }): Promise<boolean> => {
    // Google sign-in is usable before an email is known. A unique identifier
    // means that path is rate-limited by the server-observed IP bucket only.
    const normalizedEmail = data.email?.toLowerCase();
    const emailKey = normalizedEmail
      ? [
          ...new Uint8Array(
            await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalizedEmail)),
          ),
        ]
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")
      : crypto.randomUUID();
    const { checkRateLimit } = await import("@/lib/rate-limit.server");
    return checkRateLimit(`auth_${data.action}`, emailKey, {
      max: 10,
      windowMs: 60_000,
      ipMultiplier: 1,
      failClosed: true,
    });
  });
