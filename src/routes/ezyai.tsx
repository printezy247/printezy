import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Send } from "lucide-react";
import { EzyAiLogo } from "@/components/brand/EzyAiLogo";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import { trackPageLoad, trackEngagement, goTrack } from "@/lib/analytics";
import { localizedHead, type PageLocale } from "@/lib/seo";
import { translations } from "@/lib/translations";
import { EZYAI_TABS, type EzyAiTab } from "@/lib/ezyai/tabs";
import {
  getEzyAiBoard,
  getEzyAiBoardRevision,
  getEzyAiHistory,
} from "@/lib/ezyai/signals.functions";
import { BOARD_REVISION_QUERY_KEY } from "@/lib/ezyai/signals";
import { EZYAI_BOARD_VISIBLE } from "@/lib/ezyai/visibility";
import { useBoardStream } from "@/lib/ezyai/use-board-stream";
import { useBoardTab } from "@/lib/ezyai/use-board-tab";
import { BoardPanel } from "@/components/ezyai/BoardPanel";
import { HistoryPanel } from "@/components/ezyai/HistoryPanel";
import { EzyAiAboutPanel } from "@/components/ezyai/EzyAiAboutPanel";

/** The EzyAI head, shared by `/ezyai` and every translated twin. */
export function ezyaiHead(locale: PageLocale) {
  const t = translations[locale];
  return localizedHead({
    path: "/ezyai",
    locale,
    title: t.ezyai_meta_title,
    description: t.ezyai_meta_desc,
    image: "default",
    crumbName: "EzyAI",
  });
}

export const Route = createFileRoute("/ezyai")({
  // Hidden while the bot is being updated. This runs before the loader, so the
  // board's data never starts: the page is closed rather than merely unlinked.
  beforeLoad: () => {
    if (!EZYAI_BOARD_VISIBLE) throw redirect({ to: "/" });
  },
  // Deep-linkable tabs, so the hero card (and anything else) can point
  // straight at the live board rather than at the page and a hope. Neither
  // this route nor the translated twin declares a search schema: the page
  // reads `?tab=` from the URL through one resolver (useBoardTab), so both
  // boards behave the same, an unrecognised tab opens live without a
  // redirect, and a shared link keeps the parameters its sender wrote.
  head: () => ezyaiHead("en"),
  component: EzyAiPage,
});

const TAB_LABEL: Record<EzyAiTab, TranslationKey> = {
  live: "ezyai_tab_live",
  history: "ezyai_tab_history",
  about: "ezyai_tab_about",
};

/**
 * The board page: route options, the two queries and the layout. The tab/URL
 * sync, the revision stream, and each tab's body live in their own modules —
 * this file only wires them together.
 */
export function EzyAiPage() {
  const { t } = useTranslation();
  const { tab, selectTab } = useBoardTab();

  const loadBoard = useServerFn(getEzyAiBoard);
  const loadRevision = useServerFn(getEzyAiBoardRevision);
  const loadHistory = useServerFn(getEzyAiHistory);

  // The board refreshes on its own while it is on screen: the bot ticks prices
  // as trades run, and a stale rail is worse than no rail. Rather than re-pull
  // every card each time, the page polls a one-row revision stamp (the newest
  // updated_at anywhere on the board) and only fetches the full board when
  // that stamp moves — a quiet minute costs one cheap lookup instead of
  // twenty-four records. The stream (useBoardStream) writes the same stamp, so
  // a push lands at once and the poll is only the fallback.
  const revision = useQuery({
    queryKey: BOARD_REVISION_QUERY_KEY,
    queryFn: () => loadRevision(),
    refetchInterval: 30_000,
  });
  const board = useQuery({
    queryKey: ["ezyai-board", revision.data?.updatedAt ?? null],
    queryFn: () => loadBoard(),
  });
  const history = useQuery({
    queryKey: ["ezyai-history"],
    queryFn: () => loadHistory(),
    enabled: tab === "history",
  });

  const streamLive = useBoardStream();

  useEffect(() => {
    trackPageLoad("ezyai");
    const stop = trackEngagement();
    return stop;
  }, []);

  // Arrow keys move between tabs, which is how a tablist is meant to work;
  // only the selected tab sits in the tab order.
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, id: EzyAiTab) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next =
      EZYAI_TABS[(EZYAI_TABS.indexOf(id) + step + EZYAI_TABS.length) % EZYAI_TABS.length];
    selectTab(next);
    goTrack(`ezyai_tab_${next}`);
    document.getElementById(`ezyai-tab-${next}`)?.focus();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl gap-5">
            <EzyAiLogo
              className="hidden h-20 w-20 shrink-0 rounded-full ring-1 ring-primary/25 sm:block"
              withWordmark
              title="EzyAI"
            />
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                <EzyAiLogo className="h-4 w-4" /> {t("ezyai_desk_label")}
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl">{t("ezyai_page_title")}</h1>
              <p className="mt-3 text-sm text-body sm:text-base">{t("ezyai_page_desc")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <a
                    href={LINKS.ezyai}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => goTrack("ezyai_hero_open_bot")}
                  >
                    <Send className="h-4 w-4" /> {t("ezyai_cta_open_bot")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div
          className="mt-10 flex gap-6 border-b border-border"
          role="tablist"
          aria-label={t("ezyai_desk_label")}
        >
          {EZYAI_TABS.map((id) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`ezyai-tab-${id}`}
                aria-selected={active}
                aria-controls={`ezyai-panel-${id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => {
                  selectTab(id);
                  goTrack(`ezyai_tab_${id}`);
                }}
                onKeyDown={(event) => onTabKeyDown(event, id)}
                className={`-mb-px border-b-2 px-1 pb-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(TAB_LABEL[id])}
              </button>
            );
          })}
        </div>

        {tab === "live" ? <BoardPanel board={board} streamLive={streamLive} /> : null}
        {tab === "history" ? <HistoryPanel history={history} /> : null}
        {tab === "about" ? <EzyAiAboutPanel /> : null}

        <div className="mx-auto mt-10 flex max-w-4xl items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{t("ezyai_disclaimer")}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
