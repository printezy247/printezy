import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Send, ShieldCheck, Zap } from "lucide-react";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { Tools } from "@/components/landing/Tools";
import { trackPageLoad, trackEngagement, goTrack } from "@/lib/analytics";

export const Route = createFileRoute("/indicators")({
  head: () => ({
    meta: [
      { title: "Indicators & Pricing — EzyMap Algo" },
      {
        name: "description",
        content:
          "EzyMap TradingView and MT5 indicators with real prices: EzyMap Lite $49, EzyMap Pro $249, MT5 bundle from $99/month and single tools from $9/month.",
      },
      { property: "og:title", content: "Indicators & Pricing — EzyMap Algo" },
      {
        property: "og:description",
        content:
          "TradingView and MT5 indicators from EzyMap Algo — Drawdown Guardian, Bulk Close, Auto TPSL, MTF Bias and more, with live pricing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndicatorsPage,
});

function IndicatorsPage() {
  useEffect(() => {
    trackPageLoad("indicators");
    const stop = trackEngagement();
    return stop;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" /> EzyMap indicator desk
          </span>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Indicators</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            The same TradingView and MT5 tools our members trade with — mapping, risk control and multi-timeframe bias.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => goTrack("indicators_hero_bot")}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Send className="h-4 w-4" /> Get Your Indicator
            </a>
            <a
              href={LINKS.support}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => goTrack("indicators_hero_ask_sarah")}
              className="inline-flex items-center gap-2 rounded-md border border-[rgba(201,161,58,0.45)] px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              Ask Sarah
            </a>
          </div>
        </header>

        <section className="glass-card mt-10 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold">Free access with a Vantage activation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Open an account under IB 26468008 and the indicators bundled with your package are unlocked at no extra
                cost — Lite on Beginner, Currency Strength on Pro, Auto TPSL and MTF Bias on Premium, the full MT5 set on
                Elite.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <a
                href="https://vigco.co/la-scom-inv/ms/oQQlQ8yM"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("indicators_vantage_open_account")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ShieldCheck className="h-4 w-4" /> Open Account
              </a>
              <a
                href={LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("indicators_vantage_free_access")}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-accent/60 bg-accent/5 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                Get Free Access <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Tools />

      <p className="mx-auto max-w-6xl px-4 pb-12 text-xs text-muted-foreground sm:px-6 lg:px-8">
        Prices are in USD and are confirmed inside the enrollment bot before payment. Trading carries risk of loss.
      </p>

      <Footer />
    </div>
  );
}
