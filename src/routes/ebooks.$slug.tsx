import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, Download, FileText, Clock, BookOpen } from "lucide-react";
import { Nav, Footer, LINKS } from "@/components/landing/Landing";
import { getEbook, EBOOK_PAGES } from "@/lib/ebooks";
import { trackPageLoad, trackEngagement, goTrack } from "@/lib/analytics";

export const Route = createFileRoute("/ebooks/$slug")({
  loader: ({ params }) => {
    const book = getEbook(params.slug);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Ebook not found — EzyMap ALGO" }, { name: "robots", content: "noindex" }] };
    }
    const { book } = loaderData;
    const title = `${book.title} — Free Trading PDF | EzyMap ALGO`;
    return {
      meta: [
        { title },
        { name: "description", content: book.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: book.tagline },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: EbookNotFound,
  component: EbookPage,
});

function EbookNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Ebook not found</h1>
        <p className="mt-3 text-muted-foreground">That guide does not exist. Browse the available ones below.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {EBOOK_PAGES.map((b) => (
            <Link
              key={b.slug}
              to="/ebooks/$slug"
              params={{ slug: b.slug }}
              className="rounded-md border border-accent/60 px-4 py-2 text-sm font-semibold text-accent"
            >
              {b.title}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EbookPage() {
  const { book } = Route.useLoaderData();
  const others = EBOOK_PAGES.filter((b) => b.slug !== book.slug);

  useEffect(() => {
    trackPageLoad(`ebook_${book.slug}`);
    const stop = trackEngagement();
    return () => stop?.();
  }, [book.slug]);

  const download = () => goTrack(`ebook_download_${book.slug}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="pt-8">
        <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                <BookOpen className="h-3.5 w-3.5" /> Free PDF
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{book.title}</h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{book.tagline}</p>
              <p className="mt-4 max-w-2xl text-body">{book.description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={book.pdf}
                  download
                  onClick={download}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  <Download className="h-4 w-4" /> Download the PDF
                </a>
                <a
                  href={book.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack(`ebook_preview_${book.slug}`)}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  <FileText className="h-4 w-4" /> Read online
                </a>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> {book.pages} pages · PDF
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {book.readTime}
                </span>
                <span>No email required</span>
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
              <div className="mx-auto aspect-[2/3] w-40 overflow-hidden rounded-lg border border-border bg-surface">
                <img src={book.image} alt={`${book.title} cover`} className="h-full w-full object-cover" />
              </div>
              <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                This is for you if
              </h2>
              <ul className="mt-3 space-y-2">
                {book.forYouIf.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={book.pdf}
                download
                onClick={download}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-accent bg-accent/5 px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                <Download className="h-4 w-4" /> Get it free
              </a>
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="border-y border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold">What you will be able to do</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {book.outcomes.map((o) => (
                <div key={o} className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm text-foreground">{o}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Inside the guide</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {book.chapters.map((c, i) => (
              <li key={c.title} className="flex h-full gap-3 rounded-xl border border-border bg-card p-4">
                <span className="text-sm font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
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
            <h2 className="text-xl font-bold">Want the levels drawn for you?</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              The guide teaches the method. Our free Telegram channel posts the maps and signals daily so you can see it
              applied live.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/free-channel"
                onClick={() => goTrack(`ebook_${book.slug}_free_channel`)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Join the free channel <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                onClick={() => goTrack(`ebook_${book.slug}_enroll`)}
                className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
              >
                See the packages
              </Link>
            </div>
          </div>

          {others.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Other free guides</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {others.map((b) => (
                  <Link
                    key={b.slug}
                    to="/ebooks/$slug"
                    params={{ slug: b.slug }}
                    className="glass-card flex h-full items-center gap-4 rounded-xl p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                      <img src={b.image} alt={b.title} className="h-full w-full object-cover" loading="lazy" />
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
