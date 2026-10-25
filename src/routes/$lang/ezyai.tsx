import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { localizedHead, type PageLocale } from "@/lib/seo";
import { EZYAI_BOARD_VISIBLE } from "@/lib/ezyai/visibility";
import { EzyAiPage } from "../ezyai";

/**
 * One route for every translated EzyAI page — `/ms/ezyai` today, and any
 * locale the site gives a URL of its own later. The English page keeps
 * `src/routes/ezyai.tsx` because `/ezyai` is a single path segment rather
 * than a translated twin, so it cannot live behind `$lang`.
 *
 * The locale is read from the URL, never from storage: a shared Malay link
 * has to read as Malay for whoever opens it, and the head metadata has to be
 * the Malay one for a crawler that never runs the client.
 */
type LocalizedEzyAi = {
  locale: PageLocale;
  /** The locale's home page — where a hidden board sends the visitor. */
  home: string;
  title: string;
  description: string;
  ogDescription: string;
  crumbName: string;
};

const LOCALES: Record<string, LocalizedEzyAi> = {
  ms: {
    locale: "ms",
    home: "/ms",
    title: "EzyAI — Isyarat Dagangan AI di Telegram | EzyMap Algo",
    description:
      "EzyAI menukar data pasaran percuma menjadi keyakinan dagangan di Telegram — analisis teknikal, amaran tontonan langsung, asas dan isyarat autopilot, percuma untuk mula.",
    ogDescription:
      "Analisis atas permintaan, amaran langsung, asas dan isyarat autopilot — percuma untuk mula.",
    crumbName: "EzyAI",
  },
};

const copyFor = (lang: string | undefined): LocalizedEzyAi | undefined =>
  lang === undefined ? undefined : LOCALES[lang];

export const Route = createFileRoute("/$lang/ezyai")({
  beforeLoad: ({ params }) => {
    const copy = copyFor(params.lang);
    // A locale without a translated page is a 404, not this page behind a
    // foreign URL. And when the board is hidden it is hidden for its English
    // twin too, but the visitor is sent to their own language's home page
    // rather than switched to English by the redirect.
    if (!copy) throw notFound();
    if (!EZYAI_BOARD_VISIBLE) throw redirect({ to: copy.home });
  },
  head: ({ params }) => {
    // beforeLoad has already 404'd a locale with no copy; the fallback only
    // keeps this function total for the type checker.
    const copy = copyFor(params.lang) ?? LOCALES.ms;
    return localizedHead({
      path: "/ezyai",
      locale: copy.locale,
      title: copy.title,
      description: copy.description,
      ogDescription: copy.ogDescription,
      image: "default",
      crumbName: copy.crumbName,
    });
  },
  component: EzyAiPage,
});
