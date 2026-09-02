import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer, TrackRecord } from "@/components/landing/Landing";
import { AdminGate } from "@/components/AdminGate";

export const Route = createFileRoute("/_authenticated/track-record")({
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <AdminGate>
          <TrackRecord />
        </AdminGate>
      </main>
      <Footer />
    </div>
  );
}
