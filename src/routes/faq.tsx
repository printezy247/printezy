import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Faq, Nav, Footer, FAQ_GROUPS, brandLogo } from "@/components/landing/Landing";
import { trackPageLoad, trackEngagement } from "@/lib/analytics";
import { SITE_URL } from "@/lib/bot/tiers";
import { translations, type TranslationKey } from "@/lib/translations";
import { useTranslation, useLocale } from "@/lib/i18n";

/**
 * Generated from the exact same FAQ_GROUPS + translations that <Faq />
 * renders, so the schema can never drift from the visible text.
 */
export function buildFaqJsonLd(locale: "en" | "ms") {
  const dict = translations[locale];
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((group) =>
      group.items.map((item: { qKey: TranslationKey; aKey: TranslationKey }) => ({
        "@type": "Question",
        name: dict[item.qKey],
        acceptedAnswer: { "@type": "Answer", text: dict[item.aKey] },
      })),
    ),
  });
}

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — EzyMap ALGO Trading Signals" },
      {
        name: "description",
        content:
          "Answers about EzyMap ALGO trading routines, pricing tiers, the 30-day Vantage trial, enrollment, your account, and support.",
      },
      { property: "og:title", content: "FAQ — EzyMap ALGO Trading Signals" },
      {
        property: "og:description",
        content: "Everything you need to know about EzyMap ALGO signals and subscriptions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/faq` },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ms_MY" },
      { property: "og:image", content: `${SITE_URL}${brandLogo}` },
      { property: "og:image:alt", content: "EzyMap ALGO logo" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/faq` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/faq` },
      { rel: "alternate", hrefLang: "ms", href: `${SITE_URL}/ms/faq` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/faq` },
    ],
    scripts: [{ type: "application/ld+json", children: buildFaqJsonLd("en") }],
  }),
  component: FaqPage,
});

export function FaqPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  useEffect(() => {
    trackPageLoad("faq");
    const stop = trackEngagement();
    return () => stop?.();
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="pt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-4">
          <Link
            to={locale === "ms" ? "/ms" : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("faq_back_to_home")}
          </Link>
        </div>
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
