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

// Accented letters are not "a". "Ronald Acuña Jr." is the letter-A sample's 3-a case.
assert.equal(countLetterA("Ronald Acuña Jr."), 3);
assert.equal(hasExactlyThreeAs("Ronald Acuña Jr."), true);

const a = normalizeQuestion("When was David Aardsma born?", "David Aardsma");
const b = normalizeQuestion("When was Henry Aaron born?", "Henry Aaron");
assert.equal(a.key, b.key);
assert.equal(a.key, "when was {player} born?");

const spaced = normalizeQuestion(
  "  When   was   Henry Aaron   born?  ",
  "Henry Aaron",
);
assert.equal(spaced.key, a.key);

const possessive = normalizeQuestion(
  "What are David Aardsma's nicknames?",
  "David Aardsma",
);
assert.equal(possessive.key, "what are {player} nicknames?");

// Jr. includes a regex metacharacter; the curly apostrophe is the other possessive form.
const curlyPossessive = normalizeQuestion(
  "What are Ronald Acuña Jr.’s nicknames?",
  "Ronald Acuña Jr.",
);
assert.equal(curlyPossessive.key, "what are {player} nicknames?");

console.log("normalize.test.ts: all assertions passed");
