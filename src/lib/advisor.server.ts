import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const NEXT_STEPS = ["ebook", "analysis", "channel"] as const;
export type NextStep = (typeof NEXT_STEPS)[number];

const INSTRUCTIONS = `You help prospective traders at EzyMap ALGO pick ONE next step.
Options:
- "ebook": free Technical Analysis ebook — best for beginners who need foundations.
- "analysis": Macro & Crypto analysis desk — best for traders who want market context, fundamentals and macro calendars.
- "channel": free Telegram signals channel — best for traders ready to watch live trade ideas daily.
Reply ONLY with JSON: {"step":"ebook"|"analysis"|"channel","reason":"one or two friendly sentences addressed to the trader, max 40 words"}.
Never promise profits or give personal financial advice.`;

export async function recommendNextStep(input: { experience: string; goals: string }) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: INSTRUCTIONS,
    messages: [
      {
        role: "user",
        content: `Experience level: ${input.experience}\nFinancial goals: ${input.goals}\nReturn json.`,
      },
    ],
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  const match = text.match(/\{[\s\S]*\}/);
  let step: NextStep = input.experience === "beginner" ? "ebook" : "channel";
  let reason = "";
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as { step?: string; reason?: string };
      if (NEXT_STEPS.includes(parsed.step as NextStep)) step = parsed.step as NextStep;
      reason = String(parsed.reason ?? "").slice(0, 300);
    } catch {
      /* fall back to default step */
    }
  }
  return { step, reason };
}
