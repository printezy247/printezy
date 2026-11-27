import { ArrowRight, Send } from "lucide-react";
import { MarketingLoop } from "@/components/brand/MarketingLoop";
import { goTrack } from "@/lib/analytics";
import { localizePath, useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LaunchHero() {
  const { t, locale } = useTranslation();
  return (
    <section id="hero" className="home-hero" aria-labelledby="home-title">
      <div className="home-hero__copy">
        <h1 id="home-title">EzyMap ALGO</h1>
        <p className="home-hero__lead">{t("hero_title")}</p>
        <p className="home-hero__body">{t("hero_subtitle")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary">
            <a
              href={localizePath("/free-channel", locale)}
              onClick={() => goTrack("hero_join_free")}
            >
              <Send aria-hidden="true" /> {t("hero_cta_join")}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="#packages" onClick={() => goTrack("hero_see_packages")}>
              {t("hero_cta_packages")} <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
      <MarketingLoop
        className="home-hero__film"
        src="/ezymap-signal-stack-light.mp4"
        poster="/ezymap-signal-stack-light.webp"
        locale={locale}
      />
    </section>
  );
}
