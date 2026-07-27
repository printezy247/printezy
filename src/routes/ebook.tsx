import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { EbookLibrary, Nav, Footer } from "@/components/landing/Landing";
import { trackPageLoad, trackEngagement } from "@/lib/analytics";

export const Route = createFileRoute("/ebook")({
  head: () => ({
    meta: [
      { title: "Free Trading Ebooks — PrintEzy" },
      {
        name: "description",
        content:
          "Download PrintEzy's free trading ebooks: Technical Analysis and Mapping Like a Pro. Learn how to structure Gold and BTC setups.",
      },
      { property: "og:title", content: "Free Trading Ebooks — PrintEzy" },
      {
        property: "og:description",
        content: "Free ebooks on technical analysis and mapping trades like a pro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EbookPage,
});

function EbookPage() {
  useEffect(() => {
    trackPageLoad("ebook");
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
        <EbookLibrary />
      </main>
      <Footer />
    </div>
  );
}
