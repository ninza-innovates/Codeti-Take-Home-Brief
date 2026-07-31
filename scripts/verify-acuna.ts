import { readFile } from "node:fs/promises";
import { parseFaqQuestions } from "../src/scraper/parse.js";
import { normalizeQuestion } from "../src/shared/normalize.js";

const html = await readFile(
  "data/cache/players/a_acunaro01.shtml.html",
  "utf8",
);
const qs = parseFaqQuestions(html);
const name = "Ronald Acuña Jr.";
console.log(qs.slice(0, 3));
console.log(qs.slice(0, 3).map((q) => normalizeQuestion(q, name)));
