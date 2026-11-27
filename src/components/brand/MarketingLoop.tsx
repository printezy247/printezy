import { useEffect, useRef, useState } from "react";
import { MotionControl } from "@/components/brand/MotionControl";
import type { Locale } from "@/lib/locale-constants";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

export function MarketingLoop({
  src,
  poster,
  locale,
  className = "",
}: {
  src: string;
  poster: string;
  locale?: Locale;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);

  const [failed, setFailed] = useState(false);

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
    <div className={`marketing-loop ${className}`}>
      {failed ? (
        <img className="marketing-loop__video" src={poster} alt="" />
      ) : (
        <video
          className="marketing-loop__video"
          ref={videoRef}
          poster={poster}
          preload="none"
          muted
          loop
          playsInline
          aria-hidden="true"
          onError={() => setFailed(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={src} type="video/mp4" onError={() => setFailed(true)} />
        </video>
      )}
      {!failed && (
        <div className="marketing-loop__control">
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
      )}
    </div>
  );
}
