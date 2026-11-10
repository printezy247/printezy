// Fails the build when the browser entry chunk grows past its budget.
// Run after `vite build`. Raise LIMIT_KB on purpose, never by accident.
import { readdirSync, statSync } from "node:fs";

// The entry is what every first visit downloads before any route renders:
// React DOM, the TanStack router and hydration runtime, the header chrome and
// the eagerly-imported route modules. It measured 987 KB while Supabase and
// framer-motion were still pulled in by the header and a few route files;
// deferring those (they are now their own 209 KB and 119 KB chunks, loaded on
// demand) brought it to 597 KB. 620 KB leaves a little headroom without
// admitting another library: anything new must be lazy-loaded, not imported
// into the entry.
const LIMIT_KB = 620;
const dir = ".output/public/assets";
const entry = readdirSync(dir)
  .filter((f) => /^index-.*\.js$/.test(f))
  .map((f) => ({ f, kb: statSync(`${dir}/${f}`).size / 1024 }))
  .sort((a, b) => b.kb - a.kb)[0];

if (!entry) throw new Error(`No entry chunk found in ${dir}. Did the build run?`);
console.log(`entry chunk ${entry.f}: ${entry.kb.toFixed(0)} KB (limit ${LIMIT_KB} KB)`);
if (entry.kb > LIMIT_KB) {
  console.error("Entry chunk is over budget.");
  process.exit(1);
}
