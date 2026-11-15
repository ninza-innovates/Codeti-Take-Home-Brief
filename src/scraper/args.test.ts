import assert from "node:assert/strict";
import { DEFAULT_DELAY_MS, parseArgs } from "./args.js";

const defaults = parseArgs([]);
assert.equal(defaults.delayMs, 4_000);
assert.equal(defaults.delayMs, DEFAULT_DELAY_MS);
assert.equal(defaults.forceRefresh, false);
assert.equal(defaults.limit, undefined);
assert.deepEqual(defaults.letters, "abcdefghijklmnopqrstuvwxyz".split(""));

const equalsForm = parseArgs([
  "--letters=a,b",
  "--limit=10",
  "--delay=3000",
  "--force",
]);
assert.deepEqual(equalsForm.letters, ["a", "b"]);
assert.equal(equalsForm.limit, 10);
assert.equal(equalsForm.delayMs, 3000);
assert.equal(equalsForm.forceRefresh, true);

const spacedForm = parseArgs([
  "--letters",
  "a,b",
  "--limit",
  "10",
  "--delay",
  "3000",
]);
assert.deepEqual(spacedForm.letters, ["a", "b"]);
assert.equal(spacedForm.limit, 10);
assert.equal(spacedForm.delayMs, 3000);
assert.equal(spacedForm.forceRefresh, false);

const filteredLetters = parseArgs(["--letters", "a,2,bb,c"]);
assert.deepEqual(filteredLetters.letters, ["a", "c"]);

assert.equal(parseArgs(["--delay", "nope"]).delayMs, DEFAULT_DELAY_MS);
assert.equal(parseArgs(["--delay=-50"]).delayMs, DEFAULT_DELAY_MS);
assert.equal(parseArgs(["--limit", "-5"]).limit, undefined);
assert.equal(parseArgs(["--limit=later"]).limit, undefined);

const blank = parseArgs(["--delay=", "--limit=", "--letters="]);
assert.equal(blank.delayMs, DEFAULT_DELAY_MS);
assert.equal(blank.limit, undefined);
assert.equal(blank.letters.length, 26);

const zero = parseArgs(["--delay=0", "--limit=0"]);
assert.equal(zero.delayMs, 0);
assert.equal(zero.limit, 0);

console.log("args.test.ts: all assertions passed");
