import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_GROUPS } from "@/lib/faq-data";
import { buildFaqJsonLd } from "@/lib/faq-schema";
import { useTranslation } from "@/lib/i18n";
import { Reveal, Section, SectionHeading } from "./primitives";

/**
 * The FAQ accordion. Split out of Landing.tsx so /faq can load it without the
 * marketing page around it; keep the markup and copy in sync with FAQ_GROUPS.
 */
export function Faq() {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const { t, locale } = useTranslation();
  const faqJsonLd = useMemo(() => buildFaqJsonLd(locale), [locale]);
  return (
    <Section id="faq">
      {/* faqJsonLd is JSON.stringify output from buildFaqJsonLd — no user HTML */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
      <SectionHeading eyebrow={t("faq_eyebrow")} title={t("faq_title")} />
      <div className="mx-auto max-w-3xl space-y-10">
        {FAQ_GROUPS.map((g, gi) => (
          <div key={g.titleKey}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {t(g.titleKey)}
            </h3>
            <div className="space-y-3">
              {g.items.map((f, i) => {
                const id = `${gi}-${i}`;
                const open = openIds.includes(id);
                return (
                  <Reveal key={f.qKey} delay={i * 0.04} y={20}>
                    <div className="glass-card overflow-hidden rounded-xl">
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        aria-expanded={open}
                        aria-controls={`faq-answer-${id}`}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="text-sm font-semibold">{t(f.qKey)}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {/* Answers stay mounted and toggle `hidden` instead of
                          unmounting: the FAQPage JSON-LD above must describe
                          text that crawlers can actually find in the DOM. */}
                      <p
                        id={`faq-answer-${id}`}
                        hidden={!open}
                        className="border-t border-border px-5 py-4 text-sm leading-relaxed text-body"
                      >
                        {t(f.aKey)}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
