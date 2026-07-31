import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregateFaqs } from "./aggregate.js";
import { fetchHtml } from "./fetchHtml.js";
import { parseDirectoryPlayers, parseFaqQuestions } from "./parse.js";
import { countLetterA, hasExactlyThreeAs } from "../shared/normalize.js";
import type { PlayerFaq, PlayerRef } from "../shared/types.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE_DIR = path.join(ROOT, "data", "cache");
const OUTPUT_DIR = path.join(ROOT, "data", "output");

const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function parseArgs(argv: string[]): {
  letters: string[];
  forceRefresh: boolean;
  delayMs: number;
  limit?: number;
} {
  const lettersFlag = argv.find((a) => a.startsWith("--letters="));
  const lettersIdx = argv.indexOf("--letters");
  const lettersRaw = lettersFlag
    ? lettersFlag.split("=")[1]
    : lettersIdx >= 0
      ? argv[lettersIdx + 1]
      : undefined;

  const letters = lettersRaw
    ? lettersRaw
        .split(",")
        .map((l) => l.trim().toLowerCase())
        .filter((l) => /^[a-z]$/.test(l))
    : ALL_LETTERS;

  const delayFlag = argv.find((a) => a.startsWith("--delay="));
  const delayMs = delayFlag ? Number(delayFlag.split("=")[1]) : 4_000;

  const limitFlag = argv.find((a) => a.startsWith("--limit="));
  const limit = limitFlag ? Number(limitFlag.split("=")[1]) : undefined;

  return {
    letters: letters.length > 0 ? letters : ALL_LETTERS,
    forceRefresh: argv.includes("--force"),
    delayMs: Number.isFinite(delayMs) ? delayMs : 1_200,
    limit: Number.isFinite(limit) ? limit : undefined,
  };
}

async function collectMatchingPlayers(
  letters: string[],
  forceRefresh: boolean,
  delayMs: number,
): Promise<PlayerRef[]> {
  const matched: PlayerRef[] = [];

  for (const letter of letters) {
    process.stdout.write(`Fetching directory /players/${letter}/ ... `);
    const html = await fetchHtml(`/players/${letter}/`, `letters/${letter}.html`, {
      cacheDir: CACHE_DIR,
      forceRefresh,
      delayMs,
    });
    const players = parseDirectoryPlayers(html, letter);
    const letterMatches = players.filter((p) => hasExactlyThreeAs(p.name));
    matched.push(...letterMatches);
    console.log(
      `${players.length} players, ${letterMatches.length} with exactly 3 a's`,
    );
  }

  return matched;
}

async function scrapePlayerFaqs(
  players: PlayerRef[],
  forceRefresh: boolean,
  delayMs: number,
): Promise<PlayerFaq[]> {
  const results: PlayerFaq[] = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const slug =
      player.url.split("/players/")[1]?.replaceAll("/", "_") ??
      `${player.letter}_${i}.shtml`;
    const cacheKey = `players/${slug.endsWith(".html") ? slug : `${slug}.html`}`;

    process.stdout.write(
      `[${i + 1}/${players.length}] ${player.name} (a's=${countLetterA(player.name)}) ... `,
    );

    try {
      const html = await fetchHtml(player.url, cacheKey, {
        cacheDir: CACHE_DIR,
        forceRefresh,
        delayMs,
      });
      const questions = parseFaqQuestions(html);
      results.push({ name: player.name, url: player.url, questions });
      console.log(`${questions.length} FAQ questions`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`ERROR: ${message}`);
      results.push({ name: player.name, url: player.url, questions: [] });
    }
  }

  return results;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("=== Baseball FAQ Aggregator ===");
  console.log(`Letters: ${args.letters.join(", ")}`);
  console.log(`Delay: ${args.delayMs}ms | Force refresh: ${args.forceRefresh}`);
  console.log("");

  let matched = await collectMatchingPlayers(
    args.letters,
    args.forceRefresh,
    args.delayMs,
  );

  if (args.limit != null) {
    matched = matched.slice(0, args.limit);
    console.log(`\nLimiting to first ${matched.length} matched players (--limit)`);
  }

  console.log(`\nTotal matched players: ${matched.length}`);
  console.log("Scraping player FAQ sections...\n");

  const playerFaqs = await scrapePlayerFaqs(
    matched,
    args.forceRefresh,
    args.delayMs,
  );

  const aggregation = aggregateFaqs(playerFaqs, args.letters);

  const outPath = path.join(OUTPUT_DIR, "results.json");
  const debugPath = path.join(OUTPUT_DIR, "players-debug.json");

  await writeFile(outPath, JSON.stringify(aggregation, null, 2), "utf8");
  await writeFile(debugPath, JSON.stringify(playerFaqs, null, 2), "utf8");

  console.log("\n=== Done ===");
  console.log(`Matched players: ${aggregation.totalPlayersMatched}`);
  console.log(`Players with FAQs: ${aggregation.playersWithFaqs}`);
  console.log(`Unique questions: ${aggregation.uniqueQuestionCount}`);
  console.log(`Wrote ${outPath}`);
  console.log(`Wrote ${debugPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
