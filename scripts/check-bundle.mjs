// Fails the build when the browser entry chunk grows past its budget.
// Run after `vite build`. Raise LIMIT_KB on purpose, never by accident.
import { readdirSync, statSync } from "node:fs";

const LIMIT_KB = 1100;
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
