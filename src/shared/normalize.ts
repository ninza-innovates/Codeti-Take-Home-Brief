/**
 * Count case-insensitive letter 'a' occurrences in a player name.
 * Example: "Tal Abernathy" => 3, "David Aardsma" => 4
 */
export function countLetterA(name: string): number {
  const matches = name.toLowerCase().match(/a/g);
  return matches ? matches.length : 0;
}

export function hasExactlyThreeAs(name: string): boolean {
  return countLetterA(name) === 3;
}

/**
 * Normalize a FAQ question for uniqueness:
 * - case-insensitive
 * - replace the player's full name (and possessive forms) with {player}
 *
 * "When was David Aardsma born?" and "When was Henry Aaron born?"
 * both become "when was {player} born?"
 */
export function normalizeQuestion(question: string, playerName: string): {
  key: string;
  display: string;
} {
  let text = question.trim().replace(/\s+/g, " ");

  const escaped = escapeRegExp(playerName.trim());
  // Possessive first: Name's / Name’
  const possessive = new RegExp(`${escaped}['’]s`, "gi");
  text = text.replace(possessive, "{player}");
  text = text.replace(new RegExp(escaped, "gi"), "{player}");

  // Collapse leftover whitespace after replacements
  text = text.replace(/\s+/g, " ").trim();

  const key = text.toLowerCase();
  // Prefer a readable display form with {player} preserved
  const display = text.replace(/\{player\}/gi, "{player}");

  return { key, display };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
