import type { TranslationKey } from "@/lib/translations";

export const FAQ_GROUPS: {
  titleKey: TranslationKey;
  items: { qKey: TranslationKey; aKey: TranslationKey }[];
}[] = [
  {
    titleKey: "faq_group1_title",
    items: [
      { qKey: "faq_g1_q1", aKey: "faq_g1_a1" },
      { qKey: "faq_g1_q2", aKey: "faq_g1_a2" },
      { qKey: "faq_g1_q3", aKey: "faq_g1_a3" },
      { qKey: "faq_g1_q4", aKey: "faq_g1_a4" },
      { qKey: "faq_g1_q5", aKey: "faq_g1_a5" },
    ],
  },
  {
    titleKey: "faq_group2_title",
    items: [
      { qKey: "faq_g2_q1", aKey: "faq_g2_a1" },
      { qKey: "faq_g2_q2", aKey: "faq_g2_a2" },
      { qKey: "faq_g2_q3", aKey: "faq_g2_a3" },
      { qKey: "faq_g2_q4", aKey: "faq_g2_a4" },
    ],
  },
  {
    titleKey: "faq_group3_title",
    items: [
      { qKey: "faq_g3_q1", aKey: "faq_g3_a1" },
      { qKey: "faq_g3_q2", aKey: "faq_g3_a2" },
      { qKey: "faq_g3_q3", aKey: "faq_g3_a3" },
      { qKey: "faq_g3_q4", aKey: "faq_g3_a4" },
    ],
  },
];
