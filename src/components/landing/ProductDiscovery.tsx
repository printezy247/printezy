import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { EzyMapAsset, type EzyMapProduct } from "@/components/brand/EzyMapAsset";
import { useTranslation, localizePath } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import { goTrack } from "@/lib/analytics";

const products: {
  product: EzyMapProduct;
  title: TranslationKey;
  body: TranslationKey;
  action: TranslationKey;
  href: string;
  event: string;
}[] = [
  {
    product: "channel",
    title: "show_signals_title",
    body: "show_signals_body",
    action: "show_signals_cta",
    href: "#packages",
    event: "showcase_signals",
  },
  {
    product: "ebooks",
    title: "show_learn_title",
    body: "show_learn_body",
    action: "show_learn_cta",
    href: "/ebooks/technical-analysis",
    event: "showcase_ebook",
  },
  {
    product: "macro-bot",
    title: "show_macro_title",
    body: "show_macro_body",
    action: "show_macro_cta",
    href: "/macro",
    event: "showcase_macro",
  },
];

export function ProductDiscovery() {
  const { t, locale } = useTranslation();
  const [active, setActive] = useState<EzyMapProduct | null>(null);
  return (
    <section id="showcase" className="launch-products">
      <div className="launch-products__heading">
        <h2>{t("show_title")}</h2>
        <p>{t("show_eyebrow")}</p>
      </div>
      <div className="launch-products__grid">
        {products.map((item) => (
          <a
            key={item.product}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setActive(item.product);
            }}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(item.product)}
            onBlur={() => setActive(null)}
            className={`launch-product launch-product--${item.product}`}
            href={item.href.startsWith("#") ? item.href : localizePath(item.href, locale)}
            onClick={() => goTrack(item.event)}
          >
            <div className="launch-product__art">
              <EzyMapAsset
                product={item.product}
                animated={active === item.product}
                loading="lazy"
              />
            </div>
            <h3>{t(item.title)}</h3>
            <p>{t(item.body)}</p>
            <span className="launch-product__action">
              {t(item.action)}
              <ArrowUpRight size={18} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
