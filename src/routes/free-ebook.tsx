import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Check, ArrowLeft, Download, Mail, FileText, GraduationCap } from "lucide-react";
import { saveLead } from "@/lib/leads.functions";
import { LINKS, EBOOKS } from "@/components/landing/Landing";
import { getSessionId } from "@/lib/analytics";

export const Route = createFileRoute("/free-ebook")({
  head: () => ({
    meta: [
      { title: "Download Free Trading Ebooks — EzyMap" },
      { name: "description", content: "Download free PDF trading ebooks: market mapping and technical analysis guides." },
      { property: "og:title", content: "Download Free Trading Ebooks — EzyMap" },
      { property: "og:description", content: "Download free PDF trading ebooks: market mapping and technical analysis guides." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FreeEbookPage,
});

function FreeEbookPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
          source: "free-ebook",
          sessionId: getSessionId(),
        },
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex h-16 items-center justify-between">
          <Link to="/" className="text-lg font-black tracking-tight text-foreground">
            EzyMap
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="w-full max-w-4xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">Free trading ebooks</h1>
                <p className="mt-4 max-w-lg text-body">
                  Two PDF guides built from 10+ years of live trading. Enter your email and get instant access.
                </p>

                <div className="mt-8 space-y-4">
                  {EBOOKS.map((book) => (
                    <div
                      key={book.title}
                      className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                        <img
                          src={book.image}
                          alt={book.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{book.title}</h3>
                        <ul className="mt-2 space-y-1">
                          {book.bullets.slice(0, 2).map((b) => (
                            <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <FileText className="mx-auto h-5 w-5 text-accent" />
                    <p className="mt-2 text-xs font-semibold text-foreground">PDF format</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <GraduationCap className="mx-auto h-5 w-5 text-accent" />
                    <p className="mt-2 text-xs font-semibold text-foreground">Beginner friendly</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <Mail className="mx-auto h-5 w-5 text-accent" />
                    <p className="mt-2 text-xs font-semibold text-foreground">Sent to inbox</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-fit rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8"
              >
                <h2 className="text-xl font-bold">Get your free copies</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Join the list and we'll send the download links straight to your email.
                </p>

                <AnimatePresence mode="wait">
                  {status === "success" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="mt-6 rounded-xl border border-accent/30 bg-accent/8 p-6 text-center"
                    >
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/12 text-accent">
                        <Check className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold">Check your inbox</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        The ebook download links have been sent to {email}.
                      </p>
                      <a
                        href={LINKS.ebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-accent bg-card px-5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent-tint"
                      >
                        <Download className="h-4 w-4" /> Open Telegram Download
                      </a>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="mt-6 space-y-4"
                    >
                      <div>
                        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
                          Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                          Email <span className="text-accent">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>

                      {status === "error" && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}

                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-accent bg-card px-5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent-tint disabled:opacity-60"
                      >
                        {status === "submitting" ? (
                          "Saving..."
                        ) : (
                          <>
                            <Download className="h-4 w-4" /> Send Me The Ebooks
                          </>
                        )}
                      </button>
                      <p className="text-center text-xs text-muted-foreground">
                        No spam. Unsubscribe anytime.
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
