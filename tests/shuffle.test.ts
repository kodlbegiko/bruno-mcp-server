import { describe, it, expect } from 'vitest';
import { fisherYatesShuffle, createShuffledDeck } from '../src/game/shuffle';

describe('Fisher-Yates Shuffle Engine', () => {
  it('preserves all items without loss or duplication', () => {
    const original = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const shuffled = fisherYatesShuffle(original);

    expect(shuffled.length).toBe(original.length);
    expect([...shuffled].sort()).toEqual([...original].sort());
  });

  it('initializes DeckState with cursor at 0 and empty usedIds', () => {
    const ids = ['card-1', 'card-2', 'card-3'];
    const deck = createShuffledDeck(ids);

    expect(deck.cursor).toBe(0);
    expect(deck.usedIds).toEqual([]);
    expect(deck.shuffledIds.length).toBe(3);
    expect(new Set(deck.shuffledIds).size).toBe(3);
  });

  it('produces different permutations across multiple runs', () => {
    const list = Array.from({ length: 30 }, (_, i) => `item_${i}`);
    const run1 = fisherYatesShuffle(list);
    const run2 = fisherYatesShuffle(list);

    // With 30 items, probability of identical ordering is 1 / 30! which is practically 0
    expect(run1).not.toEqual(run2);
  });
});
