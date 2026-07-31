# Baseball FAQ Aggregator (Codeti Take-Home)

Node + TypeScript scraper that finds Baseball-Reference players whose **first + last name** contain **exactly three** letter `a`/`A`s, then aggregates their unique FAQ questions. A small React UI + Express API render the JSON output.

Source data: [Baseball-Reference player index](https://www.baseball-reference.com/players/a/)

## What it produces

`data/output/results.json` with:

- `totalPlayersMatched` — players whose names have exactly 3 `a`s
- `questions[]` — unique FAQ questions after name/casing normalization
- `questions[].playerCount` — how many matched players had that question
- `matchedPlayers[]` — debug/posterity list of who was included

Also writes `data/output/players-debug.json` (per-player raw questions).

## Question uniqueness rules

Two questions are the same if, after lowercasing and replacing the player's full name (including possessive `Name's` / `Name’s`) with `{player}`, they match.

Examples treated as the same:

- `When was David Aardsma born?`
- `When was Henry Aaron born?`

→ `when was {player} born?`

## Setup

```bash
npm install
```

## Scrape

Recommended workflow (cache HTML to disk, then iterate on parsing locally):

```bash
# Smoke test: letter A only
npm run scrape:a

# Full A–Z run (slow; polite delay + retries on HTTP 429)
npm run scrape

# Useful flags
npx tsx src/scraper/index.ts --letters a,b --limit 10
npx tsx src/scraper/index.ts --force --delay=3000
```

Cached HTML lives in `data/cache/`. Re-runs reuse cache unless `--force` is passed. If you hit rate limits mid-run, just re-run the same command — cached pages are skipped and failed pages are retried.

## View results (React + API)

```bash
# Terminal 1
npm run server

# Terminal 2
npm run client
```

Or both: `npm run dev`

- API: `http://localhost:8787/api/results`
- UI: `http://localhost:5173`

## Project layout

```
src/scraper/     fetch + parse + aggregate CLI
src/server/      Express API serving results.json
src/shared/      name/question normalization + types
client/          Vite + React results viewer
data/cache/      saved HTML (gitignored)
data/output/     results JSON
```

## Rate limiting (important)

Sports Reference’s published bot policy: **no more than ~20 requests per minute**, or the IP can be blocked for about an hour ([their bot traffic page](https://www.sports-reference.com/bot-traffic.html)).

This project defaults to **4s between network fetches** (~15/min), retries on HTTP 429 with capped backoff, and **resumes from `data/cache/`** so a blocked run can simply be restarted later.

Approximate full-run network time (cold cache): dozens of directory pages + every matched player page × ~4s. Cached re-parses are fast.

## Notes / assumptions

- Player names are taken from directory-page link text (not years / HOF `+` markers).
- FAQ questions are parsed from `#div_faq h3`, with FAQPage JSON-LD as fallback.
- Letter-`a` counting is case-insensitive over the visible name string (including suffixes like `Jr.` and accented characters as written on the site).
- The React app is a thin viewer for the aggregator output; the core deliverable is the scraper + JSON.

## Debrief

See `DEBRIEF.md` — intended to be written by the submitter (not AI), per the brief.
