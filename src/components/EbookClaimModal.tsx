import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Download, LogIn, ShieldCheck, X, Clock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyEbookClaims, claimEbook, getEbookDownloadUrl } from "@/lib/ebook-claims.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { saveLead } from "@/lib/leads.functions";
import { getEbook } from "@/lib/ebooks";
import { goTrack, getSessionId } from "@/lib/analytics";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

type Props = {
  slug: string;
  onClose: () => void;
};

type Gate =
  | "loading"
  | "signed_out"
  | "needs_vantage_details"
  | "pending_review"
  | "claiming"
  | "claimed";

const DENY_PULSE = { scale: [1, 1.02, 1] as number[] };
const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function EbookClaimModal({ slug, onClose }: Props) {
  const navigate = useNavigate();
  const getClaims = useServerFn(getMyEbookClaims);
  const getProfile = useServerFn(getMyProfile);
  const claim = useServerFn(claimEbook);
  const fetchLinks = useServerFn(getEbookDownloadUrl);
  const book = getEbook(slug);
  const reducedMotion = usePrefersReducedMotion();

  const [gate, setGate] = useState<Gate>("loading");
  const [links, setLinks] = useState<{ downloadUrl: string; readUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  const [fullName, setFullName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [vantageAccount, setVantageAccount] = useState("");

  const saveLeadFn = useServerFn(saveLead);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const requiresVantage = slug === "mapping-like-a-pro";
  // After signing in, land on the ebook page with the modal reopened — the
  // modal is also mounted on landing-page popups, where ?claim= means nothing.
  const returnPath = () =>
    `${typeof window !== "undefined" && window.location.pathname.startsWith("/ms") ? "/ms" : ""}/ebooks/${slug}?claim=1`;

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock while the dialog is open, and a signal other
  // proactive popups (e.g. EnrollModal) check to stay suppressed.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-checkout-open", "true");
    return () => {
      document.body.style.overflow = prev;
      document.body.removeAttribute("data-checkout-open");
    };
  }, []);

  // Focus trap + Escape to close; focus returns to the trigger on close via onClose.
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

  const handle = telegramUsername.trim().replace(/^@+/, "");
  const detailsReady =
    fullName.trim().length > 0 && /^[A-Za-z0-9_]{5,32}$/.test(handle) && vantageAccount.trim().length > 0;

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
        if (existing?.status === "approved" && book) {
          await unlock();
          return;
        }
        if (existing?.status === "pending") {
          setGate("pending_review");
          return;
        }
        if (requiresVantage) {
          const profile = await getProfile({ data: undefined }).catch(() => null);
          if (!active) return;
          if (profile) {
            setFullName(profile.fullName ?? "");
            setTelegramUsername(profile.telegramUsername ?? "");
          }
          setGate("needs_vantage_details");
          return;
        }
        // Technical Analysis: instant claim the moment we know they're signed in.
        void doClaim();
      } catch {
        if (active) setGate("signed_out");
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Approved claim: ask the server for fresh signed URLs into the private bucket. */
  async function unlock() {
    try {
      const fresh = await fetchLinks({ data: { slug } });
      setLinks(fresh);
      setGate("claimed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The download is temporarily unavailable.");
      setGate("claimed");
    }
  }

  async function doClaim() {
    setGate("claiming");
    setError(null);
    try {
      const result = await claim({
        data: requiresVantage
          ? { slug, fullName: fullName.trim(), telegramUsername: handle, vantageAccount: vantageAccount.trim() }
          : { slug },
      });
      if (result.status === "pending") {
        setGate("pending_review");
        toast.success("Submitted — Sarah will review and approve it shortly.");
        goTrack(`ebook_claim_pending_${slug}`);
        return;
      }
      await unlock();
      toast.success(`${book?.title ?? "Ebook"} unlocked — download below.`);
      goTrack(`ebook_claim_${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim this ebook.");
      setGate(requiresVantage ? "needs_vantage_details" : "signed_out");
      setPulse((p) => p + 1);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadEmail.trim() || leadBusy) return;
    setLeadBusy(true);
    try {
      await saveLeadFn({
        data: { email: leadEmail.trim(), source: "free-ebook", sessionId: getSessionId() },
      });
      setLeadSaved(true);
      goTrack(`ebook_lead_${slug}`);
    } catch {
      // Non-critical — fail silently, sign-in remains the primary path.
    } finally {
      setLeadBusy(false);
    }
  }

  if (!book) return null;

  return (
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
          animate={{
            opacity: 1,
            scale: !reducedMotion && pulse ? DENY_PULSE.scale : 1,
            y: 0,
            transition: { duration: reducedMotion ? 0 : 0.2, ease: "easeOut" },
          }}
          exit={{
            opacity: 0,
            scale: reducedMotion ? 1 : 0.96,
            y: reducedMotion ? 0 : 8,
            transition: { duration: reducedMotion ? 0 : 0.15, ease: "easeIn" },
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative my-8 w-full max-w-sm overflow-hidden rounded-xl border border-accent/25 bg-background p-6 shadow-gold"
        >
          <div className="bg-gold absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" />
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <img
              src={book.image}
              alt={`${book.title} cover`}
              className="h-20 w-14 shrink-0 rounded-md border border-border object-cover"
            />
            <div className="min-w-0">
              <h2 className="text-lg text-foreground">{book.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{book.tagline}</p>
            </div>
          </div>

          <div className="mt-5">
            {gate === "loading" ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : null}

            {gate === "signed_out" ? (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    void navigate({ to: "/auth", search: { redirect: returnPath() } })
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" /> Sign in to claim
                </button>
                <p className="mt-2 text-xs text-muted-foreground">Free account, one click with Google.</p>

                <div className="mt-4 border-t border-border pt-4">
                  {leadSaved ? (
                    <p className="text-sm text-body">
                      Thanks — we'll keep you posted on free resources. Sign in any time to claim this one.
                    </p>
                  ) : (
                    <form onSubmit={submitLead}>
                      <p className="text-xs text-muted-foreground">
                        Not ready to sign in? Leave your email and we'll keep you posted on free resources —
                        no promises on this ebook specifically, sign-in is still the fastest way to get it.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="email"
                          required
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={inputClass}
                        />
                        <button
                          type="submit"
                          disabled={leadBusy}
                          aria-label="Save email"
                          className="inline-flex shrink-0 items-center justify-center rounded-md border border-border px-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              </div>
            ) : null}

            {gate === "needs_vantage_details" ? (
              <div>
                <p className="text-sm text-body">
                  This guide is free after opening a no-deposit Vantage account. Sarah reviews and
                  approves each request before the download unlocks.
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

                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Full name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Telegram username</label>
                    <input
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value)}
                      placeholder="your_telegram"
                      autoComplete="off"
                      spellCheck={false}
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Vantage account number</label>
                    <input
                      value={vantageAccount}
                      onChange={(e) => setVantageAccount(e.target.value.replace(/\D/g, ""))}
                      placeholder="12345678"
                      inputMode="numeric"
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!detailsReady}
                  onClick={() => void doClaim()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Submit for approval
                </button>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              </div>
            ) : null}

            {gate === "pending_review" ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Clock className="h-6 w-6 text-accent" />
                <p className="text-sm text-body">
                  Submitted — Sarah checks your Vantage account and approves it, usually within a
                  few hours. Come back to this page once approved and the download will be here.
                </p>
              </div>
            ) : null}

            {gate === "claiming" ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : null}

            {gate === "claimed" && !links ? (
              <p className="text-sm text-destructive">{error ?? "The download is temporarily unavailable."}</p>
            ) : null}

            {gate === "claimed" && links ? (
              <div className="flex flex-col gap-2">
                <a
                  href={links.downloadUrl}
                  onClick={() => goTrack(`ebook_download_${slug}`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
                >
                  <Download className="h-4 w-4" /> Download the PDF
                </a>
                <a
                  href={links.readUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => goTrack(`ebook_preview_${slug}`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-elevated"
                >
                  Read online
                </a>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
  );
}
