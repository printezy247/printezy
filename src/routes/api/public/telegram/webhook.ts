import { createFileRoute } from "@tanstack/react-router";

import { TIER_CATALOG, formatPrice, getTier } from "@/lib/bot/tiers";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { deriveWebhookSecret, safeEqual, sendMessage, answerCallbackQuery } =
          await import("@/lib/bot/telegram.server");
        const {
          upsertBotUser,
          activateFreeTier,
          startPaidEnrollment,
          offerVantageTrial,
          activateVantageTrial,
          reportLead,
          SUPPORT,
        } = await import("@/lib/bot/enrollment.server");

        const expected = await deriveWebhookSecret();
        const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as {
          message?: {
            chat?: { id?: number };
            from?: { id?: number; username?: string; first_name?: string };
            text?: string;
          };
          callback_query?: {
            id: string;
            data?: string;
            from?: { id?: number; username?: string; first_name?: string };
          };
        };

        try {
          if (update.callback_query) {
            const cq = update.callback_query;
            const telegramId = cq.from?.id;
            if (!telegramId) return Response.json({ ok: true });

            await answerCallbackQuery(cq.id);
            const tierId = (cq.data ?? "").startsWith("tier:")
              ? (cq.data as string).slice(5)
              : null;

            if (cq.data === "vantage:confirm") {
              await activateVantageTrial(telegramId);
            } else if (tierId === "vantage") {
              await offerVantageTrial(telegramId);
            } else if (tierId === "free") {
              await activateFreeTier(telegramId);
            } else if (tierId && getTier(tierId)) {
              await startPaidEnrollment(telegramId, tierId);
            }
            return Response.json({ ok: true });
          }

          const message = update.message;
          const telegramId = message?.from?.id ?? message?.chat?.id;
          if (!telegramId) return Response.json({ ok: true, ignored: true });

          const text = (message?.text ?? "").trim();
          const startPayload = text.startsWith("/start")
            ? text.slice(6).trim().slice(0, 64) || null
            : null;

          await upsertBotUser({
            telegramId,
            username: message?.from?.username ?? null,
            firstName: message?.from?.first_name ?? null,
            sessionId: startPayload,
          });

          if (startPayload) {
            // Ad click -> bot start: this is the Lead conversion for Meta.
            await reportLead(telegramId, startPayload);
          }

          if (text.startsWith("/start") || text.startsWith("/enroll") || text === "") {
            const keyboard = TIER_CATALOG.map((t) => [
              {
                text:
                  t.id === "vantage"
                    ? `${t.name} — free via Vantage`
                    : `${t.name} — ${formatPrice(t.amountCents)}`,
                callback_data: `tier:${t.id}`,
              },
            ]);
            keyboard.push([{ text: "Talk to a human", callback_data: "noop" }]);

            await sendMessage(
              telegramId,
              `👋 <b>Welcome to EzyMap ALGO${message?.from?.first_name ? `, ${message.from.first_name}` : ""}.</b>\n\nPick the package you want and I'll set your account up right here. Paid packages activate automatically the moment payment clears.\n\nNeed help? ${SUPPORT}`,
              keyboard,
            );
          } else if (text.startsWith("/account") || text.startsWith("/dashboard")) {
            const { createMemberSession, accountLink } = await import(
              "@/lib/bot/member.server"
            );
            const sessionToken = await createMemberSession(telegramId);
            await sendMessage(
              telegramId,
              sessionToken
                ? `🔑 <b>Your trading account</b>\n\nThis link signs you in for 30 days — your signals, your trade log, your stats and your billing history.`
                : `Something went wrong opening your account. Try again in a moment.`,
              sessionToken
                ? [[{ text: "Open my account", url: accountLink(sessionToken) }]]
                : undefined,
            );
          } else if (text.startsWith("/help")) {
            await sendMessage(
              telegramId,
              `Send /start to see the packages, /account to open your trading account, or reach us directly: ${SUPPORT}`,
            );
          }

          return Response.json({ ok: true });
        } catch (error) {
          console.error("[telegram webhook] handler error", error);
          // Always 200 so Telegram does not hammer retries on a logic bug.
          return Response.json({ ok: true, handled: false });
        }
      },
    },
  },
});
