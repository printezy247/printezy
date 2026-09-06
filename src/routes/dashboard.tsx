import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  BookOpen,
  Copy,
  Download,
  Gift,
  Loader2,
  LogOut,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { Nav, Footer } from "@/components/landing/Landing";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { getCatalogItem, formatUsd } from "@/lib/catalog";
import { EBOOK_PAGES, localizeEbook } from "@/lib/ebooks";
import { getMyPurchases } from "@/lib/purchases.functions";
import { getMyEbookClaims, getEbookDownloadUrl } from "@/lib/ebook-claims.functions";
import { getMyProfile, saveMyProfile } from "@/lib/profile.functions";
import { getOrCreateReferralCode, getMyReferralStats } from "@/lib/referral.functions";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [{ title: "My account — EzyMap ALGO" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: DashboardPage,
});

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Client-side gate: no session → /auth, which brings the visitor back here.
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        void navigate({ to: "/auth", search: { redirect: "/dashboard" }, replace: true });
        return;
      }
      setEmail(data.session.user.email ?? null);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {!ready ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl">{t("dash_title")}</h1>
                {email ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("dash_signed_in_as")} <span className="text-foreground">{email}</span>
                  </p>
                ) : null}
              </div>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" /> {t("dash_sign_out")}
              </Button>
            </header>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <PurchasesCard />
              <EbooksCard />
              <ReferralCard />
              <ProfileCard />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PurchasesCard() {
  const { t } = useTranslation();
  const fetchPurchases = useServerFn(getMyPurchases);
  const { data, isLoading } = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => fetchPurchases({ data: undefined }),
  });

  return (
    <Card icon={ShoppingBag} title={t("dash_purchases")}>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : !data || data.length === 0 ? (
        <div className="text-sm text-body">
          <p>{t("dash_no_purchases")}</p>
          <Link to="/" hash="packages" className="mt-3 inline-block text-primary hover:underline">
            {t("dash_browse_packages")}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((p) => {
            const item = getCatalogItem(p.sku);
            return (
              <li
                key={`${p.sku}-${p.createdAt}`}
                className="flex items-start justify-between gap-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{item?.name ?? p.sku}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                    {p.telegramUsername
                      ? ` · ${t("dash_delivered_to")} @${p.telegramUsername}`
                      : ""}
                  </p>
                  {p.redeemCode ? (
                    <div className="mt-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {t("dash_pro_code")}
                        </span>
                        <code className="select-all font-mono text-sm font-semibold text-foreground">
                          {p.redeemCode}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(p.redeemCode!);
                            toast.success(t("dash_copied"));
                          }}
                          aria-label={t("dash_copy")}
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {p.redeemed
                          ? t("dash_pro_code_redeemed")
                          : t("dash_pro_code_hint").replace("{code}", p.redeemCode)}
                      </p>
                    </div>
                  ) : null}
                </div>
                <span className="shrink-0 font-mono tabular-nums">{formatUsd(p.amountCents)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function EbooksCard() {
  const { t, locale } = useTranslation();
  const fetchClaims = useServerFn(getMyEbookClaims);
  const fetchLinks = useServerFn(getEbookDownloadUrl);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const { data: claims, isLoading } = useQuery({
    queryKey: ["my-ebook-claims"],
    queryFn: () => fetchClaims({ data: undefined }),
  });

  async function download(slug: string) {
    setBusySlug(slug);
    try {
      const { downloadUrl } = await fetchLinks({ data: { slug } });
      window.location.assign(downloadUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash_ebook_unavailable"));
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <Card icon={BookOpen} title={t("dash_ebooks")}>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <ul className="divide-y divide-border">
          {EBOOK_PAGES.map((source) => {
            const book = localizeEbook(source, locale);
            const claim = claims?.find((c) => c.slug === book.slug);
            return (
              <li key={book.slug} className="flex items-center justify-between gap-4 py-3 text-sm">
                <p className="min-w-0 font-semibold text-foreground">{book.title}</p>
                {claim?.status === "approved" ? (
                  <Button
                    size="sm"
                    onClick={() => void download(book.slug)}
                    disabled={busySlug === book.slug}
                  >
                    <Download className="h-4 w-4" />
                    {busySlug === book.slug ? "…" : t("dash_ebook_download")}
                  </Button>
                ) : claim?.status === "pending" ? (
                  <span className="shrink-0 text-xs text-accent">{t("dash_ebook_pending")}</span>
                ) : (
                  <Link
                    to={locale === "ms" ? "/ms/ebooks/$slug" : "/ebooks/$slug"}
                    params={{ slug: book.slug }}
                    search={{ claim: true }}
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    {t("dash_ebook_get")}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function ReferralCard() {
  const { t } = useTranslation();
  const getCode = useServerFn(getOrCreateReferralCode);
  const getStats = useServerFn(getMyReferralStats);
  const { data } = useQuery({
    queryKey: ["my-referral"],
    queryFn: async () => {
      const [{ code }, stats] = await Promise.all([
        getCode({ data: undefined }),
        getStats({ data: undefined }),
      ]);
      return { code, stats };
    },
  });
  const link = data ? `${window.location.origin}/?ref=${data.code}` : null;

  return (
    <Card icon={Gift} title={t("dash_referral")}>
      <p className="text-sm text-body">{t("dash_referral_body")}</p>
      {link ? (
        <>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <code className="flex-1 truncate text-xs text-body">{link}</code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(link);
                toast.success(t("dash_copied"));
              }}
              aria-label={t("dash_copy")}
              className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("dash_referral_stats")
              .replace("{signups}", String(data!.stats.signups))
              .replace("{purchases}", String(data!.stats.purchases))}
          </p>
        </>
      ) : (
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-muted-foreground" />
      )}
    </Card>
  );
}

function ProfileCard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(saveMyProfile);
  const { data } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile({ data: undefined }),
  });
  const [fullName, setFullName] = useState<string | null>(null);
  const [telegram, setTelegram] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const name = fullName ?? data?.fullName ?? "";
  const handle = telegram ?? data?.telegramUsername ?? "";
  const valid = /^[A-Za-z0-9_]{5,32}$/.test(handle.trim().replace(/^@+/, ""));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await save({ data: { fullName: name, telegramUsername: handle } });
      toast.success(t("dash_saved"));
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash_save_failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card icon={UserRound} title={t("dash_profile")}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm text-muted-foreground">
          {t("dash_full_name")}
          <input
            value={name}
            onChange={(e) => setFullName(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="text-sm text-muted-foreground">
          {t("dash_telegram")}
          <input
            value={handle}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="your_telegram"
            autoComplete="off"
            spellCheck={false}
            className={`${inputClass} mt-1`}
          />
        </label>
        <p className="text-xs text-muted-foreground">{t("dash_telegram_hint")}</p>
        <Button
          type="submit"
          size="sm"
          disabled={saving || !valid || name.trim().length === 0}
          className="self-start"
        >
          {saving ? "…" : t("dash_save")}
        </Button>
      </form>
    </Card>
  );
}
