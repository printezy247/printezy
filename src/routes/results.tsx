import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ResultsGallery, WorkflowDemo, Nav, Footer } from "@/components/landing/Landing";
import { trackPageLoad, trackEngagement } from "@/lib/analytics";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Live Trading Results — PrintEzy EzyMap" },
      {
        name: "description",
        content:
          "Real, dated Gold and BTC setups mapped with EzyMap. See READY vs LIVE zones, wins, losses, and invalidations — full transparency.",
      },
      { property: "og:title", content: "Live Trading Results — PrintEzy" },
      {
        property: "og:description",
        content: "Transparent Gold and BTC results from the EzyMap workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  useEffect(() => {
    trackPageLoad("results");
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
        <WorkflowDemo />
        <ResultsGallery />
      </main>
      <Footer />
    </div>
  );
}
