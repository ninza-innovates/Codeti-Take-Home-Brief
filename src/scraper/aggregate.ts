import {
  countLetterA,
  normalizeQuestion,
} from "../shared/normalize.js";
import type {
  AggregationResult,
  PlayerFaq,
  UniqueQuestion,
} from "../shared/types.js";

export function aggregateFaqs(
  playerFaqs: PlayerFaq[],
  lettersScraped: string[],
): AggregationResult {
  const buckets = new Map<
    string,
    { display: string; players: Set<string> }
  >();

  for (const player of playerFaqs) {
    const seenKeysForPlayer = new Set<string>();

    for (const raw of player.questions) {
      const { key, display } = normalizeQuestion(raw, player.name);
      if (!key || seenKeysForPlayer.has(key)) continue;
      seenKeysForPlayer.add(key);

      const existing = buckets.get(key);
      if (existing) {
        existing.players.add(player.name);
      } else {
        buckets.set(key, {
          display,
          players: new Set([player.name]),
        });
      }
    }
  }

  const questions: UniqueQuestion[] = [...buckets.entries()]
    .map(([key, value]) => ({
      question: value.display,
      key,
      playerCount: value.players.size,
      players: [...value.players].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => {
      if (b.playerCount !== a.playerCount) {
        return b.playerCount - a.playerCount;
      }
      return a.question.localeCompare(b.question);
    });

  const matchedPlayers = playerFaqs
    .map((p) => ({
      name: p.name,
      url: p.url,
      aCount: countLetterA(p.name),
      questionCount: p.questions.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    lettersScraped,
    totalPlayersMatched: playerFaqs.length,
    playersWithFaqs: playerFaqs.filter((p) => p.questions.length > 0).length,
    playersMissingFaqs: playerFaqs.filter((p) => p.questions.length === 0)
      .length,
    uniqueQuestionCount: questions.length,
    questions,
    matchedPlayers,
  };
}
