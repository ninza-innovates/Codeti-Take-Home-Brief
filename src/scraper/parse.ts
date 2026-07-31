import * as cheerio from "cheerio";
import type { PlayerRef } from "../shared/types.js";

/**
 * Parse a letter directory page (e.g. /players/a/) into player refs.
 * Links live under #div_players_ as <p><a href="/players/...">Name</a>...</p>
 */
export function parseDirectoryPlayers(
  html: string,
  letter: string,
): PlayerRef[] {
  const $ = cheerio.load(html);
  const players: PlayerRef[] = [];
  const seen = new Set<string>();

  $("#div_players_ a[href*='/players/']").each((_, el) => {
    const href = $(el).attr("href");
    const name = $(el).text().trim();
    if (!href || !name) return;
    if (!/\/players\/[a-z]\/.+\.shtml$/i.test(href)) return;

    const url = href.startsWith("http")
      ? href
      : `https://www.baseball-reference.com${href}`;

    if (seen.has(url)) return;
    seen.add(url);

    players.push({ name, url, letter });
  });

  return players;
}

/**
 * Extract FAQ questions from a player page.
 * Prefer #div_faq h3; fall back to FAQPage JSON-LD.
 */
export function parseFaqQuestions(html: string): string[] {
  const $ = cheerio.load(html);
  const fromHeading = $("#div_faq h3")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  if (fromHeading.length > 0) {
    return uniquePreserveOrder(fromHeading);
  }

  const fromJsonLd: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        "@type"?: string;
        mainEntity?: Array<{ "@type"?: string; name?: string }>;
      };
      if (data["@type"] !== "FAQPage" || !Array.isArray(data.mainEntity)) {
        return;
      }
      for (const entity of data.mainEntity) {
        if (entity?.name) fromJsonLd.push(entity.name.trim());
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  });

  return uniquePreserveOrder(fromJsonLd);
}

function uniquePreserveOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
