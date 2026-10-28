import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Faq, Nav, Footer } from "@/components/landing/Landing";
import { trackPageLoad, trackEngagement } from "@/lib/analytics";
import { localizePath } from "@/lib/i18n";
import { localizedHead, type PageLocale } from "@/lib/seo";
import { translations } from "@/lib/translations";
import { buildFaqJsonLd } from "@/lib/faq-schema";
export { buildFaqJsonLd } from "@/lib/faq-schema";
import { useTranslation, useLocale } from "@/lib/i18n";

/** The FAQ head, shared by `/faq` and every translated twin. */
export function faqHead(locale: PageLocale) {
  const t = translations[locale];
  return localizedHead({
    path: "/faq",
    locale,
    title: t.faq_meta_title,
    description: t.faq_meta_desc,
    image: "default",
    crumbName: t.footer_faq,
  });
}

export const Route = createFileRoute("/faq")({
  head: () => {
    const HEAD = faqHead("en");
    return {
      ...HEAD,
      scripts: [...HEAD.scripts, { type: "application/ld+json", children: buildFaqJsonLd("en") }],
    };
  },
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
          {/* A plain anchor: the localized twins are one `$lang` route, so the
              router cannot type a per-locale literal for them. */}
          <a
            href={localizePath("/", locale)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("faq_back_to_home")}
          </a>
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
