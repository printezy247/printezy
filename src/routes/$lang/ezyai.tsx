import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { localizePath, pageLocaleParam } from "@/lib/i18n";
import { EZYAI_BOARD_VISIBLE } from "@/lib/ezyai/visibility";
import { EzyAiPage, ezyaiHead } from "../ezyai";

/**
 * One route for every translated EzyAI page — `/ms/ezyai`, `/zh/ezyai`,
 * `/hi/ezyai`, `/ar/ezyai`, `/sw/ezyai`. The English page keeps
 * `src/routes/ezyai.tsx` because `/ezyai` is a single path segment rather than
 * a translated twin, so it cannot live behind `$lang`.
 *
 * The locale is read from the URL, never from storage: a shared Malay link
 * has to read as Malay for whoever opens it, and the head metadata has to be
 * the Malay one for a crawler that never runs the client.
 */
export const Route = createFileRoute("/$lang/ezyai")({
  // Deliberately no search schema: the board reads `?tab=` off the location
  // itself, so every translated board honours the same shared links as the
  // English one without this route having to own (and rewrite) the query.
  beforeLoad: ({ params }) => {
    const locale = pageLocaleParam(params.lang);
    // A locale the site does not serve is a 404, not this page behind a
    // foreign URL. And when the board is hidden it is hidden for its English
    // twin too, but the visitor is sent to their own language's home page
    // rather than switched to English by the redirect.
    if (!locale) throw notFound();
    if (!EZYAI_BOARD_VISIBLE) throw redirect({ href: localizePath("/", locale) });
  },
  head: ({ params }) => ezyaiHead(pageLocaleParam(params.lang) ?? "en"),
  component: EzyAiPage,
});
