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
        <div className="home-hero__actions">
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
      <figure className="home-hero__desk">
        <MarketingLoop
          className="home-hero__film"
          src="/ezymap-chart-desk.mp4"
          poster="/ezymap-chart-desk.webp"
          locale={locale}
        />
        <figcaption>
          <span dir="ltr">XAUUSD / M15</span>
          <span>{t("hero_sample_badge")}</span>
        </figcaption>
      </figure>
    </section>
  );
}
