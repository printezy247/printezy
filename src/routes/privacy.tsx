import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Landing";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — EzyMap ALGO" },
      {
        name: "description",
        content:
          "How EzyMap ALGO collects, uses and protects the limited information gathered from visitors and Telegram subscribers.",
      },
      { property: "og:title", content: "Privacy Policy — EzyMap ALGO" },
      { property: "og:description", content: "How EzyMap ALGO handles your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            EzyMap ALGO respects your privacy. We collect only the minimum information needed to run
            this website and deliver our Telegram signal and education services.
          </p>
          <div>
            <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
            <p className="mt-2">
              Anonymous usage analytics (pages viewed, buttons clicked, session identifier), and any
              email address you voluntarily submit to our newsletter form.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
            <p className="mt-2">
              To improve the site, understand which content is useful, and send occasional market
              notes if you subscribed. We do not sell or rent your data.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Telegram</h2>
            <p className="mt-2">
              Joining our channels is governed by Telegram's own privacy policy. We only see the
              public profile information Telegram exposes to channel admins.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-2">
              Questions? Message us on Telegram at{" "}
              <a href="https://t.me/EzySarah" className="text-primary hover:underline">
                @EzySarah
              </a>
              .
            </p>
          </div>
        </div>
        <Link to="/" className="mt-10 inline-block text-sm text-primary hover:underline">
          ← Back to home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
