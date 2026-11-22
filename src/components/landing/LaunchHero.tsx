import { useState } from "react";
import { MotionControl } from "@/components/brand/MotionControl";
import { ArrowDown, ArrowUpRight, BookOpen, Send } from "lucide-react";
import { EzyMapAsset } from "@/components/brand/EzyMapAsset";
import { useTranslation, localizePath } from "@/lib/i18n";
import { goTrack } from "@/lib/analytics";

export function LaunchHero() {
  const { t, locale } = useTranslation();
  const [playing, setPlaying] = useState(true);
  return (
    <section id="hero" className="launch-hero">
      <div className="launch-hero__copy">
        <a
          className="launch-announcement"
          href={localizePath("/free-channel", locale)}
          onClick={() => goTrack("hero_announce_zoom")}
        >
          <span className="launch-status" aria-hidden="true" />
          {t("announce_pill")}
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <h1>{t("hero_title")}</h1>
        <p className="launch-hero__description">{t("hero_subtitle")}</p>
        <div className="launch-actions">
          <a
            className="launch-button launch-button--primary"
            href={localizePath("/free-channel", locale)}
            onClick={() => goTrack("hero_join_free")}
          >
            <Send size={17} />
            {t("hero_cta_join")}
          </a>
          <a
            className="launch-button launch-button--secondary"
            href="#packages"
            onClick={() => goTrack("hero_see_packages")}
          >
            {t("hero_cta_packages")}
            <ArrowUpRight size={17} />
          </a>
        </div>
        <a
          className="launch-ebook-link"
          href={localizePath("/ebooks/technical-analysis", locale)}
          onClick={() => goTrack("hero_free_ebook")}
        >
          <BookOpen size={15} />
          {t("hero_cta_ebook")}
        </a>
      </div>
      <div className="launch-universe" aria-hidden="true">
        <div className="launch-orbit launch-orbit--outer" />
        <div className="launch-orbit launch-orbit--inner" />
        <div className="launch-gem">
          <EzyMapAsset logo={playing ? "fintech" : "mark"} fetchPriority="high" />
        </div>
        <div className="launch-satellite launch-satellite--channel">
          <EzyMapAsset product="channel" />
          <span>Telegram</span>
        </div>
        <div className="launch-satellite launch-satellite--pro">
          <EzyMapAsset product="pro" />
          <span>EzyMapPro</span>
        </div>
        <div className="launch-satellite launch-satellite--macro">
          <EzyMapAsset product="macro-bot" />
          <span>Macro</span>
        </div>
        <div className="launch-satellite launch-satellite--books">
          <EzyMapAsset product="ebooks" />
          <span>{t("products_ebooks_heading")}</span>
        </div>
        <div className="launch-universe__signature">EzyMap</div>
      </div>
      <MotionControl playing={playing} onToggle={() => setPlaying(!playing)} locale={locale} />
      <a className="launch-explore" href="#signal-demo">
        <span>{t("hero_sample_badge")}</span>
        <ArrowDown size={16} />
      </a>
    </section>
  );
}
