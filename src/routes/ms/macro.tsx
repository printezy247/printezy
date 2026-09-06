import { createFileRoute } from "@tanstack/react-router";
import { macroHead, MacroPage } from "../macro";

export const Route = createFileRoute("/ms/macro")({
  head: () => macroHead("ms"),
  component: MacroPage,
});
