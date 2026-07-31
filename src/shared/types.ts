export interface PlayerRef {
  name: string;
  url: string;
  letter: string;
}

export interface PlayerFaq {
  name: string;
  url: string;
  questions: string[];
}

export interface UniqueQuestion {
  /** Canonical display form (name replaced with {player}) */
  question: string;
  /** Case-insensitive key used for uniqueness */
  key: string;
  playerCount: number;
  /** Optional debug: which players had this question */
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
