import { FAQ_GROUPS } from "@/lib/faq-data";
import type { Locale } from "@/lib/locale-constants";
import { translations, type TranslationKey } from "@/lib/translations";

/** Keep FAQ structured data synchronized with the groups and translations used by the UI. */
export function buildFaqJsonLd(locale: Locale): string {
  const dict = translations[locale];
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((group) =>
      group.items.map((item: { qKey: TranslationKey; aKey: TranslationKey }) => ({
        "@type": "Question",
        name: dict[item.qKey],
        acceptedAnswer: { "@type": "Answer", text: dict[item.aKey] },
      })),
    ),
  });
}
