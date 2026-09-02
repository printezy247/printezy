import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { verifyAdminKey } from "@/lib/admin.functions";
import { Nav, Footer, TrackRecord } from "@/components/landing/Landing";

const STORAGE_KEY = "printezy-admin-unlocked";

export const Route = createFileRoute("/track-record")({
  head: () => ({
    meta: [
      { title: "Track Record (Admin) | PrintEzy" },
      {
        name: "description",
        content: "Private admin view of the PrintEzy signal history and verification links.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Track Record (Admin) | PrintEzy" },
      {
        property: "og:description",
        content: "Private admin view of the PrintEzy signal history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackRecordPage,
});

function TrackRecordPage() {
  const verify = useServerFn(verifyAdminKey);
  const [unlocked, setUnlocked] = useState(false);
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verify({ data: { key } });
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the passphrase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      {unlocked ? (
        <main>
          <TrackRecord />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-md px-4 py-20">
          <h1 className="text-2xl font-semibold tracking-tight">Admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The track record archive is private. Enter the admin passphrase to continue.
          </p>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
            <label htmlFor="admin-key" className="text-sm text-muted-foreground">
              Admin passphrase
            </label>
            <input
              id="admin-key"
              type="password"
              autoComplete="current-password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter passphrase"
            />
            <button
              type="submit"
              disabled={busy || key.length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Checking…" : "Unlock"}
            </button>
            {error && <p className="text-sm text-[#d9534f]">{error}</p>}
          </form>
        </main>
      )}
      <Footer />
    </div>
  );
}
