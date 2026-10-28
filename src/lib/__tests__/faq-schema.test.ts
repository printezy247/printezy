import { describe, expect, it } from "vitest";
import { FAQ_GROUPS } from "@/lib/faq-data";
import { LOCALES } from "@/lib/locale-constants";
import { buildFaqJsonLd } from "@/lib/faq-schema";
import { translations } from "@/lib/translations";

describe("buildFaqJsonLd", () => {
  it("matches the visible FAQ data for every locale", () => {
    for (const locale of LOCALES) {
      const schema = JSON.parse(buildFaqJsonLd(locale));
      const expected = FAQ_GROUPS.flatMap((group) =>
        group.items.map((item) => ({
          "@type": "Question",
          name: translations[locale][item.qKey],
          acceptedAnswer: {
            "@type": "Answer",
            text: translations[locale][item.aKey],
          },
        })),
      );

      expect(schema["@type"]).toBe("FAQPage");
      expect(schema.mainEntity).toEqual(expected);
    }
  });
});
