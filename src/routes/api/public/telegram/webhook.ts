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

            if (data.startsWith("kw:")) {
              const { sendEntry, getLang } = await import("@/lib/bot/replies.server");
              const lang = (await getLang(telegramId)) ?? "en";
              await sendEntry(telegramId, data.slice(3), lang);
            } else if (data.startsWith("trial:")) {
              const { requestTrial } = await import("@/lib/bot/sarah.server");
              await requestTrial(
                {
                  telegramId,
                  username: cq.from?.username ?? null,
                  firstName: cq.from?.first_name ?? null,
                },
                data.slice(6),
              );
            } else if (data.startsWith("buy:")) {
              const [, product, plan] = data.split(":");
              const { requestPurchase } = await import("@/lib/bot/sarah.server");
              await requestPurchase(
                {
                  telegramId,
                  username: cq.from?.username ?? null,
                  firstName: cq.from?.first_name ?? null,
                },
                product ?? "",
                plan ?? "",
              );
            } else if (data === "sarah:start") {
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
          // Her chat registers itself the first time she writes from her handle.
          {
            const { autoRegisterSarah } = await import("@/lib/bot/sarah.server");
            if (await autoRegisterSarah(telegramId, message?.from?.username)) {
              await sendMessageHelpText(
                telegramId,
                `✅ Hi Sarah — this chat is now the support inbox. Member and website messages arrive here; reply to any of them (Telegram "reply") and it goes straight back to that person.`,
              );
              return Response.json({ ok: true });
            }
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
            sessionId: startPayload && !/^EZY-/i.test(startPayload) ? startPayload : null,
          });

          // One-time claim code from the website success page / email.
          const claimCode =
            startPayload && /^EZY-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/i.test(startPayload)
              ? startPayload.toUpperCase()
              : null;

          if (claimCode) {
            const { claimByCode } = await import("@/lib/bot/site-access.server");
            await claimByCode({
              telegramId,
              username: message?.from?.username ?? null,
              code: claimCode,
            });
          }

          // Website purchases waiting on this handle are approved on contact.
          {
            const { claimSitePurchases } = await import("@/lib/bot/site-access.server");
            await claimSitePurchases({
              telegramId,
              username: message?.from?.username ?? null,
            });
          }

          if (startPayload && !claimCode) {
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
          } else if (text.startsWith("/language") || text.startsWith("/bahasa")) {
            const { setLang, sendEntry } = await import("@/lib/bot/replies.server");
            const wanted = text.toLowerCase().includes("ms") ? "ms" : "en";
            await setLang(telegramId, wanted);
            await sendEntry(telegramId, "greeting", wanted);
          } else if (text.startsWith("/faq")) {
            const { sendEntry, getLang } = await import("@/lib/bot/replies.server");
            await sendEntry(telegramId, "faq", (await getLang(telegramId)) ?? "en");
          } else if (text.startsWith("/products")) {
            const { sendEntry, getLang } = await import("@/lib/bot/replies.server");
            await sendEntry(telegramId, "products", (await getLang(telegramId)) ?? "en");
          } else if (text.startsWith("/help")) {
            await sendMessageHelp(telegramId);
          } else {
            // Free text: even in chat mode, Sarah's own answers come first —
            // she is only pinged for questions the reply book can't handle.
            const { isInChatMode, relayToSarah } = await import("@/lib/bot/sarah.server");
            if (await isInChatMode(telegramId)) {
              const { handleKeywordMessage, getLang } = await import(
                "@/lib/bot/replies.server"
              );
              const answered = await handleKeywordMessage(
                telegramId,
                text,
                await getLang(telegramId),
              );
              if (answered) return Response.json({ ok: true });

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
              // Sarah's keyword reply book answers first; anything she has no
              // answer for gets forwarded to her once so nobody hits silence.
              const { handleKeywordMessage, getLang } = await import(
                "@/lib/bot/replies.server"
              );
              const member = {
                telegramId,
                username: message?.from?.username ?? null,
                firstName: message?.from?.first_name ?? null,
              };
              const answered = await handleKeywordMessage(
                telegramId,
                text,
                await getLang(telegramId),
              );
              const { alertMissedMessage, clearMissedFlag } = await import(
                "@/lib/bot/sarah.server"
              );
              if (answered) {
                await clearMissedFlag(telegramId);
              } else {
                await alertMissedMessage(member, text);
                await sendFallback(telegramId);
              }
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

async function sendMessageHelpText(chatId: number, text: string) {
  const { sendMessage } = await import("@/lib/bot/telegram.server");
  await sendMessage(chatId, text);
}

async function sendMessageHelp(chatId: number) {
  const { sendMessage } = await import("@/lib/bot/telegram.server");
  const { SUPPORT } = await import("@/lib/bot/menu.server");
  await sendMessage(
    chatId,
    `<b>What I can do</b>\n\n/packages — browse packages and prices\n/status — check your payment & access\n/account — open your trading account\n/ask — message Sarah (human support)\n\nAnything else, reach us directly: ${SUPPORT}`,
  );
}
