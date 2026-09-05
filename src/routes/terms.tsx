import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Landing";
import { useTranslation } from "@/lib/i18n";
import { translations, type TranslationKey } from "@/lib/translations";
import { localizedHead } from "@/lib/seo";

export function termsHead(locale: "en" | "ms") {
  const t = translations[locale];
  return localizedHead({
    path: "/terms",
    locale,
    title: t.terms_meta_title,
    description: t.terms_meta_desc,
    ogDescription: t.terms_og_desc,
    twitterCard: "summary",
  });
}

export const Route = createFileRoute("/terms")({
  head: () => termsHead("en"),
  component: TermsPage,
});

const SECTIONS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: "terms_edu_title", body: "terms_edu_body" },
  { title: "terms_packages_title", body: "terms_packages_body" },
  { title: "terms_broker_title", body: "terms_broker_body" },
  { title: "terms_access_title", body: "terms_access_body" },
];

export function TermsPage() {
  const { t, locale } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl">{t("terms_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("legal_updated")}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-lg text-foreground">{t(sec.title)}</h2>
              <p className="mt-2">{t(sec.body)}</p>
            </div>
          ))}
        </div>
        <Link
          to={locale === "ms" ? "/ms" : "/"}
          className="mt-10 inline-block text-sm text-primary hover:underline"
        >
          {t("legal_back_home")}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
