import { createFileRoute } from "@tanstack/react-router";
import { freeChannelHead, FreeChannelPage } from "../free-channel";

export const Route = createFileRoute("/ms/free-channel")({
  head: () => freeChannelHead("ms"),
  component: FreeChannelPage,
});
