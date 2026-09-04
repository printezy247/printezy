// Website live-chat with Sarah. Visitors type in the widget; the same keyword
// reply book the Telegram bot uses answers instantly, and anything it has no
// answer for is relayed to Sarah's Telegram inbox. Her replies come back here.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const sendSchema = z.object({
  sessionId: z.string().min(4).max(80),
  name: z.string().max(60).nullable().optional(),
  text: z.string().min(1).max(1500),
  entryId: z.string().max(60).nullable().optional(),
});

const fetchSchema = z.object({
  sessionId: z.string().min(4).max(80),
  afterId: z.number().int().nonnegative().default(0),
});

export type SupportLink = { label: string; url: string };
export type SupportQuick = { label: string; entryId: string };

export type SupportMessage = {
  id: number;
  role: "visitor" | "sarah";
  author: string;
  text: string;
  createdAt: string;
  links?: SupportLink[];
  quick?: SupportQuick[];
};

const BOT_AUTHOR = "Sarah (assistant)";
const HUMAN_AUTHOR = "Sarah";

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator(sendSchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { answerFor, entryAnswer } = await import("@/lib/bot/replies.server");
    const { relayWebToSarah } = await import("@/lib/bot/sarah.server");
    const { checkRateLimit } = await import("@/lib/rate-limit.server");

    const allowed = await checkRateLimit("support_message", data.sessionId, {
      max: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!allowed) {
      throw new Error("You're sending messages a bit fast — please wait a moment and try again.");
    }

    const visitor = (data.name ?? "").trim().slice(0, 60) || "Website visitor";
    const text = data.text.trim();

    await supabaseAdmin.from("support_messages").insert({
      web_session_id: data.sessionId,
      display_name: visitor,
      direction: "to_sarah",
      text,
    });

    const answer = data.entryId ? entryAnswer(data.entryId, "en") : answerFor(text, null);

    if (answer) {
      await supabaseAdmin.from("support_messages").insert({
        web_session_id: data.sessionId,
        display_name: BOT_AUTHOR,
        direction: "to_member",
        text: answer.text,
      });
      return { answered: true, ...answer };
    }

    const relayed = await relayWebToSarah(data.sessionId, visitor, text);
    const notice = relayed
      ? "Sent to Sarah — she answers personally, usually within a few hours. Keep this chat open and her reply lands right here."
      : "Sarah isn't reachable this second. Message her directly on Telegram and she'll pick it up: https://t.me/ezysarah";

    await supabaseAdmin.from("support_messages").insert({
      web_session_id: data.sessionId,
      display_name: BOT_AUTHOR,
      direction: "to_member",
      text: notice,
    });

    return {
      answered: false,
      text: notice,
      links: relayed ? [] : [{ label: "Message Sarah on Telegram", url: "https://t.me/ezysarah" }],
      quick: [],
    };
  });

export const fetchSupportMessages = createServerFn({ method: "POST" })
  .inputValidator(fetchSchema)
  .handler(async ({ data }): Promise<SupportMessage[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("support_messages")
      .select("id, direction, text, display_name, created_at, sarah_message_id")
      .eq("web_session_id", data.sessionId)
      .gt("id", data.afterId)
      .order("id", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[support] history read failed", error);
      return [];
    }

    return (rows ?? [])
      // relay-log rows (the copy sent to Sarah) are bookkeeping, not chat
      .filter((row) => !(row.direction === "to_sarah" && row.sarah_message_id))
      .map((row) => ({
      id: Number(row.id),
      role: row.direction === "to_sarah" ? ("visitor" as const) : ("sarah" as const),
      author:
        row.direction === "to_sarah"
          ? (row.display_name ?? "You")
          : (row.display_name ?? HUMAN_AUTHOR),
      text: row.text ?? "",
      createdAt: String(row.created_at),
    }));
  });
