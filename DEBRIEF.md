# Debrief

Quick Wrap-up.

## Critical assumptions / microdecisions

- Treated the directory page link text as the canonical player name (including Jr. / accents as shown on BR).
- Counted letter "a" case-insensitively on the full visible name string; example checks: David Aardsma = 4 (exclude), Tal Abernathy = 3 (include).
- FAQ questions taken from `#div_faq h3`, with FAQPage JSON-LD as fallback.
- Uniqueness = lowercase + replace full player name (and possessive forms) with `{player}`; we don't care which player had which question in the final rollup, but I kept a debug player list anyway.
- Cached HTML to disk first so parsing/aggregation could be iterated without re-scraping every run.
- Shipped a thin React viewer + Express API on top of the JSON; core deliverable is still the aggregator output.
- Used Node + TypeScript per the brief; React was an extra for inspecting results.

## Setbacks / limitations

- Baseball-Reference rate limits (~20 req/min) and can jail the IP ~1 hour. First letter-A pass got 115 name matches but only ~40 player pages before 429s.
- Added disk cache, retries/backoff, and a slower default delay (~4s). Re-running resumes from cache instead of starting over.
- Checked-in `data/output/results.json` is a partial letter-A sample (115 matched / 40 with FAQs / 30 unique questions), not a completed A–Z run. Full scrape is mainly waiting on polite rate limits, not missing logic.
- Didn't have time in the half-day window to finish a clean full-alphabet pass end-to-end.

## Things that weren’t obvious from the brief

- BR is statically scrapeable HTML (no private API needed), but their bot policy is the real constraint.
- FAQ markup is consistent (`#div_faq` / `#all_faq`), which made parsing straightforward once found.
- Some names include accents/suffixes; as long as FAQ text uses the same spelling as the directory link, name stripping works. Worth watching if those ever diverge.