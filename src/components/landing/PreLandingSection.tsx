import { useEffect, useRef } from "react";
import { ArrowRight, MessageSquare, Send, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { goTrack } from "@/lib/analytics";
import { LINKS } from "@/lib/links";

const SEEN_KEY = "prelanding_seen";

/** A first-visit choice prompt for the full landing page, shown once per tab session. */
export function PreLandingSection() {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === "true") return;
    } catch {
      // Storage may be disabled; still show the prompt for this visit.
    }
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  const dismiss = (event?: string) => {
    if (event) goTrack(event);
    try {
      sessionStorage.setItem(SEEN_KEY, "true");
    } catch {
      // The dialog can still be dismissed for this page view.
    }
    if (dialog.current?.open) dialog.current.close();
  };

  const choices = [
    {
      title: t("prelanding_view_now"),
      description: t("prelanding_view_now_desc"),
      href: LINKS.freeChannel,
      event: "prelanding_view_now_click",
      icon: Send,
      external: true,
    },
    {
      title: t("prelanding_chat_now"),
      description: t("prelanding_chat_now_desc"),
      href: LINKS.support,
      event: "prelanding_chat_now_click",
      icon: MessageSquare,
      external: true,
    },
    {
      title: t("prelanding_find_out_more"),
      description: t("prelanding_find_out_more_desc"),
      href: "#features",
      event: "prelanding_find_out_more_click",
      icon: ArrowRight,
      external: false,
    },
  ];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="prelanding-title"
      aria-describedby="prelanding-description"
      onClose={() => {
        try {
          sessionStorage.setItem(SEEN_KEY, "true");
        } catch {
          // Dismissing the prompt should not depend on storage access.
        }
      }}
      className="m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <section className="relative p-6 sm:p-9">
        <button
          type="button"
          aria-label={t("prelanding_close")}
          onClick={() => dismiss("prelanding_dismiss")}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {t("prelanding_badge")}
        </p>
        <h2 id="prelanding-title" className="mt-3 pr-10 text-2xl font-bold sm:text-3xl">
          {t("prelanding_title")}
        </h2>
        <p
          id="prelanding-description"
          className="mt-3 max-w-xl text-sm leading-relaxed text-body sm:text-base"
        >
          {t("prelanding_subtitle")}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {choices.map(({ title, description, href, event, icon: Icon, external }) => (
            <a
              key={event}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              onClick={() => dismiss(event)}
              className="group flex min-h-32 flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/60 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="mt-3 font-semibold">{title}</span>
              <span className="mt-1 flex-1 text-sm text-body">{description}</span>
              <ArrowRight
                className="mt-3 h-4 w-4 self-end text-muted-foreground transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("prelanding_trust_note")}
        </p>
      </section>
    </dialog>
  );
}
