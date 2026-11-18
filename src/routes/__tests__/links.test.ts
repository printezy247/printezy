import { describe, expect, it } from "vitest";
import { LINKS, PROMO, SOCIALS } from "../../lib/links";
import { ACTIONS } from "../links";

describe("links bio page", () => {
  it("has the four buttons in order", () => {
    expect(ACTIONS.map((a) => a.label)).toEqual([
      "Free EzyMap channel",
      "Website",
      "Broker recommendation",
      "Current promotion",
    ]);
  });

  it("points each button at the right destination", () => {
    expect(ACTIONS[0].href).toBe(LINKS.freeChannel);
    expect(ACTIONS[1].href).toBe("/home");
    expect(ACTIONS[2].href).toBe(LINKS.broker);
    expect(ACTIONS[3].href).toBe(PROMO.href);
  });

  it("uses only https or site-relative hrefs", () => {
    for (const a of ACTIONS) expect(a.href).toMatch(/^(https:\/\/|\/)/);
  });

  it("has a TikTok, Instagram and Telegram icon link", () => {
    expect(SOCIALS.map((s) => s.label)).toEqual(["TikTok", "Instagram", "Telegram"]);
    for (const s of SOCIALS) expect(s.href).toMatch(/^https:\/\//);
  });
});
