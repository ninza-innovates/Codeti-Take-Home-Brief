import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://www.baseball-reference.com";
/** Sports Reference blocks >20 requests/minute (~3s/req). Stay under that. */
const DEFAULT_DELAY_MS = 4_000;
const USER_AGENT =
  "CodetiTakeHomeBot/1.0 (+local research; contact: take-home exercise)";

export interface FetchOptions {
  cacheDir: string;
  delayMs?: number;
  forceRefresh?: boolean;
  maxRetries?: number;
}

let lastFetchAt = 0;
/** Extra delay added after rate-limit responses (decays slowly across successes). */
let adaptivePenaltyMs = 0;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle(delayMs: number): Promise<void> {
  const effective = delayMs + adaptivePenaltyMs;
  const elapsed = Date.now() - lastFetchAt;
  if (elapsed < effective) {
    await sleep(effective - elapsed);
  }
}

/**
 * Fetch HTML with on-disk caching, polite delay, and retries on 429/5xx.
 */
export async function fetchHtml(
  relativeOrAbsoluteUrl: string,
  cacheKey: string,
  options: FetchOptions,
): Promise<string> {
  const cachePath = path.join(options.cacheDir, cacheKey);
  await mkdir(path.dirname(cachePath), { recursive: true });

  if (!options.forceRefresh) {
    try {
      return await readFile(cachePath, "utf8");
    } catch {
      // cache miss
    }
  }

  const url = relativeOrAbsoluteUrl.startsWith("http")
    ? relativeOrAbsoluteUrl
    : `${BASE_URL}${relativeOrAbsoluteUrl}`;

  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  const maxRetries = options.maxRetries ?? 6;

  let attempt = 0;
  while (true) {
    attempt += 1;
    await throttle(delayMs);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    lastFetchAt = Date.now();

    if (response.ok) {
      const html = await response.text();
      await writeFile(cachePath, html, "utf8");
      // Gradually ease back after successful fetches
      adaptivePenaltyMs = Math.max(0, adaptivePenaltyMs - 250);
      return html;
    }

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt > maxRetries) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    // Retry-After may be seconds or an HTTP-date; Sports Reference sometimes
    // returns very large values, so we cap waits to keep the job moving.
    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const fromHeaderMs = Number.isFinite(retryAfterSec)
      ? retryAfterSec * 1000
      : NaN;
    const exponentialMs = Math.min(90_000, delayMs * 2 ** attempt);
    const backoffMs = Math.min(
      120_000,
      Number.isFinite(fromHeaderMs)
        ? Math.max(Math.min(fromHeaderMs, 120_000), delayMs)
        : exponentialMs,
    );

    adaptivePenaltyMs = Math.min(15_000, adaptivePenaltyMs + 2_000);

    console.warn(
      `\n  retry ${attempt}/${maxRetries} after HTTP ${response.status} (waiting ${Math.round(backoffMs / 1000)}s; Retry-After=${retryAfterHeader ?? "n/a"}; penalty=+${adaptivePenaltyMs}ms)`,
    );
    await sleep(backoffMs);
  }
}

export { BASE_URL };
