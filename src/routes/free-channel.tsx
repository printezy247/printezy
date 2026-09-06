import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, ArrowLeft, Users, ShieldCheck, Clock, Zap } from "lucide-react";
import { saveLead } from "@/lib/leads.functions";
import { LINKS } from "@/components/landing/Landing";
import { getSessionId } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { translations, type TranslationKey } from "@/lib/translations";
import { localizedHead } from "@/lib/seo";

export function freeChannelHead(locale: "en" | "ms") {
  const t = translations[locale];
  return localizedHead({
    path: "/free-channel",
    locale,
    title: t.fc_meta_title,
    description: t.fc_meta_desc,
  });
}

export const Route = createFileRoute("/free-channel")({
  head: () => freeChannelHead("en"),
  component: FreeChannelPage,
});

const benefits: { icon: typeof Zap; label: TranslationKey; desc: TranslationKey }[] = [
  { icon: Zap, label: "fc_benefit_signals_label", desc: "fc_benefit_signals_desc" },
  { icon: Clock, label: "fc_benefit_coverage_label", desc: "fc_benefit_coverage_desc" },
  {
    icon: ShieldCheck,
    label: "fc_benefit_transparency_label",
    desc: "fc_benefit_transparency_desc",
  },
  { icon: Users, label: "fc_benefit_members_label", desc: "fc_benefit_members_desc" },
];

export function FreeChannelPage() {
  const { t, locale } = useTranslation();
  const home = locale === "ms" ? "/ms" : "/";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      await saveLead({
        data: {
          email,
          name: name || undefined,
          source: "free-channel",
          telegramUsername: telegram || undefined,
          sessionId: getSessionId(),
        },
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t("fc_error_generic"));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex h-16 items-center justify-between">
          <Link to={home} className="text-lg font-black tracking-tight text-foreground">
            EzyMap
          </Link>
          <Link
            to={home}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("fc_back_home")}
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="w-full max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-10"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Send className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl">{t("fc_title")}</h1>
              <p className="mt-3 text-body">{t("fc_subtitle")}</p>

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="mt-8 rounded-xl border border-primary/30 bg-primary/8 p-6 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <Check className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg ">{t("fc_success_title")}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{t("fc_success_body")}</p>
                    <a
                      href={LINKS.freeChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
                    >
                      <Send className="h-4 w-4" /> {t("fc_open_channel")}
                    </a>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-1.5 block text-sm font-medium text-foreground"
                      >
                        {t("fc_label_name")}
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("fc_placeholder_name")}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-sm font-medium text-foreground"
                      >
                        {t("fc_label_email")} <span className="text-primary">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="telegram"
                        className="mb-1.5 block text-sm font-medium text-foreground"
                      >
                        {t("fc_label_telegram")}{" "}
                        <span className="text-muted-foreground">{t("fc_optional")}</span>
                      </label>
                      <input
                        id="telegram"
                        type="text"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder="@username"
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {status === "error" && <p className="text-sm text-destructive">{error}</p>}

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-60"
                    >
                      {status === "submitting" ? (
                        t("fc_saving")
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> {t("fc_submit")}
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-muted-foreground">{t("fc_no_spam")}</p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {benefits.map((b) => (
                <div
                  key={b.label}
                  className="rounded-xl border border-border bg-card p-4 text-center"
                >
                  <b.icon className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-xs font-semibold text-foreground">{t(b.label)}</p>
                  <p className="text-[11px] text-muted-foreground">{t(b.desc)}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
