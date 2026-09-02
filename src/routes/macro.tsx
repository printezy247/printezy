import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Nav, Footer } from "@/components/landing/Landing";
import { trackPageLoad, trackEngagement } from "@/lib/analytics";
import {
  CALENDAR_EVENTS,
  CRYPTO_MOVERS,
  MACRO_CATEGORIES,
  MACRO_UPDATES,
  formatUpdateTime,
  type MacroCategory,
} from "@/lib/macro-data";

export const Route = createFileRoute("/macro")({
  head: () => ({
    meta: [
      { title: "Macro & Crypto Updates — EzyMap Algo" },
      {
        name: "description",
        content:
          "Daily macro, fundamentals and crypto updates for gold, forex and digital assets, with an economic calendar and crypto movers board.",
      },
      { property: "og:title", content: "Macro & Crypto Updates — EzyMap Algo" },
      {
        property: "og:description",
        content:
          "Macro, fundamentals and crypto briefings with affected instruments, an economic calendar and crypto movers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Macro & Crypto Updates — EzyMap Algo" },
      {
        name: "twitter:description",
        content: "Macro, fundamentals and crypto briefings for gold, forex and digital assets.",
      },
    ],
  }),
  component: MacroPage,
});

const FILTERS: ("All" | MacroCategory)[] = ["All", ...MACRO_CATEGORIES];

function categoryTone(category: MacroCategory) {
  return category === "Crypto"
    ? "bg-primary-tint text-primary"
    : "bg-accent-tint text-accent-glow";
}

function MacroPage() {
  const [filter, setFilter] = useState<"All" | MacroCategory>("All");

  useEffect(() => {
    trackPageLoad("macro");
    const stop = trackEngagement();
    return () => stop?.();
  }, []);

  const updates = useMemo(
    () => (filter === "All" ? MACRO_UPDATES : MACRO_UPDATES.filter((u) => u.category === filter)),
    [filter],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="border-b border-border pb-6">
          <h1 className="text-[30px] font-black leading-tight sm:text-[36px]">
            Macro &amp; Crypto Updates
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-body">
            Fundamentals, central-bank flow and digital-asset briefings that shape our gold, forex
            and crypto signals.
          </p>
        </header>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
          {/* Feed */}
          <div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    filter === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white text-body hover:border-primary hover:text-primary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {updates.map((u) => (
                <article key={u.id} className="rounded-md border border-border bg-white p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${categoryTone(u.category)}`}
                    >
                      {u.category}
                    </span>
                    <span className="text-[11.5px] font-medium text-muted-foreground">
                      {formatUpdateTime(u.publishedAt)}
                    </span>
                  </div>
                  <h2 className="mt-2.5 text-lg font-bold leading-snug">{u.headline}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-body">{u.summary}</p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {u.instruments.map((i) => (
                      <span
                        key={i}
                        className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11.5px] font-semibold text-body"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
              {updates.length === 0 ? (
                <p className="rounded-md border border-border bg-white p-5 text-sm text-muted-foreground">
                  No updates in this category yet.
                </p>
              ) : null}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="rounded-md border border-border bg-white">
              <h2 className="border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Economic calendar · today (UTC)
              </h2>
              <ul>
                {CALENDAR_EVENTS.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <span className="w-11 shrink-0 text-[12.5px] font-bold tabular-nums text-foreground">
                      {e.time}
                    </span>
                    <span className="w-9 shrink-0 text-[11px] font-bold uppercase text-muted-foreground">
                      {e.country}
                    </span>
                    <span className="flex-1 text-[12.5px] text-body">{e.event}</span>
                    <span className="flex shrink-0 gap-0.5" aria-label={`Impact ${e.impact} of 3`}>
                      {[1, 2, 3].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              d <= e.impact ? "var(--market-down)" : "var(--border)",
                          }}
                        />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-md border border-border bg-white">
              <h2 className="border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Crypto movers · indicative
              </h2>
              <ul>
                {CRYPTO_MOVERS.map((m) => (
                  <li
                    key={m.symbol}
                    className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <span className="w-11 shrink-0 text-[12.5px] font-bold text-foreground">
                      {m.symbol}
                    </span>
                    <span className="flex-1 text-[12.5px] text-muted-foreground">{m.name}</span>
                    <span className="text-[12.5px] font-semibold tabular-nums text-foreground">
                      {m.price}
                    </span>
                    <span
                      className="w-16 shrink-0 text-right text-[12.5px] font-bold tabular-nums"
                      style={{
                        color: m.changePct >= 0 ? "var(--market-up)" : "var(--market-down)",
                      }}
                    >
                      {m.changePct >= 0 ? "+" : ""}
                      {m.changePct.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Content shown is illustrative placeholder data pending the automated feed. Nothing
              here is personalized financial advice; trading carries risk of loss.
            </p>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
