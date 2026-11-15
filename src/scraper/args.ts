const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

/** Sports Reference blocks above ~20 requests/minute, so stay at 4s. */
export const DEFAULT_DELAY_MS = 4_000;

export interface ScrapeArgs {
  letters: string[];
  forceRefresh: boolean;
  delayMs: number;
  limit?: number;
}

/**
 * Read `--name value` or `--name=value`. A following flag is not a value.
 */
function readOption(argv: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const equalsForm = argv.find((arg) => arg.startsWith(prefix));
  if (equalsForm) return equalsForm.slice(prefix.length);

  const index = argv.indexOf(`--${name}`);
  const next = index >= 0 ? argv[index + 1] : undefined;
  if (next != null && !next.startsWith("--")) return next;
  return undefined;
}

function parseLetters(raw: string | undefined): string[] {
  if (raw == null || raw.trim() === "") return ALL_LETTERS;
  const letters = raw
    .split(",")
    .map((letter) => letter.trim().toLowerCase())
    .filter((letter) => /^[a-z]$/.test(letter));
  return letters.length > 0 ? letters : ALL_LETTERS;
}

/** Blank, non-numeric, or negative delays stay at 4s so a bad flag cannot exceed the rate limit. */
function parseDelay(raw: string | undefined): number {
  if (raw == null || raw.trim() === "") return DEFAULT_DELAY_MS;
  const delayMs = Number(raw);
  if (!Number.isFinite(delayMs) || delayMs < 0) return DEFAULT_DELAY_MS;
  return delayMs;
}

/** Zero or more. A negative value is ignored because `slice` would treat it as an end offset. */
function parseLimit(raw: string | undefined): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit < 0) return undefined;
  return limit;
}

export function parseArgs(argv: string[]): ScrapeArgs {
  return {
    letters: parseLetters(readOption(argv, "letters")),
    forceRefresh: argv.includes("--force"),
    delayMs: parseDelay(readOption(argv, "delay")),
    limit: parseLimit(readOption(argv, "limit")),
  };
}
