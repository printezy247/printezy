import { describe, expect, it } from "vitest";
import { FAQ, buildWelcomeFaqJsonLd } from "@/components/landing/welcome-data";

describe("buildWelcomeFaqJsonLd()", () => {
  it("emits FAQPage questions and answers from the displayed FAQ copy", () => {
    const schema = JSON.parse(buildWelcomeFaqJsonLd());

    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(FAQ.length);
    expect(schema.mainEntity).toEqual(
      FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    );
  });
});
