import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Download, LogIn, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyEbookClaims, claimEbook } from "@/lib/ebook-claims.functions";
import { getEbook } from "@/lib/ebooks";
import { goTrack } from "@/lib/analytics";

type Props = {
  slug: string;
  onClose: () => void;
};

type Gate =
  | "loading"
  | "signed_out"
  | "needs_vantage_confirm"
  | "claiming"
  | "claimed";

const DENY_PULSE = { scale: [1, 1.02, 1] as number[] };

export function EbookClaimModal({ slug, onClose }: Props) {
  const navigate = useNavigate();
  const getClaims = useServerFn(getMyEbookClaims);
  const claim = useServerFn(claimEbook);
  const book = getEbook(slug);

  const [gate, setGate] = useState<Gate>("loading");
  const [pdf, setPdf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  const requiresVantage = slug === "mapping-like-a-pro";
  const currentPath = () => (typeof window !== "undefined" ? window.location.pathname : "/");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (!data.session) {
        setGate("signed_out");
        return;
      }
      try {
        const claims = await getClaims({ data: undefined });
        if (!active) return;
        const existing = claims.find((c) => c.slug === slug);
        if (existing && book) {
          setPdf(book.pdf);
          setGate("claimed");
          return;
        }
        if (requiresVantage) {
          setGate("needs_vantage_confirm");
          return;
        }
        // Technical Analysis: instant claim the moment we know they're signed in.
        void doClaim(false);
      } catch {
        if (active) setGate("signed_out");
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doClaim(vantageConfirmed: boolean) {
    setGate("claiming");
    setError(null);
    try {
      const result = await claim({ data: { slug, vantageConfirmed } });
      setPdf(result.pdf);
      setGate("claimed");
      toast.success(`${book?.title ?? "Ebook"} unlocked — download below.`);
      goTrack(`ebook_claim_${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim this ebook.");
      setGate(requiresVantage ? "needs_vantage_confirm" : "signed_out");
      setPulse((p) => p + 1);
    }
  }

  if (!book) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, ...(pulse ? DENY_PULSE : {}) }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative my-8 w-full max-w-md rounded-xl border border-border bg-background p-6"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-md p-1.5 text-muted hover:bg-elevated hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="pr-8 text-lg font-semibold text-foreground">{book.title}</h2>
          <p className="mt-1 text-sm text-muted">{book.tagline}</p>

          <div className="mt-5">
            {gate === "loading" ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted" />
              </div>
            ) : null}

            {gate === "signed_out" ? (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    void navigate({ to: "/auth", search: { redirect: currentPath() } })
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" /> Sign in to claim
                </button>
                <p className="mt-2 text-xs text-muted">Free account, one click with Google.</p>
                {error && <p className="mt-3 text-sm text-[#d9534f]">{error}</p>}
              </div>
            ) : null}

            {gate === "needs_vantage_confirm" ? (
              <div>
                <p className="text-sm text-body">
                  This guide is free after opening a no-deposit Vantage account.
                </p>
                <a
                  href="https://vigco.co/la-scom-inv/ms/oQQlQ8yM"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack(`ebook_${slug}_vantage_open`)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(201,161,58,0.45)] px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10"
                >
                  <ShieldCheck className="h-4 w-4" /> Open Vantage account
                </a>
                <button
                  type="button"
                  onClick={() => void doClaim(true)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  I've opened my Vantage account — unlock it
                </button>
                {error && <p className="mt-3 text-sm text-[#d9534f]">{error}</p>}
              </div>
            ) : null}

            {gate === "claiming" ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted" />
              </div>
            ) : null}

            {gate === "claimed" && pdf ? (
              <div className="flex flex-col gap-2">
                <a
                  href={pdf}
                  download
                  onClick={() => goTrack(`ebook_download_${slug}`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
                >
                  <Download className="h-4 w-4" /> Download the PDF
                </a>
                <a
                  href={pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack(`ebook_preview_${slug}`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-elevated"
                >
                  Read online
                </a>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
