import { createFileRoute } from "@tanstack/react-router";

import { getTier } from "@/lib/bot/tiers";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { deriveWebhookSecret, safeEqual, answerCallbackQuery } =
          await import("@/lib/bot/telegram.server");
        const {
          upsertBotUser,
          activateFreeTier,
          startPaidEnrollment,
          offerVantageTrial,
          activateVantageTrial,
          reportLead,
        } = await import("@/lib/bot/enrollment.server");
        const {
          sendMainMenu,
          sendPackages,
          sendPaymentStatus,
          sendAccountLink,
          sendAskSarah,
          sendFallback,
        } = await import("@/lib/bot/menu.server");

        const expected = await deriveWebhookSecret();
        const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as {
          message?: {
            message_id?: number;
            chat?: { id?: number };
            from?: { id?: number; username?: string; first_name?: string };
            text?: string;
            reply_to_message?: { message_id?: number };
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
            const data = cq.data ?? "";
            const tierId = data.startsWith("tier:") ? data.slice(5) : null;

            if (data === "sarah:start") {
              const { openSarahChat } = await import("@/lib/bot/sarah.server");
              await openSarahChat(telegramId);
            } else if (data === "sarah:end") {
              const { closeSarahChat } = await import("@/lib/bot/sarah.server");
              await closeSarahChat(telegramId);
            } else if (data === "vantage:confirm") {
              await activateVantageTrial(telegramId);
            } else if (tierId === "vantage") {
              await offerVantageTrial(telegramId);
            } else if (tierId === "free") {
              await activateFreeTier(telegramId);
            } else if (tierId && getTier(tierId)) {
              await startPaidEnrollment(telegramId, tierId);
            } else if (data === "menu:packages" || data === "menu:home") {
              await sendPackages(telegramId);
            } else if (data === "menu:status") {
              await sendPaymentStatus(telegramId, telegramId);
            } else if (data === "menu:account") {
              await sendAccountLink(telegramId, telegramId);
            }
            return Response.json({ ok: true });
          }

          const message = update.message;
          const telegramId = message?.from?.id ?? message?.chat?.id;
          if (!telegramId) return Response.json({ ok: true, ignored: true });

          const text = (message?.text ?? "").trim();

          // --- Sarah's side of the relay -------------------------------
          // /support_login <code> registers this chat as Sarah's inbox.
          if (text.startsWith("/support_login")) {
            const { registerSupportChat } = await import("@/lib/bot/sarah.server");
            const code = text.slice("/support_login".length).trim();
            const ok = await registerSupportChat(telegramId, code);
            await sendMessageHelpText(
              telegramId,
              ok
                ? `✅ This chat is now Sarah's inbox. Member messages arrive here — reply to any of them (Telegram "reply") and it goes straight back to that member.`
                : `Invalid code.`,
            );
            return Response.json({ ok: true });
          }

          // A reply from Sarah to a forwarded message goes back to the member.
          {
            const { getSarahChatId, relayFromSarah } = await import("@/lib/bot/sarah.server");
            const sarahChatId = await getSarahChatId();
            if (sarahChatId && telegramId === sarahChatId) {
              const delivered = await relayFromSarah(
                sarahChatId,
                message?.reply_to_message?.message_id,
                text,
              );
              if (!delivered) {
                await sendMessageHelpText(
                  telegramId,
                  `Reply directly to a member's message (Telegram "reply") and I'll deliver it to them.`,
                );
              }
              return Response.json({ ok: true });
            }
          }

          // --- Member side ----------------------------------------------
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

          if (text.startsWith("/start") || text === "") {
            await sendMainMenu(telegramId, message?.from?.first_name);
          } else if (text.startsWith("/packages") || text.startsWith("/enroll")) {
            await sendPackages(telegramId);
          } else if (text.startsWith("/status")) {
            await sendPaymentStatus(telegramId, telegramId);
          } else if (text.startsWith("/account") || text.startsWith("/dashboard")) {
            await sendAccountLink(telegramId, telegramId);
          } else if (text.startsWith("/ask") || text.startsWith("/sarah")) {
            await sendAskSarah(telegramId);
          } else if (text.startsWith("/end")) {
            const { closeSarahChat } = await import("@/lib/bot/sarah.server");
            await closeSarahChat(telegramId);
          } else if (text.startsWith("/help")) {
            await sendMessageHelp(telegramId);
          } else {
            // Free text: relay it to Sarah when the member is in chat mode.
            const { isInChatMode, relayToSarah } = await import("@/lib/bot/sarah.server");
            if (await isInChatMode(telegramId)) {
              const relayed = await relayToSarah(
                {
                  telegramId,
                  username: message?.from?.username ?? null,
                  firstName: message?.from?.first_name ?? null,
                },
                text,
              );
              await sendMessageHelpText(
                telegramId,
                relayed
                  ? `✅ Sent to Sarah — her reply will land right here.`
                  : `Couldn't reach Sarah just now — try again in a moment.`,
              );
            } else {
              // The bot is menu-driven, so guide back to it.
              await sendFallback(telegramId);
            }
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

async function sendMessageHelp(chatId: number) {
  const { sendMessage } = await import("@/lib/bot/telegram.server");
  const { SUPPORT } = await import("@/lib/bot/menu.server");
  await sendMessage(
    chatId,
    `<b>What I can do</b>\n\n/packages — browse packages and prices\n/status — check your payment & access\n/account — open your trading account\n/ask — message Sarah (human support)\n\nAnything else, reach us directly: ${SUPPORT}`,
  );
}
