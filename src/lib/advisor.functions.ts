import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  goals: z.string().trim().min(3).max(500),
  sessionId: z.string().max(80).optional(),
});

export const getNextStepRecommendation = createServerFn({ method: "POST" })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const { checkRateLimit } = await import("@/lib/rate-limit.server");
    const allowed = await checkRateLimit("next_step_ai", data.sessionId?.trim() || "anonymous", {
      max: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!allowed) throw new Error("Too many requests — please try again in a bit.");
    const { recommendNextStep } = await import("@/lib/advisor.server");
    try {
      return await recommendNextStep({ experience: data.experience, goals: data.goals });
    } catch (e) {
      console.error("[advisor] failed", e);
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 402) throw new Error("Recommendations are temporarily unavailable.");
      if (status === 429) throw new Error("Busy right now — please try again in a minute.");
      throw new Error("Could not get a recommendation — please try again.");
    }
  });
