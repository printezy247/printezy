import { createFileRoute } from "@tanstack/react-router";
import { privacyHead, PrivacyPage } from "../privacy";

export const Route = createFileRoute("/ms/privacy")({
  head: () => privacyHead("ms"),
  component: PrivacyPage,
});
