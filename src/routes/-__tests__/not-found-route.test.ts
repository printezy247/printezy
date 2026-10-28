import { describe, it, expect } from "vitest";
import { Route } from "../$";

/**
 * A deep URL the site does not have used to match no route at all and be
 * answered with a 200. The catch-all exists so every unknown path is a real
 * 404 instead of a soft one.
 */
describe("the catch-all route", () => {
  type RouteLike = { options: { beforeLoad?: () => unknown } };
  const route = Route as unknown as RouteLike;

  it("throws notFound for any unmatched path", () => {
    let thrown: unknown;
    try {
      route.options.beforeLoad!();
    } catch (error) {
      thrown = error;
    }
    expect((thrown as { isNotFound?: boolean } | undefined)?.isNotFound).toBe(true);
  });
});
