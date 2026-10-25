import { describe, it, expect } from "vitest";
import { translations } from "../translations";

// P3.4: adding a key to `en` and forgetting the other five locales should be
// a failing test, not a English-only string shipping to ms/zh/hi/ar/sw readers.

const LOCALES = ["en", "ms", "zh", "hi", "ar", "sw"] as const;

type Locale = (typeof LOCALES)[number];
const table = translations as Record<Locale, Record<string, string>>;

describe("i18n locale completeness", () => {
  it("every locale block exists", () => {
    for (const locale of LOCALES) {
      expect(table[locale], `locale block "${locale}" missing`).toBeTruthy();
    }
  });

  it("every English key exists in all six locales", () => {
    const enKeys = Object.keys(table.en);
    expect(enKeys.length).toBeGreaterThan(0);
    for (const locale of LOCALES) {
      const missing = enKeys.filter((key) => !(key in table[locale]));
      expect(missing, `locale "${locale}" is missing ${missing.length} keys`).toEqual([]);
    }
  });

  it("no locale has extra keys English lacks (no orphaned translations)", () => {
    const enKeys = new Set(Object.keys(table.en));
    for (const locale of LOCALES) {
      const orphans = Object.keys(table[locale]).filter((key) => !enKeys.has(key));
      expect(orphans, `locale "${locale}" has orphaned keys`).toEqual([]);
    }
  });

  it("every translated value is a non-empty string", () => {
    for (const locale of LOCALES) {
      const empty = Object.entries(table[locale])
        .filter(([, value]) => typeof value !== "string" || value.trim() === "")
        .map(([key]) => key);
      expect(empty, `locale "${locale}" has empty values`).toEqual([]);
    }
  });

  it("placeholders that appear in English appear in every translation of that key", () => {
    const placeholder = /\{(\w+)\}/g;
    const problems: string[] = [];
    for (const [key, enValue] of Object.entries(table.en)) {
      const names = [...enValue.matchAll(placeholder)].map((m) => m[1]);
      if (names.length === 0) continue;
      for (const locale of LOCALES) {
        const value = table[locale][key];
        for (const name of names) {
          if (!value.includes(`{${name}}`)) {
            problems.push(`${locale}:${key} is missing {${name}}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
