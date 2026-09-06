import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Landing";
import { useTranslation } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { localizedHead } from "@/lib/seo";

export function privacyHead(locale: "en" | "ms") {
  const t = translations[locale];
  return localizedHead({
    path: "/privacy",
    locale,
    title: t.privacy_meta_title,
    description: t.privacy_meta_desc,
    ogDescription: t.privacy_og_desc,
    twitterCard: "summary",
  });
}

export const Route = createFileRoute("/privacy")({
  head: () => privacyHead("en"),
  component: PrivacyPage,
});

export function PrivacyPage() {
  const { t, locale } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl">{t("privacy_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("legal_updated")}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>{t("privacy_intro")}</p>
          <div>
            <h2 className="text-lg text-foreground">{t("privacy_collect_title")}</h2>
            <p className="mt-2">{t("privacy_collect_body")}</p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">{t("privacy_use_title")}</h2>
            <p className="mt-2">{t("privacy_use_body")}</p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">{t("privacy_telegram_title")}</h2>
            <p className="mt-2">{t("privacy_telegram_body")}</p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">{t("privacy_contact_title")}</h2>
            <p className="mt-2">
              {t("privacy_contact_body")}{" "}
              <a href="https://t.me/EzySarah" className="text-primary hover:underline">
                @EzySarah
              </a>
              .
            </p>
          </div>
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
