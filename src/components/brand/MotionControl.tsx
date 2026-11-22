import { Pause, Play } from "lucide-react";
import type { Locale } from "@/lib/locale-constants";

const labels: Record<Locale, [string, string]> = {
  en: ["Pause animation", "Play animation"],
  ms: ["Jeda animasi", "Mainkan animasi"],
  zh: ["暂停动画", "播放动画"],
  hi: ["एनीमेशन रोकें", "एनीमेशन चलाएँ"],
  ar: ["إيقاف الحركة مؤقتًا", "تشغيل الحركة"],
  sw: ["Sitisha uhuishaji", "Cheza uhuishaji"],
};

export function MotionControl({
  playing,
  onToggle,
  locale = "en",
}: {
  playing: boolean;
  onToggle: () => void;
  locale?: Locale;
}) {
  return (
    <button
      type="button"
      className="ezm-motion-control"
      onClick={onToggle}
      aria-label={labels[locale][playing ? 0 : 1]}
      title={labels[locale][playing ? 0 : 1]}
    >
      {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
    </button>
  );
}
