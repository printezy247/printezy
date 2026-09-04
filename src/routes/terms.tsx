import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Landing";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — EzyMap ALGO" },
      {
        name: "description",
        content:
          "Terms governing the use of EzyMap ALGO trading signals, education content and package access.",
      },
      { property: "og:title", content: "Terms of Service — EzyMap ALGO" },
      { property: "og:description", content: "Terms for using EzyMap ALGO signals and subscriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg text-foreground">Educational use only</h2>
            <p className="mt-2">
              EzyMap ALGO provides trading signals and education for informational purposes. Nothing
              on this site or in our channels is financial advice. Trading carries substantial risk
              of loss and you are solely responsible for your own decisions.
            </p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">Packages</h2>
            <p className="mt-2">
              Beginner, Pro, Premium and Elite are one-time, lifetime purchases. Access does not
              expire and does not renew or re-bill.
            </p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">Broker relationship</h2>
            <p className="mt-2">
              We are an Introducing Broker affiliate of Vantage Markets and may earn a commission if
              you open an account through our link. You are free to use any broker.
            </p>
          </div>
          <div>
            <h2 className="text-lg text-foreground">Access</h2>
            <p className="mt-2">
              Sharing private channel content or credentials results in immediate removal without
              refund.
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
