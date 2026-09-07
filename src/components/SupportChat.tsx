// Floating live-chat widget. Visitors talk to Sarah right on the site: the
// bot's reply book answers instantly, and anything it can't answer is relayed
// to Sarah's Telegram — her reply appears here on the next poll.
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { getSessionId, track } from "@/lib/analytics";
import {
  fetchSupportMessages,
  sendSupportMessage,
  type SupportLink,
  type SupportQuick,
} from "@/lib/support.functions";
import { onOpenSupportChatRequested } from "@/lib/support-chat-trigger";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

type Bubble = {
  id: number;
  role: "visitor" | "sarah";
  author: string;
  text: string;
  links?: SupportLink[];
  quick?: SupportQuick[];
};

type T = (key: TranslationKey) => string;

const greetingFor = (t: T): Bubble => ({
  id: -1,
  role: "sarah",
  author: t("chat_assistant"),
  text: t("chat_greeting"),
  quick: [
    { label: t("chat_quick_products"), entryId: "products" },
    { label: t("chat_quick_faq"), entryId: "faq" },
  ],
});

export function SupportChat() {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Bubble[]>(() => [greetingFor(t)]);

  // Re-render the greeting in the newly chosen language; sent bubbles stay.
  useEffect(() => {
    setMessages((prev) => prev.map((m) => (m.id === -1 ? greetingFor(t) : m)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suppressed, setSuppressed] = useState(false);
  const [liftForBuyBar, setLiftForBuyBar] = useState(false);
  const lastIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const append = useCallback((bubble: Bubble) => {
    setMessages((prev) => [...prev, bubble]);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    openBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    return onOpenSupportChatRequested(() => {
      setOpen(true);
      track("click", "support_chat_open_proactive");
    });
  }, []);

  // Stay out of the way of a checkout/ebook overlay (which sets
  // data-checkout-open) and shift up above the mobile sticky buy bar
  // (which sets data-sticky-buy-bar-visible) instead of overlapping it.
  useEffect(() => {
    const sync = () => {
      const checkoutOpen = document.body.getAttribute("data-checkout-open") === "true";
      setSuppressed(checkoutOpen);
      if (checkoutOpen) setOpen(false);
      setLiftForBuyBar(document.body.hasAttribute("data-sticky-buy-bar-visible"));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-checkout-open", "data-sticky-buy-bar-visible"],
    });
    return () => observer.disconnect();
  }, []);

  // Body scroll lock, focus trap, Escape-to-close and click-outside-to-dismiss
  // while the panel is open — same pattern as the checkout/ebook overlays.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
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

    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, close]);

  // Poll for Sarah's Telegram replies while the widget is open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const rows = await fetchSupportMessages({
          data: { sessionId: getSessionId(), afterId: lastIdRef.current },
        });
        if (cancelled || !rows.length) return;
        lastIdRef.current = rows[rows.length - 1]!.id;
        // Only Sarah's inbound replies are pulled in; our own optimistic
        // bubbles are already on screen.
        const inbound = rows.filter((r) => r.role === "sarah" && r.author === "Sarah");
        if (inbound.length) {
          setMessages((prev) => [
            ...prev,
            ...inbound.map((r) => ({ id: r.id, role: "sarah" as const, author: r.author, text: r.text })),
          ]);
        }
      } catch {
        // Polling must never surface an error to the visitor.
      }
    };

    void poll();
    const timer = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const submit = useCallback(
    async (text: string, entryId?: string) => {
      const clean = text.trim();
      if (!clean || busy) return;
      setBusy(true);
      setInput("");
      append({ id: Date.now(), role: "visitor", author: t("chat_you"), text: clean });
      try {
        const reply = await sendSupportMessage({
          data: {
            sessionId: getSessionId(),
            text: clean,
            entryId: entryId ?? null,
            lang: locale,
          },
        });
        const kind = "kind" in reply ? reply.kind : null;
        append({
          id: Date.now() + 1,
          role: "sarah",
          author: t("chat_assistant"),
          text:
            kind === "relayed"
              ? t("chat_notice_relayed")
              : kind === "unreachable"
                ? t("chat_notice_unreachable")
                : reply.text,
          links:
            kind === "unreachable"
              ? [{ label: t("chat_link_telegram"), url: "https://t.me/ezysarah" }]
              : reply.links,
          quick: reply.quick,
        });
      } catch {
        append({
          id: Date.now() + 2,
          role: "sarah",
          author: t("chat_assistant"),
          text: t("chat_error"),
        });
      } finally {
        setBusy(false);
      }
    },
    [append, busy, locale, t],
  );

  return (
    <>
      {!open && !suppressed && (
        <button
          ref={openBtnRef}
          type="button"
          onClick={() => {
            setOpen(true);
            track("click", "support_chat_open");
          }}
          aria-label={t("chat_open")}
          className={`fixed right-4 z-50 flex items-center gap-2 rounded-full border border-primary/40 bg-primary p-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-[transform,bottom] hover:scale-105 sm:right-5 sm:px-4 sm:py-3 ${
            liftForBuyBar ? "bottom-24 sm:bottom-5" : "bottom-5"
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">{t("chat_open")}</span>
        </button>
      )}

      {open && !suppressed && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("chat_open")}
          className={`fixed right-5 z-50 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${
            liftForBuyBar ? "bottom-24 sm:bottom-5" : "bottom-5"
          }`}
        >
          <header className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("nav_ask_sarah")}</p>
              <p className="text-xs text-muted-foreground">{t("chat_subtitle")}</p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={close}
              aria-label={t("chat_close")}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "visitor" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] space-y-2 rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === "visitor"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-foreground"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.links?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-primary/50 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {m.quick?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.quick.map((q) => (
                        <button
                          key={q.entryId + q.label}
                          type="button"
                          disabled={busy}
                          onClick={() => void submit(q.label, q.entryId)}
                          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-muted-foreground">{t("chat_typing")}</p>}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat_placeholder")}
              maxLength={1500}
              aria-label={t("nav_ask_sarah")}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t("chat_send")}
              className="rounded-lg bg-primary p-2 text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
