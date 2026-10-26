import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageLocaleParam } from "@/lib/i18n";
import { indicatorsHead, IndicatorsPage } from "../indicators";

export const Route = createFileRoute("/$lang/indicators")({
  beforeLoad: ({ params }) => {
    if (!pageLocaleParam(params.lang)) throw notFound();
  },
  head: ({ params }) => indicatorsHead(pageLocaleParam(params.lang) ?? "en"),
  component: IndicatorsPage,
});
