import { useEffect, useRef, useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { MotionControl } from "@/components/brand/MotionControl";
import { goTrack } from "@/lib/analytics";
import { localizePath, useTranslation } from "@/lib/i18n";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { Button } from "@/components/ui/button";

export function LaunchHero() {
  const { t, locale } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    void video.play().catch(() => {});
  }, [reducedMotion]);

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
      <video
        className="home-hero__video"
        ref={videoRef}
        poster="/ezymap-signal-stack-light.webp"
        preload="none"
        muted
        loop
        playsInline
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src="/ezymap-signal-stack-light.mp4" type="video/mp4" />
      </video>
      <div className="home-hero__motion">
        <MotionControl
          locale={locale}
          playing={playing}
          onToggle={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) void video.play().catch(() => {});
            else video.pause();
          }}
        />
      </div>
    </section>
  );
}
