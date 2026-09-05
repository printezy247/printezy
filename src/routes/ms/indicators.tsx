import { createFileRoute } from "@tanstack/react-router";
import { indicatorsHead, IndicatorsPage } from "../indicators";

export const Route = createFileRoute("/ms/indicators")({
  head: () => indicatorsHead("ms"),
  component: IndicatorsPage,
});
