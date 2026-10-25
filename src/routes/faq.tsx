import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Faq, Nav, Footer, FAQ_GROUPS } from "@/components/landing/Landing";
import { trackPageLoad, trackEngagement } from "@/lib/analytics";
import { localizedHead } from "@/lib/seo";
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

const HEAD = localizedHead({
  path: "/faq",
  locale: "en",
  title: "FAQ — EzyMap ALGO Trading Signals",
  description:
    "Answers about EzyMap ALGO trading routines, pricing tiers, the 30-day Vantage trial, enrollment, your account, and support.",
  ogDescription: "Everything you need to know about EzyMap ALGO signals and subscriptions.",
  image: "default",
  crumbName: "FAQ",
});

export const Route = createFileRoute("/faq")({
  head: () => ({
    ...HEAD,
    scripts: [...HEAD.scripts, { type: "application/ld+json", children: buildFaqJsonLd("en") }],
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
          {/* The page's own h1. <Faq /> renders the section heading as an h2,
              so without this the document jumped straight to a subheading. */}
          <h1 className="mt-6 text-3xl sm:text-4xl">{t("footer_faq")}</h1>
        </div>
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
