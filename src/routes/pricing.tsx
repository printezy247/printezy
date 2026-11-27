import { createFileRoute } from "@tanstack/react-router";
import { MarketingProvider, Pricing, TrackRecord } from "@/components/landing/LandingSections";
import { Footer, Nav } from "@/components/landing/SiteChrome";
import { useTranslation } from "@/lib/i18n";
import { localizedHead } from "@/lib/seo";
import { translations } from "@/lib/translations";

export const Route = createFileRoute("/pricing")({
  head: () =>
    localizedHead({
      path: "/pricing",
      locale: "en",
      title: "Trading Signal Packages & Pricing | EzyMap ALGO",
      description: translations.en.pricing_subtitle,
      twinPath: null,
    }),
  component: PricingPage,
});

function PricingPage() {
  const { t } = useTranslation();
  return (
    <MarketingProvider>
      <div className="ezm-site ezm-light min-h-screen bg-background text-foreground">
        <Nav theme="light" />
        <main id="main-content">
          <h1 className="sr-only">{t("nav_packages")}</h1>
          <Pricing />
          <TrackRecord />
        </main>
        <Footer theme="light" />
      </div>
    </MarketingProvider>
  );
}
