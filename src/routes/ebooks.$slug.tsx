import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Download, FileText, Clock, BookOpen } from "lucide-react";
import { Nav, Footer } from "@/components/landing/Landing";
import { getEbook, localizeEbook, EBOOK_PAGES, type Ebook } from "@/lib/ebooks";
import { useTranslation } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { localizedHead } from "@/lib/seo";

const EbookClaimModal = lazy(() =>
  import("@/components/EbookClaimModal").then((m) => ({ default: m.EbookClaimModal })),
);
import { trackPageLoad, trackEngagement, goTrack } from "@/lib/analytics";
import { SITE_URL } from "@/lib/bot/tiers";

export function ebookHead(book: Ebook | undefined, locale: "en" | "ms") {
  const t = translations[locale];
  if (!book) {
    return { meta: [{ title: t.ebook_not_found_meta }, { name: "robots", content: "noindex" }] };
  }
  const copy = localizeEbook(book, locale);
  const title = `${copy.title} — ${t.ebook_meta_suffix}`;
  const bookJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Book",
    name: copy.title,
    description: copy.description,
    author: { "@type": "Organization", name: book.author },
    image: `${SITE_URL}${book.image}`,
    inLanguage: book.language,
  });
  return {
    ...localizedHead({
      path: `/ebooks/${book.slug}`,
      locale,
      title,
      description: copy.tagline,
      ogType: "article",
      image: book.image,
      imageAlt: copy.title,
    }),
    scripts: [{ type: "application/ld+json", children: bookJsonLd }],
  };
}

export const Route = createFileRoute("/ebooks/$slug")({
  loader: ({ params }) => {
    const book = getEbook(params.slug);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => ebookHead(loaderData?.book, "en"),
  notFoundComponent: EbookNotFound,
  component: EbookRoutePage,
});

function EbookRoutePage() {
  const { book } = Route.useLoaderData();
  return <EbookPage book={book} />;
}

export function EbookNotFound() {
  const { t, locale } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl ">{t("ebook_not_found_title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("ebook_not_found_body")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {EBOOK_PAGES.map((b) => (
            <Link
              key={b.slug}
              to={locale === "ms" ? "/ms/ebooks/$slug" : "/ebooks/$slug"}
              params={{ slug: b.slug }}
              className="rounded-md border border-accent/60 px-4 py-2 text-sm font-semibold text-accent"
            >
              {localizeEbook(b, locale).title}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function EbookPage({ book: source }: { book: Ebook }) {
  const { t, locale } = useTranslation();
  const ms = locale === "ms";
  const book = localizeEbook(source, locale);
  const others = EBOOK_PAGES.filter((b) => b.slug !== book.slug).map((b) =>
    localizeEbook(b, locale),
  );
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    trackPageLoad(`ebook_${book.slug}`);
    const stop = trackEngagement();
    return () => stop?.();
  }, [book.slug]);

  const openClaim = () => {
    goTrack(`ebook_get_${book.slug}`);
    setClaiming(true);
  };

  const gateCopy =
    book.slug === "mapping-like-a-pro" ? t("ebook_gate_vantage") : t("ebook_gate_signin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="pt-8">
        <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
          <Link
            to={ms ? "/ms" : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("ebook_back_home")}
          </Link>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                <BookOpen className="h-3.5 w-3.5" /> {t("ebook_free_pdf")}
              </span>
              <h1 className="mt-4 text-3xl leading-tight sm:text-4xl">{book.title}</h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{book.tagline}</p>
              <p className="mt-4 max-w-2xl text-body">{book.description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openClaim}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  <Download className="h-4 w-4" /> {t("ebook_get_it_free")}
                </button>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />{" "}
                  {t("ebook_pages_pdf").replace("{n}", String(book.pages))}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {book.readTime}
                </span>
                <span>{gateCopy}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
              <div className="mx-auto aspect-[2/3] w-40 overflow-hidden rounded-lg border border-border bg-surface">
                <img
                  src={book.image}
                  alt={t("ebook_cover_alt").replace("{title}", book.title)}
                  className="h-full w-full object-cover"
                />
              </div>
              <h2 className="mt-5 text-sm uppercase tracking-wide text-muted-foreground">
                {t("ebook_for_you_if")}
              </h2>
              <ul className="mt-3 space-y-2">
                {book.forYouIf.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={openClaim}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-accent bg-accent/5 px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                <Download className="h-4 w-4" /> {t("ebook_get_it_free")}
              </button>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {claiming ? (
            <Suspense fallback={null}>
              <EbookClaimModal slug={book.slug} onClose={() => setClaiming(false)} />
            </Suspense>
          ) : null}
        </AnimatePresence>

        {/* Outcomes */}
        <section className="border-y border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl ">{t("ebook_outcomes_title")}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {book.outcomes.map((o) => (
                <div
                  key={o}
                  className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm text-foreground">{o}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl ">{t("ebook_chapters_title")}</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {book.chapters.map((c, i) => (
              <li
                key={c.title}
                className="flex h-full gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span className="text-sm font-bold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{c.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA + other books */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 sm:p-8">
            <h2 className="text-xl ">{t("ebook_cta_title")}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("ebook_cta_body")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={ms ? "/ms/free-channel" : "/free-channel"}
                onClick={() => goTrack(`ebook_${book.slug}_free_channel`)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                {t("ebook_cta_channel")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                onClick={() => goTrack(`ebook_${book.slug}_enroll`)}
                className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
              >
                {t("ebook_cta_packages")}
              </Link>
            </div>
          </div>

          {others.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
                {t("ebook_other_guides")}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {others.map((b) => (
                  <Link
                    key={b.slug}
                    to={ms ? "/ms/ebooks/$slug" : "/ebooks/$slug"}
                    params={{ slug: b.slug }}
                    className="glass-card flex h-full items-center gap-4 rounded-xl p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                      <img
                        src={b.image}
                        alt={b.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{b.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
