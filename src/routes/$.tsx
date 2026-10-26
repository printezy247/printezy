import { createFileRoute, notFound } from "@tanstack/react-router";

/**
 * Every URL the site does not have, at any depth. Without this a deep path
 * matched no route at all and was answered with a 200 and the marketing title —
 * a soft 404 as far as a crawler could tell.
 *
 * Throwing `notFound()` is what makes the reply a real 404. Note that a route
 * whose `beforeLoad` throws never runs `head`, so the document title in the raw
 * HTML is the site's; `NotFoundComponent` sets the 404 title on mount. The
 * status code, not the title, is what search engines act on here.
 */
export const Route = createFileRoute("/$")({
  beforeLoad: () => {
    throw notFound();
  },
});
