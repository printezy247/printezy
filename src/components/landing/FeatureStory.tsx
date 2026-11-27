import { useState } from "react";
import { ArrowRight, BarChart3, Crosshair, Send, TrendingUp } from "lucide-react";
import { MotionControl } from "@/components/brand/MotionControl";
import { EzyMapAsset } from "@/components/brand/EzyMapAsset";
import { Button } from "@/components/ui/button";
import { goTrack } from "@/lib/analytics";
import { localizePath, useTranslation } from "@/lib/i18n";
import { LINKS } from "@/lib/links";
import { Section, SectionHeading } from "./primitives";

const BENEFITS = [
  ["feature_signals_title", "feature_signals_body"],
  ["feature_education_title", "feature_education_body"],
  ["feature_mobile_title", "feature_mobile_body"],
] as const;

const SETUPS = [
  {
    label: "EMA 21/50",
    icon: TrendingUp,
    reason: "hero_card_reason_ema",
    entry: 2410,
    stop: 2406,
    target: 2418,
  },
  {
    label: "MACD",
    icon: BarChart3,
    reason: "hero_card_reason_macd",
    entry: 2412,
    stop: 2409,
    target: 2418,
  },
  {
    label: "Support / Resistance",
    icon: Crosshair,
    reason: "hero_card_reason_structure",
    entry: 2408,
    stop: 2403,
    target: 2418,
  },
] as const;

const PRODUCTS = [
  {
    art: "channel",
    title: "nav_packages",
    body: "pricing_subtitle",
    href: "/pricing",
    cta: "hero_cta_packages",
  },
  {
    art: "pro",
    title: "products_tv_heading",
    body: "tv_pro_tagline",
    href: "/indicators#tv_pro",
    cta: "nav_tools",
  },
  {
    art: "calculators",
    title: "products_mt5_heading",
    body: "mt5_drawdown_tagline",
    href: "/indicators#mt5_drawdown_guardian",
    cta: "nav_tools",
  },
  {
    art: "macro-bot",
    title: "products_macro_heading",
    body: "macro_feature_1",
    href: "/macro",
    cta: "show_macro_cta",
  },
  {
    art: "ebooks",
    title: "products_ebooks_heading",
    body: "ebook_technical_b1",
    href: "/ebooks/technical-analysis",
    cta: "hero_cta_ebook",
  },
] as const;

export function FeatureStory() {
  const { t, locale } = useTranslation();
  const [sampleIndex, setSampleIndex] = useState(0);
  const [orbitPlaying, setOrbitPlaying] = useState(true);
  const sample = SETUPS[sampleIndex];
  return (
    <>
      <Section id="features">
        <SectionHeading eyebrow={t("features_eyebrow")} title={t("features_title")} />
        <div className="home-orbit" data-playing={orbitPlaying}>
          <div className="home-orbit__track home-orbit__track--outer" aria-hidden="true" />
          <div className="home-orbit__track home-orbit__track--inner" aria-hidden="true" />
          <EzyMapAsset logo="gold" className="home-orbit__mark" loading="lazy" />
          {(["channel", "bot", "pro", "miniapp", "macro-bot", "calculators"] as const).map(
            (product) => (
              <EzyMapAsset
                key={product}
                product={product}
                className="home-orbit__item"
                loading="lazy"
              />
            ),
          )}
          <div className="home-hero__motion">
            <MotionControl
              locale={locale}
              playing={orbitPlaying}
              onToggle={() => setOrbitPlaying((playing) => !playing)}
            />
          </div>
        </div>
        <div className="home-benefits">
          {BENEFITS.map(([title, body]) => (
            <div key={title}>
              <h3 className="text-xl font-bold">{t(title)}</h3>
              <p className="mt-2 text-body">{t(body)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="signal-demo" className="home-demo">
        <SectionHeading
          eyebrow={t("features_story_eyebrow_flow")}
          title={t("features_story_title_flow")}
          subtitle={t("features_story_subtitle_flow")}
        />
        <div className="home-diagram">
          <div
            className="home-diagram__column"
            role="group"
            aria-label={t("hero_card_tab_analysis")}
          >
            <p className="home-diagram__label">{t("hero_card_tab_analysis")}</p>
            {SETUPS.map(({ label, icon: Icon }, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={index === sampleIndex}
                aria-controls="sample-plan"
                className="home-diagram__input"
                onClick={() => setSampleIndex(index)}
              >
                <Icon size={18} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
          <span className="home-diagram__connector" aria-hidden="true" />
          <div className="home-diagram__plan" id="sample-plan" aria-live="polite">
            <div className="flex items-center gap-2">
              <EzyMapAsset className="size-10" loading="lazy" />
              <div>
                <h3 className="font-bold">EzyMap ALGO</h3>
                <p className="text-xs text-muted-foreground">{t("hero_sample_badge")} · XAU/USD</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-body">{t(sample.reason)}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["features_story_flow_entry", sample.entry],
                  ["features_story_flow_stop", sample.stop],
                  ["features_story_flow_tp1", sample.target],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className="min-w-0 rounded-md bg-background p-2">
                  <dt className="text-xs text-muted-foreground">{t(key)}</dt>
                  <dd className="mt-1 font-mono font-bold" dir="ltr">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <span className="home-diagram__connector" aria-hidden="true" />
          <div className="home-diagram__column">
            <a
              className="home-diagram__input"
              href={localizePath("/indicators#mt5_drawdown_guardian", locale)}
            >
              <BarChart3 size={18} aria-hidden="true" /> MetaTrader 5
            </a>
            <a className="home-diagram__input" href={localizePath("/free-channel", locale)}>
              <Send size={18} aria-hidden="true" /> Telegram
            </a>
            <div
              className="home-diagram__result"
              aria-describedby="sample-disclaimer"
              aria-live="polite"
            >
              <span className="home-diagram__label">{t("hero_sample_badge")} · TP1</span>
              <strong key={sampleIndex} className="home-diagram__gain" dir="ltr">
                +{(sample.target - sample.entry).toFixed(2)} USD / oz
              </strong>
            </div>
          </div>
        </div>
        <p
          id="sample-disclaimer"
          className="mx-auto mt-5 max-w-3xl text-center text-sm text-muted-foreground"
        >
          {t("hero_disclaimer")}
        </p>
      </Section>

      <Section id="packages">
        <SectionHeading
          eyebrow={t("products_eyebrow")}
          title={t("products_title")}
          subtitle={t("products_subtitle")}
        />
        <div className="home-products">
          {PRODUCTS.map(({ art, title, body, href, cta }) => (
            <article className="home-product" key={art}>
              <EzyMapAsset product={art} className="home-product__art" loading="lazy" />
              <h3 className="text-xl font-bold">{t(title)}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{t(body)}</p>
              <Button asChild size="sm" variant="outline" className="mt-5 self-start">
                <a
                  href={href === "/pricing" ? href : localizePath(href, locale)}
                  onClick={() => goTrack(`home_product_${art}`)}
                >
                  {t(cta)} <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
                </a>
              </Button>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}

export function HomeCloser() {
  const { t, locale } = useTranslation();
  return (
    <Section id="get-started" className="home-closer text-center">
      <EzyMapAsset logo="gold" className="mx-auto size-24" loading="lazy" />
      <h2 className="home-closer__title">{t("final_title")}</h2>
      <p className="mx-auto mt-4 max-w-xl text-body">{t("features_story_closer_body")}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild variant="primary">
          <a
            href={localizePath("/free-channel", locale)}
            onClick={() => goTrack("final_join_free")}
          >
            <Send aria-hidden="true" /> {t("hero_cta_join")}
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={LINKS.freeClass} onClick={() => goTrack("zoom_class_join")}>
            {t("announce_pill")} <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
          </a>
        </Button>
      </div>
      <nav
        aria-label={t("nav_site_menu")}
        className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold"
      >
        <a className="hover:underline" href="/pricing">
          {t("nav_packages")}
        </a>
        <a className="hover:underline" href={localizePath("/indicators", locale)}>
          {t("nav_tools")}
        </a>
        <a className="hover:underline" href={localizePath("/macro", locale)}>
          {t("nav_macro")}
        </a>
      </nav>
    </Section>
  );
}
