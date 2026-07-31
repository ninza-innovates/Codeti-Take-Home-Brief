export interface UniqueQuestion {
  question: string;
  key: string;
  playerCount: number;
  players?: string[];
}

export interface AggregationResult {
  generatedAt: string;
  lettersScraped: string[];
  totalPlayersMatched: number;
  playersWithFaqs: number;
  playersMissingFaqs: number;
  uniqueQuestionCount: number;
  questions: UniqueQuestion[];
  matchedPlayers: Array<{
    name: string;
    url: string;
    aCount: number;
    questionCount: number;
  }>;
}
