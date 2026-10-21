import { describe, it, expect } from "vitest";
import { Route as LlmsRoute } from "@/routes/llms[.]txt";
import { Route as SecurityRoute } from "@/routes/[.]well-known/security[.]txt";

type Handler = () => Promise<Response>;
const getHandler = (route: unknown): Handler =>
  (route as { options: { server: { handlers: { GET: Handler } } } }).options.server.handlers.GET;

describe("GEO routes", () => {
  it("/llms.txt serves plain text with the site summary", async () => {
    const res = await getHandler(LlmsRoute)();
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(await res.text()).toContain("EzyMap ALGO");
  });

  it("/.well-known/security.txt serves plain text with a Contact line", async () => {
    const res = await getHandler(SecurityRoute)();
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(await res.text()).toMatch(/^Contact: /m);
  });
});
