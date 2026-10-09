/**
 * Fisher-Yates (Knuth) Shuffle algorithm.
 * Guarantees unbiased uniform random permutation of array elements.
 */
export function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Creates an initial DeckState for a given list of card IDs using Fisher-Yates shuffle.
 */
export function createShuffledDeck(cardIds: string[]): {
  shuffledIds: string[];
  cursor: number;
  usedIds: string[];
} {
  return {
    shuffledIds: fisherYatesShuffle(cardIds),
    cursor: 0,
    usedIds: [],
  };
}
