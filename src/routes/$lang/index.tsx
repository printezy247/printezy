import { createFileRoute, notFound } from "@tanstack/react-router";
import { Landing } from "@/components/landing/Landing";
import { pageLocaleParam } from "@/lib/i18n";
import { homeHead } from "../home";

/**
 * The landing page in every prefixed locale — `/ms`, `/zh`, `/hi`, `/ar`,
 * `/sw`. English keeps `/home` (and `/` for the welcome page) because it is
 * unprefixed; everything else lives behind `$lang`.
 *
 * The locale comes from the URL, never from storage: a shared Chinese link has
 * to read as Chinese for whoever opens it, and the head metadata has to be the
 * translated one for a crawler that never runs the client.
 *
 * Deliberately no search schema: tab and filter state is read off the location
 * by the page, so a shared `?…` link keeps the parameters its sender wrote.
 */
export const Route = createFileRoute("/$lang/")({
  beforeLoad: ({ params }) => {
    if (!pageLocaleParam(params.lang)) throw notFound();
  },
  head: ({ params }) => homeHead(pageLocaleParam(params.lang) ?? "en"),
  component: Landing,
});
