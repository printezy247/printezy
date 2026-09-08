// "Sign in with Telegram" — the server half.
//
// Why it exists: every product this site sells is delivered inside Telegram,
// and until now the only thing tying a payment to a Telegram account was the
// handle the buyer typed at checkout. A typo, a later rename, or an account
// with no username at all and the purchase sits in site_purchases with
// granted_at null while the buyer waits. Telegram's Login Widget replaces
// that typed string with an id Telegram itself signs for, so the delivery has
// nothing left to get wrong.
//
// See telegram-login.server.ts for the signature check and the two manual
// setup steps it depends on.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * The widget hands JavaScript an object with numeric id/auth_date; the client
 * stringifies every field before sending, because the signature covers the
 * exact strings Telegram produced.
 */
const loginPayload = z.object({
  id: z.string().min(1).max(32),
  first_name: z.string().max(200).optional(),
  last_name: z.string().max(200).optional(),
  username: z.string().max(64).optional(),
  photo_url: z.string().max(500).optional(),
  auth_date: z.string().min(1).max(20),
  hash: z.string().min(64).max(64),
});

type LoginPayload = z.infer<typeof loginPayload>;

const REJECTED = "That Telegram sign-in could not be verified. Please try again.";

/** Strips the optional keys Zod leaves as undefined — they are not signed. */
function signedFields(payload: LoginPayload): Record<string, string> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => typeof value === "string"),
  ) as Record<string, string>;
}

/** Remembers the account so the bot can find it later by id or by handle. */
async function rememberBotUser(user: {
  id: number;
  username: string | null;
  firstName: string;
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("bot_users").upsert({
    telegram_id: user.id,
    username: user.username,
    first_name: user.firstName || null,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[telegram-login] bot_users upsert failed", error);
}

/**
 * What the client needs to render the button — the bot's username, and
 * nothing else. Null when the token is missing, which is the signal to keep
 * showing the code-based sign-in instead of a button that cannot work.
 */
export const getTelegramLoginConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ botUsername: string | null }> => {
    const { loginBotUsername, loginConfigured } = await import("@/lib/telegram-login.server");
    return { botUsername: loginConfigured() ? loginBotUsername() : null };
  },
);

/**
 * Sign in to the member area with Telegram, and sweep up anything already
 * paid for along the way.
 */
export const signInWithTelegram = createServerFn({ method: "POST" })
  .inputValidator(loginPayload)
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      token?: string;
      name?: string;
      claimed?: number;
      message?: string;
    }> => {
      const { verifyTelegramLogin } = await import("@/lib/telegram-login.server");
      const user = await verifyTelegramLogin(signedFields(data));
      if (!user) return { ok: false, message: REJECTED };

      await rememberBotUser({ id: user.id, username: user.username, firstName: user.firstName });

      const { createMemberSession } = await import("@/lib/bot/member.server");
      const token = await createMemberSession(user.id);
      if (!token) return { ok: false, message: "Could not start your session — please try again." };

      // Signing in is also the moment to deliver: anything paid for under
      // this handle and still ungranted goes out now.
      const { claimSitePurchases } = await import("@/lib/bot/site-access.server");
      let claimed = 0;
      try {
        claimed = await claimSitePurchases({ telegramId: user.id, username: user.username });
      } catch (error) {
        console.error("[telegram-login] claim on sign-in failed", error);
      }

      return { ok: true, token, name: user.firstName, claimed };
    },
  );

/**
 * Attach a verified Telegram account to the signed-in website account, then
 * deliver everything that account has paid for. This is the path that does
 * not care what was typed at checkout — purchases are matched by account.
 */
export const linkTelegramAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(loginPayload)
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: boolean; username?: string | null; claimed?: number; message?: string }> => {
      const { verifyTelegramLogin } = await import("@/lib/telegram-login.server");
      const user = await verifyTelegramLogin(signedFields(data));
      if (!user) return { ok: false, message: REJECTED };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // One Telegram account per website account, and vice versa: letting two
      // accounts share an id would make "deliver everything this account
      // bought" ambiguous.
      const { data: taken } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("telegram_id", user.id)
        .neq("id", context.userId)
        .maybeSingle();
      if (taken) {
        return {
          ok: false,
          message: "That Telegram account is already linked to another EzyMap ALGO account.",
        };
      }

      await rememberBotUser({ id: user.id, username: user.username, firstName: user.firstName });

      const { error } = await supabaseAdmin.from("profiles").upsert(
        {
          id: context.userId,
          telegram_id: user.id,
          ...(user.username ? { telegram_username: user.username } : {}),
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "id" },
      );
      if (error) {
        console.error("[telegram-login] profile link failed", error);
        return { ok: false, message: "Could not save the link — please try again." };
      }

      const { claimPurchasesForUser, claimSitePurchases } =
        await import("@/lib/bot/site-access.server");
      let claimed = 0;
      try {
        claimed = await claimPurchasesForUser({ userId: context.userId, telegramId: user.id });
        // Purchases made before this account existed are only reachable by
        // handle, so try that too; grants are idempotent on granted_at.
        claimed += await claimSitePurchases({ telegramId: user.id, username: user.username });
      } catch (err) {
        console.error("[telegram-login] claim on link failed", err);
      }

      return { ok: true, username: user.username, claimed };
    },
  );

/**
 * Sign in on /auth with Telegram.
 *
 * Telegram issues no email, and website accounts are keyed on one — every
 * purchase is matched to an account by the address Stripe charged. Minting a
 * website account from a Telegram id would therefore mean inventing an email,
 * and the buyer would end up with two accounts: the invented one they signed
 * in to, and the real one their purchases landed in. So this never creates an
 * account. It resolves to one of two things:
 *
 *   - "website": this Telegram account is already linked to a website
 *     account, so a real Supabase session is minted for it. The token handed
 *     back is the same one a magic link would carry in its URL, issued only
 *     after Telegram's signature proved ownership of the linked account.
 *   - "member": nothing is linked yet, so they get a member-area session
 *     instead — which is keyed on Telegram anyway, and is a real destination
 *     rather than a dead end. Linking is offered on the dashboard.
 */
export const signInWithTelegramToWebsite = createServerFn({ method: "POST" })
  .inputValidator(loginPayload)
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; mode: "website"; tokenHash: string }
      | { ok: true; mode: "member"; token: string; claimed: number }
      | { ok: false; message: string }
    > => {
      const { verifyTelegramLogin } = await import("@/lib/telegram-login.server");
      const user = await verifyTelegramLogin(signedFields(data));
      if (!user) return { ok: false, message: REJECTED };

      await rememberBotUser({ id: user.id, username: user.username, firstName: user.firstName });

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: linked } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("telegram_id", user.id)
        .maybeSingle();

      const linkedId = (linked as { id: string } | null)?.id ?? null;
      if (linkedId) {
        const { data: account } = await supabaseAdmin.auth.admin.getUserById(linkedId);
        const email = account?.user?.email ?? null;
        if (email) {
          const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
          });
          const tokenHash = link?.properties?.hashed_token ?? null;
          if (tokenHash) return { ok: true, mode: "website", tokenHash };
          console.error("[telegram-login] magic link generation failed", error);
        }
      }

      const { createMemberSession } = await import("@/lib/bot/member.server");
      const token = await createMemberSession(user.id);
      if (!token) return { ok: false, message: "Could not start your session — please try again." };

      const { claimSitePurchases } = await import("@/lib/bot/site-access.server");
      let claimed = 0;
      try {
        claimed = await claimSitePurchases({ telegramId: user.id, username: user.username });
      } catch (error) {
        console.error("[telegram-login] claim on sign-in failed", error);
      }
      return { ok: true, mode: "member", token, claimed };
    },
  );

/**
 * Deliver the purchase a checkout session just paid for, straight from the
 * success page. The buyer holds the session id and proves a Telegram account
 * in the same request, so nothing here depends on a handle being right.
 */
export const claimCheckoutWithTelegram = createServerFn({ method: "POST" })
  .inputValidator(loginPayload.extend({ sessionId: z.string().min(8).max(200) }))
  .handler(async ({ data }): Promise<{ ok: boolean; claimed?: number; message?: string }> => {
    const { sessionId, ...payload } = data;
    const { verifyTelegramLogin } = await import("@/lib/telegram-login.server");
    const user = await verifyTelegramLogin(signedFields(payload));
    if (!user) return { ok: false, message: REJECTED };

    await rememberBotUser({ id: user.id, username: user.username, firstName: user.firstName });

    const { claimPurchaseBySession } = await import("@/lib/bot/site-access.server");
    try {
      const claimed = await claimPurchaseBySession({
        stripeSessionId: sessionId,
        telegramId: user.id,
      });
      return { ok: true, claimed };
    } catch (error) {
      console.error("[telegram-login] claim by session failed", error);
      return { ok: false, message: "Could not deliver it just now — please try again." };
    }
  });
