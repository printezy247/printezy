import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageLocaleParam } from "@/lib/i18n";
import { termsHead, TermsPage } from "../terms";

export const Route = createFileRoute("/$lang/terms")({
  beforeLoad: ({ params }) => {
    if (!pageLocaleParam(params.lang)) throw notFound();
  },
  head: ({ params }) => termsHead(pageLocaleParam(params.lang) ?? "en"),
  component: TermsPage,
});
