import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageLocaleParam } from "@/lib/i18n";
import { privacyHead, PrivacyPage } from "../privacy";

export const Route = createFileRoute("/$lang/privacy")({
  beforeLoad: ({ params }) => {
    if (!pageLocaleParam(params.lang)) throw notFound();
  },
  head: ({ params }) => privacyHead(pageLocaleParam(params.lang) ?? "en"),
  component: PrivacyPage,
});
