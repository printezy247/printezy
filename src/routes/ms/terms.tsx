import { createFileRoute } from "@tanstack/react-router";
import { termsHead, TermsPage } from "../terms";

export const Route = createFileRoute("/ms/terms")({
  head: () => termsHead("ms"),
  component: TermsPage,
});
