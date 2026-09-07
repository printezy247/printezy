import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Clock, Download, FileText, X } from "lucide-react";
import { getEbook } from "@/lib/ebooks";
import { goTrack } from "@/lib/analytics";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { ModalPortal } from "@/components/ModalPortal";

const EbookClaimModal = lazy(() =>
  import("@/components/EbookClaimModal").then((m) => ({ default: m.EbookClaimModal })),
);

type Props = {
  slug: string;
  onClose: () => void;
};

/**
 * In-page scrollable preview of an ebook's details (cover, description,
 * outcomes, chapters) so browsing from the landing page doesn't require
 * navigating away to /ebooks/$slug. "Get it free" opens the existing
 * claim flow on top of this panel.
 */
export function EbookDetailsModal({ slug, onClose }: Props) {
  const book = getEbook(slug);
  const reducedMotion = usePrefersReducedMotion();
  const [claiming, setClaiming] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-checkout-open", "true");
    return () => {
      document.body.style.overflow = prev;
      document.body.removeAttribute("data-checkout-open");
    };
  }, []);

  useEffect(() => {
    closeBtnRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!book) return null;

  const openClaim = () => {
    goTrack(`ebook_get_${slug}`);
    setClaiming(true);
  };

  return (
    <>
      <ModalPortal>
        <motion.div
          key="overlay"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: reducedMotion ? 0 : 0.2 } }}
          exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.15 } }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={book.title}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.2, ease: "easeOut" } }}
            exit={{
              opacity: 0,
              scale: reducedMotion ? 1 : 0.96,
              y: reducedMotion ? 0 : 8,
              transition: { duration: reducedMotion ? 0 : 0.15, ease: "easeIn" },
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-8 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-accent/25 bg-background shadow-gold"
          >
            <div className="bg-gold absolute inset-x-0 top-0 z-10 h-[3px]" aria-hidden="true" />
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 rounded-md bg-background/80 p-1.5 text-muted-foreground backdrop-blur hover:bg-surface-elevated hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="overflow-y-auto p-6 sm:p-7">
              <div className="flex items-start gap-4 pr-8">
                <img
                  src={book.image}
                  alt={`${book.title} cover`}
                  className="h-28 w-20 shrink-0 rounded-md border border-border object-cover sm:h-32 sm:w-[88px]"
                />
                <div className="min-w-0">
                  <h2 className="text-xl text-foreground sm:text-2xl">{book.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{book.tagline}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> {book.pages} pages · PDF
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {book.readTime}
                    </span>
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-body">{book.description}</p>

              <button
                type="button"
                onClick={openClaim}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 sm:w-auto"
              >
                <Download className="h-4 w-4" /> Get it free
              </button>

              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  This is for you if
                </h3>
                <ul className="mt-3 space-y-2">
                  {book.forYouIf.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  What you'll be able to do
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {book.outcomes.map((o) => (
                    <div key={o} className="flex h-full items-start gap-2.5 rounded-lg border border-border bg-card p-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm text-foreground">{o}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Inside the guide
                </h3>
                <ol className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {book.chapters.map((c, i) => (
                    <li key={c.title} className="flex h-full gap-2.5 rounded-lg border border-border bg-card p-3">
                      <span className="text-sm font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">{c.summary}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <a
                href={`/ebooks/${book.slug}`}
                onClick={() => goTrack(`ebook_${slug}_view_full_page`)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                View full page <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>

      <AnimatePresence>
        {claiming ? (
          <Suspense fallback={null}>
            <EbookClaimModal slug={slug} onClose={() => setClaiming(false)} />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </>
  );
}
