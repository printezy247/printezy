import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  LineChart,
  LogOut,
  Plus,
  Radio,
  Receipt,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  deleteTrade,
  getDashboard,
  requestLoginCode,
  saveTrade,
  signOutMember,
  verifyLoginCode,
  type MemberDashboard,
} from "@/lib/member.functions";
import { formatPrice } from "@/lib/bot/tiers";
import { LINKS } from "@/components/landing/Landing";

const STORAGE_KEY = "ezymap_member_session";

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>) => ({
    s: typeof search.s === "string" ? search.s : "",
    canceled: search.canceled === "1" || search.canceled === 1,
  }),
  head: () => ({
    meta: [
      { title: "My Trading Account — EzyMap ALGO Members" },
      {
        name: "description",
        content:
          "Sign in with a code from the EzyMap ALGO bot to see your signals, your trade log, performance stats and billing history.",
      },
      { property: "og:title", content: "My Trading Account — EzyMap ALGO" },
      {
        property: "og:description",
        content: "Your signals, trade log, performance stats and billing in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Tab = "signals" | "trades" | "billing";

function AccountPage() {
  const { s, canceled } = Route.useSearch();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("signals");
  const queryClient = useQueryClient();

  const fetchDashboard = useServerFn(getDashboard);
  const endSession = useServerFn(signOutMember);

  // Resolve the session once on the client: URL session, bot portal link, or storage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Bearer tokens must not linger in the address bar (history, referrers,
      // analytics pixels). Consume them, then rewrite the URL.
      if (s) window.history.replaceState(null, "", "/account");
      if (s) {
        localStorage.setItem(STORAGE_KEY, s);
        if (!cancelled) setToken(s);
      } else if (stored) {
        if (!cancelled) setToken(stored);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [s]);

  const { data, isLoading } = useQuery<MemberDashboard>({
    queryKey: ["dashboard", token],
    queryFn: () => fetchDashboard({ data: { token: token as string } }),
    enabled: !!token,
    refetchInterval: (q) =>
      q.state.data?.billing?.some((b) => b.status === "pending") ? 6000 : false,
  });

  const signOut = async () => {
    if (token) await endSession({ data: { token } }).catch(() => {});
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    queryClient.clear();
  };

  if (!ready) return <Shell>{null}</Shell>;

  if (!token || (data && !data.authenticated)) {
    return (
      <Shell>
        <SignIn
          onSignedIn={(newToken) => {
            localStorage.setItem(STORAGE_KEY, newToken);
            setToken(newToken);
          }}
        />
      </Shell>
    );
  }

  if (isLoading || !data) {
    return (
      <Shell>
        <Panel>
          <p className="text-sm text-muted-foreground">Loading your account…</p>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Signed in
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {data.member?.name ?? "Member"}
            {data.member?.handle ? (
              <span className="text-muted-foreground"> @{data.member.handle}</span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            {data.tier?.name} plan
          </span>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      {canceled ? (
        <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-foreground">
          Payment was cancelled. Your spot is still reserved — reopen the bot to finish
          checkout.
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Trades logged" value={String(data.stats?.trades ?? 0)} />
        <Stat label="Win rate" value={`${data.stats?.winRate ?? 0}%`} />
        <Stat label="Total pips" value={String(data.stats?.totalPips ?? 0)} />
        <Stat
          label="Net P/L"
          value={`${(data.stats?.totalPnl ?? 0) >= 0 ? "+" : ""}${data.stats?.totalPnl ?? 0}`}
        />
      </div>

      <div className="mt-8 flex gap-2 border-b border-border/60">
        <TabButton active={tab === "signals"} onClick={() => setTab("signals")} Icon={Radio}>
          Signals
        </TabButton>
        <TabButton active={tab === "trades"} onClick={() => setTab("trades")} Icon={LineChart}>
          My trades
        </TabButton>
        <TabButton active={tab === "billing"} onClick={() => setTab("billing")} Icon={Receipt}>
          Billing
        </TabButton>
      </div>

      {tab === "signals" ? <SignalsTab data={data} /> : null}
      {tab === "trades" ? <TradesTab data={data} token={token} /> : null}
      {tab === "billing" ? <BillingTab data={data} /> : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          to="/"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← EzyMap ALGO
        </Link>
        <h1 className="mt-6 text-3xl tracking-tight text-foreground sm:text-4xl">
          My trading account
        </h1>
        {children}
      </div>
    </main>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: (token: string) => void }) {
  const [handle, setHandle] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"handle" | "code">("handle");
  const [message, setMessage] = useState<string | null>(null);

  const askCode = useServerFn(requestLoginCode);
  const verify = useServerFn(verifyLoginCode);

  const request = useMutation({
    mutationFn: () => askCode({ data: { handle } }),
    onSuccess: (res) => {
      setMessage(res.message);
      if (res.sent) setStage("code");
    },
    onError: () => setMessage("Something went wrong. Try again."),
  });

  const confirm = useMutation({
    mutationFn: () => verify({ data: { handle, code } }),
    onSuccess: (res) => {
      if (res.ok && res.token) onSignedIn(res.token);
      else setMessage(res.message ?? "That code is not right.");
    },
    onError: () => setMessage("Something went wrong. Try again."),
  });

  return (
    <Panel>
      <p className="text-sm text-muted-foreground">
        Your account is tied to your Telegram. Enter your handle and the enrollment bot
        sends you a 6-digit sign-in code.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          if (stage === "handle") request.mutate();
          else confirm.mutate();
        }}
      >
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Telegram handle
          </label>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@yourhandle"
            autoComplete="username"
            className="mt-2 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        {stage === "code" ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              6-digit code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="mt-2 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-lg tracking-[0.4em] text-foreground outline-none focus:border-primary"
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={request.isPending || confirm.isPending || handle.length < 2}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {stage === "handle"
            ? request.isPending
              ? "Sending code…"
              : "Send me a code"
            : confirm.isPending
              ? "Checking…"
              : "Sign in"}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border/60 pt-6">
        <AccessLink href={LINKS.bot}>Open the enrollment bot</AccessLink>
        <AccessLink href={LINKS.support}>Contact support</AccessLink>
      </div>
    </Panel>
  );
}

function SignalsTab({ data }: { data: MemberDashboard }) {
  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Signal history — {data.tier?.name} access
      </p>
      {data.signals?.length ? (
        <div className="mt-4 space-y-3">
          {data.signals.map((sig) => (
            <div
              key={sig.id}
              className="rounded-xl border border-border/60 bg-background/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground">
                  {sig.symbol}{" "}
                  <span
                    className={
                      sig.direction === "buy" ? "text-primary" : "text-destructive"
                    }
                  >
                    {sig.direction.toUpperCase()}
                  </span>
                </p>
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {sig.status}
                  {sig.resultPips != null ? ` · ${sig.resultPips} pips` : ""}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Entry {sig.entryPrice ?? "—"} · SL {sig.stopPrice ?? "—"} · TP{" "}
                {sig.targetPrice ?? "—"} · {formatDate(sig.publishedAt)}
              </p>
              {sig.note ? (
                <p className="mt-2 text-sm text-foreground">{sig.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No signals in your feed yet. Upgrade your package to unlock higher-tier setups.
        </p>
      )}
    </Panel>
  );
}

function TradesTab({ data, token }: { data: MemberDashboard; token: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    symbol: "",
    direction: "buy" as "buy" | "sell",
    entryPrice: "",
    exitPrice: "",
    size: "",
    pips: "",
    pnl: "",
    status: "open" as "open" | "closed",
    notes: "",
  });

  const persist = useServerFn(saveTrade);
  const remove = useServerFn(deleteTrade);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dashboard"] });

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const create = useMutation({
    mutationFn: () =>
      persist({
        data: {
          token,
          symbol: form.symbol,
          direction: form.direction,
          entryPrice: num(form.entryPrice),
          exitPrice: num(form.exitPrice),
          size: num(form.size),
          pips: num(form.pips),
          pnl: num(form.pnl),
          status: form.status,
          notes: form.notes || undefined,
        },
      }),
    onSuccess: () => {
      setOpen(false);
      setForm({ ...form, symbol: "", entryPrice: "", exitPrice: "", size: "", pips: "", pnl: "", notes: "" });
      invalidate();
    },
  });

  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { token, id } }),
    onSuccess: invalidate,
  });

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          My trade log
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Log a trade
        </button>
      </div>

      {open ? (
        <form
          className="mt-5 grid gap-3 rounded-xl border border-border/60 bg-background/40 p-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.symbol.trim()) create.mutate();
          }}
        >
          <Field label="Symbol">
            <input
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder="XAUUSD"
              className={inputCls}
            />
          </Field>
          <Field label="Direction">
            <select
              value={form.direction}
              onChange={(e) =>
                setForm({ ...form, direction: e.target.value as "buy" | "sell" })
              }
              className={inputCls}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as "open" | "closed" })
              }
              className={inputCls}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
          <Field label="Entry">
            <input
              value={form.entryPrice}
              onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label="Exit">
            <input
              value={form.exitPrice}
              onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label="Size (lots)">
            <input
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label="Pips">
            <input
              value={form.pips}
              onChange={(e) => setForm({ ...form, pips: e.target.value })}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label="P/L">
            <input
              value={form.pnl}
              onChange={(e) => setForm({ ...form, pnl: e.target.value })}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label="Notes">
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {create.isPending ? "Saving…" : "Save trade"}
            </button>
          </div>
        </form>
      ) : null}

      {data.trades?.length ? (
        <div className="mt-5 space-y-3">
          {data.trades.map((tr) => (
            <div
              key={tr.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-4"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {tr.symbol}{" "}
                  <span
                    className={tr.direction === "buy" ? "text-primary" : "text-destructive"}
                  >
                    {tr.direction.toUpperCase()}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Entry {tr.entryPrice ?? "—"} · Exit {tr.exitPrice ?? "—"} · Size{" "}
                  {tr.size ?? "—"} · {formatDate(tr.openedAt)}
                </p>
                {tr.notes ? (
                  <p className="mt-1 text-sm text-foreground">{tr.notes}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      (tr.pnl ?? tr.pips ?? 0) >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {tr.pips != null ? `${tr.pips} pips` : "—"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {tr.status}
                  </p>
                </div>
                <button
                  onClick={() => destroy.mutate(tr.id)}
                  aria-label="Delete trade"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Nothing logged yet. Add your first trade and your stats start building.
        </p>
      )}
    </Panel>
  );
}

function BillingTab({ data }: { data: MemberDashboard }) {
  return (
    <>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Billing history
        </p>
        {data.billing?.length ? (
          <div className="mt-4 space-y-3">
            {data.billing.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">{b.tierName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enrolled {formatDate(b.createdAt)}
                    {b.activatedAt ? ` · activated ${formatDate(b.activatedAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(b.amountCents, b.currency)}
                  </span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No packages yet. Open the bot to pick one.
          </p>
        )}
      </Panel>

      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Your access
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <AccessLink href={LINKS.freeChannel}>Open the channel</AccessLink>
          <AccessLink href={LINKS.bot}>Open the bot</AccessLink>
          <AccessLink href={LINKS.support}>Contact support</AccessLink>
        </div>
        {data.tier?.perks?.length ? (
          <ul className="mt-5 space-y-2 border-t border-border/60 pt-5">
            {data.tier.perks.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>
    </>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Radio;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="glass-card mt-6 rounded-2xl p-6">{children}</section>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { Icon: typeof CheckCircle2; text: string; cls: string }> = {
    active: {
      Icon: CheckCircle2,
      text: "Active",
      cls: "border-primary/40 bg-primary/10 text-primary",
    },
    pending: {
      Icon: Clock,
      text: "Awaiting payment",
      cls: "border-accent/40 bg-accent/10 text-accent",
    },
    canceled: {
      Icon: XCircle,
      text: "Canceled",
      cls: "border-destructive/40 bg-destructive/10 text-destructive",
    },
  };
  const cfg = map[status] ?? map["pending"]!;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.cls}`}
    >
      <cfg.Icon className="h-3.5 w-3.5" />
      {cfg.text}
    </span>
  );
}

function AccessLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/60"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
