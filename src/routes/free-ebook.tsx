import { createFileRoute, redirect } from "@tanstack/react-router";

// Old ad links carry their own query string (?src=…, ?ref=…); `search: true`
// carries it through the redirect instead of dropping it on the floor.
export const Route = createFileRoute("/free-ebook")({
  beforeLoad: () => {
    throw redirect({
      to: "/ebooks/$slug",
      params: { slug: "technical-analysis" },
      search: true,
    });
  },
});
