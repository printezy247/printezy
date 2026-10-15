"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { goTrack } from "@/lib/analytics";
import { LINKS } from "./Landing";
import { Send, MessageSquare, ArrowRight, ExternalLink, X, Zap, Users } from "lucide-react";
import { Reveal } from "./Landing";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import type { TranslationKey } from "@/lib/translations";

/**
 * Pre-landing section with three CTA options before the main content.
 * Follows the "Funnel (3-Step Conversion)" pattern for progressive disclosure.
 * Appears as a modal gateway before users can access the main landing page.
 * Uses sessionStorage to show once per session.
 */
export function PreLandingSection({
  onDismiss,
  showOnce = true,
}: {
  onDismiss: () => void;
  showOnce?: boolean;
}) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const [hasSeen, setHasSeen] = useState(false);

  // Check if user has already seen this (using sessionStorage for session-only)
  useEffect(() => {
    if (showOnce) {
      const seen = sessionStorage.getItem("prelanding_seen");
      if (seen) {
        setHasSeen(true);
      }
    }
  }, [showOnce]);

  if (hasSeen) {
    onDismiss();
    return null;
  }

  const handleDismiss = (event: string) => {
    goTrack(event);
    if (showOnce) {
      sessionStorage.setItem("prelanding_seen", "true");
    }
    onDismiss();
  };

  const ctaItems = [
    {
      id: "view-now",
      labelKey: "prelanding_view_now" as TranslationKey,
      descKey: "prelanding_view_now_desc" as TranslationKey,
      icon: Send,
      href: LINKS.freeChannel,
      event: "prelanding_view_now_click",
      variant: "primary" as const,
      external: true,
    },
    {
      id: "chat-now",
      labelKey: "prelanding_chat_now" as TranslationKey,
      descKey: "prelanding_chat_now_desc" as TranslationKey,
      icon: MessageSquare,
      href: LINKS.support,
      event: "prelanding_chat_now_click",
      variant: "outline" as const,
      external: true,
    },
    {
      id: "find-out-more",
      labelKey: "prelanding_find_out_more" as TranslationKey,
      descKey: "prelanding_find_out_more_desc" as TranslationKey,
      icon: ArrowRight,
      href: "#features",
      event: "prelanding_find_out_more_click",
      variant: "ghost" as const,
      external: false,
    },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prelanding-title"
      aria-describedby="prelanding-desc"
    >
      {/* Background orbs for visual interest - matching Hero style */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="glow-orb animate-float-slow motion-reduce:animate-none left-[-10%] top-[-15%] h-[400px] w-[400px] bg-primary/20" />
        <div className="glow-orb animate-float-slower motion-reduce:animate-none right-[-8%] bottom-[-10%] h-[350px] w-[350px] bg-accent/15" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Reveal y={20} delay={0.1}>
          <div className="glass-card card-lift rounded-2xl p-8 sm:p-10 border border-border/50">
            {/* Close button */}
            <button
              type="button"
              onClick={() => handleDismiss("prelanding_dismiss")}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label={t("prelanding_close")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <span className="hero-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-body">
                <Zap className="h-3.5 w-3.5 text-primary" />
                {t("prelanding_badge")}
              </span>
              <h1 id="prelanding-title" className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
                {t("prelanding_title")}
              </h1>
              <p id="prelanding-desc" className="mt-3 text-base sm:text-lg text-body max-w-lg mx-auto">
                {t("prelanding_subtitle")}
              </p>
            </div>

            {/* Three CTA Cards - Funnel (3-Step Conversion) pattern */}
            <div className="grid gap-4 sm:grid-cols-3">
              {ctaItems.map((item, index) => (
                <Reveal key={item.id} y={20} delay={0.2 + index * 0.1}>
                  <CTACard
                    item={item}
                    onClick={() => handleDismiss(item.event)}
                    reducedMotion={reducedMotion}
                  />
                </Reveal>
              ))}
            </div>

            {/* Trust indicator */}
            <p className="mt-6 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {t("prelanding_trust_note")}
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

interface CTACardProps {
  item: {
    id: string;
    labelKey: TranslationKey;
    descKey: TranslationKey;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    event: string;
    variant: "primary" | "outline" | "ghost";
    external: boolean;
  };
  onClick: () => void;
  reducedMotion: boolean;
}

function CTACard({
  item,
  onClick,
  reducedMotion,
}: CTACardProps) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const [isHovered, setIsHovered] = useState(false);

  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-glow border border-primary/50",
    outline: "border border-border bg-transparent text-foreground hover:bg-surface",
    ghost: "bg-transparent text-foreground hover:bg-surface border border-transparent",
  };

  const iconBgClasses = {
    primary: "bg-primary/20 text-primary",
    outline: "bg-surface text-foreground",
    ghost: "bg-surface text-foreground",
  };

  const arrowClasses = {
    primary: "bg-primary-foreground/10 text-primary-foreground",
    outline: "bg-surface text-muted-foreground",
    ghost: "bg-surface text-muted-foreground",
  };

  return (
    <article className="relative group">
      {item.variant === "primary" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:transition-none"
        />
      )}
      {item.variant === "outline" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-xl border-2 border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:transition-none"
        />
      )}
      <div
        className={`
          relative glass-card card-lift flex h-full flex-col items-center justify-center gap-3 rounded-xl p-6
          border transition-all duration-200 motion-reduce:transition-none
          ${variantClasses[item.variant]}
          ${item.variant === "primary" ? "shadow-[0_0_30px_rgba(47,191,113,0.15)]" : ""}
          ${item.variant === "outline" ? "shadow-sm" : ""}
          ${item.variant === "ghost" ? "shadow-none" : ""}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Icon with glow effect */}
        <div
          className={`
            inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 motion-reduce:transition-none
            ${iconBgClasses[item.variant]}
            ${isHovered ? "scale-110" : ""}
          `}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        {/* Label */}
        <h3 className="text-lg font-semibold text-center text-foreground">
          {t(item.labelKey)}
        </h3>

        {/* Description */}
        <p className="text-sm text-center text-body leading-relaxed">
          {t(item.descKey)}
        </p>

        {/* Arrow indicator */}
        <div
          className={`
            inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 motion-reduce:transition-none
            ${arrowClasses[item.variant]}
            ${isHovered ? "translate-x-1" : ""}
          `}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          {item.external && <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
        </div>
      </div>

      {/* Accessible button wrapper - covers entire card for better touch targets (WCAG 2.2 AA: 24x24px minimum) */}
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        aria-label={t(item.labelKey)}
      >
        <span className="sr-only">{t(item.labelKey)}</span>
      </button>
    </article>
  );
}

/**
 * Wrapper component that conditionally renders the PreLandingSection
 * before showing the main content. Uses sessionStorage to show once per session.
 */
export function PreLandingTrigger({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showPreLanding, setShowPreLanding] = useState(true);
  const mountedRef = useRef(false);

  // Check sessionStorage on mount
  useEffect(() => {
    mountedRef.current = true;
    const seen = sessionStorage.getItem("prelanding_seen");
    if (seen) {
      setShowPreLanding(false);
    }
  }, []);

  // During SSR/hydration, don't render pre-landing to avoid mismatch
  if (!mountedRef.current) {
    return <>{children}</>;
  }

  if (!showPreLanding) {
    return <>{children}</>;
  }

  return (
    <>
      <PreLandingSection onDismiss={() => setShowPreLanding(false)} />
      <>{children}</>
    </>
  );
}