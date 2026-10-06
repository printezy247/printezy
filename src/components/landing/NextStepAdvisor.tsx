import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, BookOpen, LineChart, Send } from "lucide-react";
import { getNextStepRecommendation } from "@/lib/advisor.functions";
import { getSessionId, goTrack } from "@/lib/analytics";

const LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
] as const;

const STEPS = {
  ebook: { title: "Free Technical Analysis ebook", icon: BookOpen, to: "/ebooks/technical-analysis", cta: "Get the free ebook" },
  analysis: { title: "Macro & Crypto analysis", icon: LineChart, to: "/macro", cta: "See the analysis" },
  channel: { title: "Free Telegram channel", icon: Send, to: "/free-channel", cta: "Join the free channel" },
} as const;

type Result = { step: keyof typeof STEPS; reason: string };

export function NextStepAdvisor() {
  const [experience, setExperience] = useState<(typeof LEVELS)[number]["id"]>("beginner");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (goals.trim().length < 3) return setError("Tell us a little about your goals.");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await getNextStepRecommendation({ data: { experience, goals, sessionId: getSessionId() } });
      setResult(r);
      goTrack(`advisor_${r.step}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const step = result ? STEPS[result.step] : null;

  return (
    <section id="next-step" className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
          <Sparkles className="h-4 w-4" /> AI-powered guide
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">Not sure where to start?</h2>
        <p className="mt-3 text-muted-foreground">
          Share your experience and goals — we'll suggest the best free next step for you.
        </p>

        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-5 text-left sm:p-6">
          <span className="text-sm font-medium text-foreground">Your experience level</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setExperience(l.id)}
                aria-pressed={experience === l.id}
                className={`rounded-lg border px-2 py-2 text-sm transition-colors ${
                  experience === l.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <label htmlFor="advisor-goals" className="mt-5 block text-sm font-medium text-foreground">
            Your financial goals
          </label>
          <textarea
            id="advisor-goals"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Build a side income from forex while keeping my day job"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Finding your next step…" : "Get my recommendation"}
          </button>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        </form>

        {result && step && (
          <div className="mt-6 rounded-2xl border border-primary/40 bg-card p-6 text-center" aria-live="polite">
            <step.icon className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-3 text-xl font-semibold text-foreground">{step.title}</h3>
            {result.reason && <p className="mt-2 text-sm text-muted-foreground">{result.reason}</p>}
            <Link
              to={step.to}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {step.cta}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
