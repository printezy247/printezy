import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const saveLeadSchema = z.object({
  email: z.string().email().max(120),
  name: z.string().max(80).optional(),
  source: z.enum(["free-channel", "free-ebook"]),
  telegramUsername: z.string().max(60).optional(),
  sessionId: z.string().max(80).optional(),
});

export const saveLead = createServerFn({ method: "POST" })
  .inputValidator(saveLeadSchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.trim().toLowerCase();
    const name = data.name?.trim() || null;
    const telegramUsername = data.telegramUsername?.trim().replace(/^@/, "") || null;

    const { error } = await supabaseAdmin.from("leads").insert({
      email,
      name,
      source: data.source,
      telegram_username: telegramUsername,
      session_id: data.sessionId?.trim() || null,
    });

    if (error) {
      console.error("Failed to save lead:", error);
      throw new Error("Could not save your details. Please try again.");
    }

    return { ok: true };
  });
