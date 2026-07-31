import assert from "node:assert/strict";
import {
  countLetterA,
  hasExactlyThreeAs,
  normalizeQuestion,
} from "./normalize.js";

assert.equal(countLetterA("David Aardsma"), 4);
assert.equal(hasExactlyThreeAs("David Aardsma"), false);
assert.equal(countLetterA("Tal Abernathy"), 3);
assert.equal(hasExactlyThreeAs("Tal Abernathy"), true);
assert.equal(countLetterA("Andy Abad"), 3);
assert.equal(hasExactlyThreeAs("Henry Aaron"), false);

const a = normalizeQuestion("When was David Aardsma born?", "David Aardsma");
const b = normalizeQuestion("When was Henry Aaron born?", "Henry Aaron");
assert.equal(a.key, b.key);
assert.equal(a.key, "when was {player} born?");

const possessive = normalizeQuestion(
  "What are David Aardsma's nicknames?",
  "David Aardsma",
);
assert.equal(possessive.key, "what are {player} nicknames?");

console.log("normalize.test.ts: all assertions passed");
