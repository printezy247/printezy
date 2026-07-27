import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Faq, Nav, Footer } from "@/components/landing/Landing";
import { trackPageLoad, trackEngagement } from "@/lib/analytics";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — PrintEzy EzyMap" },
      {
        name: "description",
        content:
          "Answers to the most common questions about PrintEzy, EzyMap, Vantage partner access, ebooks, and the Telegram community.",
      },
      { property: "og:title", content: "FAQ — PrintEzy EzyMap" },
      {
        property: "og:description",
        content: "Everything you need to know about PrintEzy and EzyMap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  useEffect(() => {
    trackPageLoad("faq");
    const stop = trackEngagement();
    return () => stop?.();
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
