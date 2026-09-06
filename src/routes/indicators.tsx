import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Send, ShieldCheck, Zap } from "lucide-react";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { Tools } from "@/components/landing/Tools";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { localizedHead } from "@/lib/seo";
import { trackPageLoad, trackEngagement, goTrack } from "@/lib/analytics";

export function indicatorsHead(locale: "en" | "ms") {
  const t = translations[locale];
  return localizedHead({
    path: "/indicators",
    locale,
    title: t.indicators_meta_title,
    description: t.indicators_meta_desc,
    ogDescription: t.indicators_og_desc,
  });
}

export const Route = createFileRoute("/indicators")({
  head: () => indicatorsHead("en"),
  component: IndicatorsPage,
});

export function IndicatorsPage() {
  const { t } = useTranslation();

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
            <Zap className="h-3.5 w-3.5 text-primary" /> {t("indicators_desk_label")}
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl">{t("indicators_title")}</h1>
          <p className="mt-3 text-sm text-body sm:text-base">{t("indicators_subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a
                href={LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("indicators_hero_bot")}
              >
                <Send className="h-4 w-4" /> {t("indicators_cta_get")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={LINKS.support}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => goTrack("indicators_hero_ask_sarah")}
              >
                {t("indicators_cta_ask")}
              </a>
            </Button>
          </div>
        </header>

        <section className="glass-card mt-10 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-lg ">{t("indicators_vantage_title")}</h2>
              <p className="mt-2 text-sm text-body">{t("indicators_vantage_body")}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <Button asChild>
                <a
                  href="https://vigco.co/la-scom-inv/ms/oQQlQ8yM"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack("indicators_vantage_open_account")}
                >
                  <ShieldCheck className="h-4 w-4" /> {t("indicators_vantage_open")}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={LINKS.bot}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack("indicators_vantage_free_access")}
                >
                  {t("indicators_vantage_free")} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Tools />

      <p className="mx-auto max-w-6xl px-4 pb-12 text-xs text-muted-foreground sm:px-6 lg:px-8">
        {t("indicators_footnote")}
      </p>

      <Footer />
    </div>
  );
}
