import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { ConsentBanner } from "../components/ConsentBanner";
import { PaymentTestModeBanner } from "../components/PaymentTestModeBanner";
import { SupportChat } from "../components/SupportChat";
import { EbookAutoPopup } from "../components/EbookAutoPopup";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { captureReferralCode } from "../lib/referral-capture";
import { LocaleProvider } from "../lib/i18n";
import { SITE_URL } from "../lib/bot/tiers";
import { brandLogo } from "../components/landing/Landing";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const META_PIXEL_ID = "1029112770124061";
/** SRI hash of public/fb-pixel.js — regenerate whenever that file changes. */
const FB_PIXEL_SRI = "sha256-lLFCVCZYKsg3rRwZByerAajqxkFsdHVfG7BfYZU+xDs=";
const SUPABASE_ORIGIN = import.meta.env.VITE_SUPABASE_URL ?? "";
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://telegram.org",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_ORIGIN.replace(/^https/, "wss")} https://api.stripe.com https://*.stripe.com https://www.facebook.com https://connect.facebook.net`,
  "frame-src https://js.stripe.com https://*.stripe.com https://checkout.stripe.com https://oauth.telegram.org https://www.facebook.com",
].join("; ");

/**
 * Site-wide structured data. Only fields backed by real data in the repo —
 * no aggregateRating/review, no invented sameAs profiles (t.me/ezymap is the
 * one genuine public-channel URL found in the codebase; the enrollment/
 * macro/EzyAI bot links are tools, not social profiles).
 */
const ORGANIZATION_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EzyMap ALGO",
  url: SITE_URL,
  logo: `${SITE_URL}${brandLogo}`,
  foundingDate: "2021",
  sameAs: ["https://t.me/ezymap"],
});

const WEBSITE_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EzyMap ALGO",
  url: SITE_URL,
  inLanguage: "en",
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { httpEquiv: "Content-Security-Policy", content: CSP },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EzyMap ALGO — Professional Trading Signals on Telegram" },
      { name: "description", content: "EzyMap ALGO delivers real-time trading signals and daily education to 640+ traders on Telegram. Forex, crypto and commodities, 24/5." },
      { name: "author", content: "EzyMap ALGO" },
      { property: "og:title", content: "EzyMap ALGO — Professional Trading Signals on Telegram" },
      { property: "og:description", content: "Live signals and education for 640+ traders. Start free on Telegram." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "EzyMap ALGO" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EzyMap ALGO — Professional Trading Signals" },
      { name: "twitter:description", content: "Live signals and education for 640+ traders on Telegram." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter+Tight:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter+Tight:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
    scripts: [
      { src: "/fb-pixel.js", integrity: FB_PIXEL_SRI, defer: true },
      { type: "application/ld+json", children: ORGANIZATION_JSON_LD },
      { type: "application/ld+json", children: WEBSITE_JSON_LD },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const lang = pathname === "/ms" || pathname.startsWith("/ms/") ? "ms" : "en";
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        {children}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    captureReferralCode();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <PaymentTestModeBanner />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <div id="main" tabIndex={-1} className="outline-none">
          <Outlet />
        </div>
        <SupportChat />
        <ConsentBanner />
        <EbookAutoPopup />
        <Toaster position="bottom-right" />
      </LocaleProvider>
    </QueryClientProvider>
  );
}
