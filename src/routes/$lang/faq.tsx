import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageLocaleParam } from "@/lib/i18n";
import { FaqPage, faqHead } from "../faq";
import { buildFaqJsonLd } from "@/lib/faq-schema";

export const Route = createFileRoute("/$lang/faq")({
  beforeLoad: ({ params }) => {
    if (!pageLocaleParam(params.lang)) throw notFound();
  },
  head: ({ params }) => {
    const locale = pageLocaleParam(params.lang) ?? "en";
    const HEAD = faqHead(locale);
    // The FAQPage schema is generated from the same groups + dictionary the
    // page renders, in the page's own language.
    return {
      ...HEAD,
      scripts: [...HEAD.scripts, { type: "application/ld+json", children: buildFaqJsonLd(locale) }],
    };
  },
  component: FaqPage,
});
