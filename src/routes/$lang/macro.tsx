import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageLocaleParam } from "@/lib/i18n";
import { macroHead, MacroPage } from "../macro";

export const Route = createFileRoute("/$lang/macro")({
  beforeLoad: ({ params }) => {
    if (!pageLocaleParam(params.lang)) throw notFound();
  },
  head: ({ params }) => macroHead(pageLocaleParam(params.lang) ?? "en"),
  component: MacroPage,
});
