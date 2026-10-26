import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageLocaleParam } from "@/lib/i18n";
import { freeChannelHead, FreeChannelPage } from "../free-channel";

export const Route = createFileRoute("/$lang/free-channel")({
  beforeLoad: ({ params }) => {
    if (!pageLocaleParam(params.lang)) throw notFound();
  },
  head: ({ params }) => freeChannelHead(pageLocaleParam(params.lang) ?? "en"),
  component: FreeChannelPage,
});
