import { describe, it, expect } from "vitest";
import { ENTRIES } from "../replies";
import { TRANSLATIONS, EXTRA_LANGS, NAV_LABELS, localize } from "../replies.i18n";

// Mirrors i18n-completeness.test.ts for the Telegram reply book:
// 29 entries x 6 langs must never render blank.
describe("reply-book completeness", () => {
  it("has 29 entries with unique ids", () => {
    expect(ENTRIES.length).toBe(29);
    const ids = ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has non-empty en/ms replies", () => {
    for (const entry of ENTRIES) {
      expect(entry.replies.en.length, `${entry.id} en replies`).toBeGreaterThan(0);
      expect(entry.replies.ms.length, `${entry.id} ms replies`).toBeGreaterThan(0);
      for (const r of [...entry.replies.en, ...entry.replies.ms]) {
        expect(r.trim(), `${entry.id} blank reply`).not.toBe("");
      }
    }
  });

  it("every entry has a translation layer entry with non-empty replies (or explicit fallback)", () => {
    for (const lang of EXTRA_LANGS) {
      for (const entry of ENTRIES) {
        const tr = TRANSLATIONS[lang][entry.id];
        expect(tr, `${lang}:${entry.id} missing translation`).toBeTruthy();
        expect(tr.replies.length, `${lang}:${entry.id} empty replies`).toBeGreaterThan(0);
      }
    }
  });

  it("translated button shapes match the English button shape", () => {
    for (const lang of EXTRA_LANGS) {
      for (const entry of ENTRIES) {
        const base = entry.buttons?.en ?? [];
        const trButtons = TRANSLATIONS[lang][entry.id]?.buttons;
        if (!trButtons) continue;
        expect(trButtons.length, `${lang}:${entry.id} row count`).toBe(base.length);
        trButtons.forEach((row, r) => {
          expect(row.length, `${lang}:${entry.id} row ${r} col count`).toBe(base[r]?.length ?? 0);
        });
      }
    }
  });

  it("localize never returns empty replies for any of the six langs", () => {
    const langs = ["en", "ms", ...EXTRA_LANGS] as const;
    for (const entry of ENTRIES) {
      for (const lang of langs) {
        const { replies } = localize(entry, lang);
        expect(replies.length, `${lang}:${entry.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("nav labels exist for all six langs", () => {
    for (const lang of ["en", "ms", ...EXTRA_LANGS] as const) {
      expect(NAV_LABELS[lang].products.trim()).not.toBe("");
      expect(NAV_LABELS[lang].faq.trim()).not.toBe("");
    }
  });
});
