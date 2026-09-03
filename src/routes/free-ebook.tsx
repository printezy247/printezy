import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/free-ebook")({
  beforeLoad: () => {
    throw redirect({ to: "/ebooks/$slug", params: { slug: "technical-analysis" } });
  },
});
