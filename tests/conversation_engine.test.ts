import { describe, it, expect } from 'vitest';
import { scoreCandidate, paceDeckCards, createPacedDeck } from '../src/domain/conversation/conversationEngine';
import { ConversationCard } from '../src/data/cards/types';

describe('Conversation Engine V1 Pacing Suite', () => {
  const mockCards: ConversationCard[] = [
    {
      id: 'c1',
      level: 'two-star',
      zh: '題目 1',
      interaction: 'single',
      topic: 'identity',
      intensity: 2,
      emotionalTone: 'reflective',
    },
    {
      id: 'c2',
      level: 'two-star',
      zh: '題目 2',
      interaction: 'single',
      topic: 'identity',
      intensity: 4,
      emotionalTone: 'vulnerable',
    },
    {
      id: 'c3',
      level: 'two-star',
      zh: '題目 3',
      interaction: 'pair',
      topic: 'growth',
      intensity: 2,
      emotionalTone: 'warm',
    },
    {
      id: 'c4',
      level: 'two-star',
      zh: '題目 4',
      interaction: 'single',
      topic: 'memories',
      intensity: 5,
      emotionalTone: 'vulnerable',
      sensitivity: ['grief'],
    },
    {
      id: 'c5',
      level: 'two-star',
      zh: '題目 5',
      interaction: 'chooseOne',
      topic: 'support',
      intensity: 2,
      emotionalTone: 'warm',
    },
  ];

  it('preserves all cards without loss or duplication', () => {
    const paced = paceDeckCards(mockCards, { randomJitter: 0 });
    expect(paced.length).toBe(mockCards.length);
    expect(new Set(paced.map((c) => c.id)).size).toBe(mockCards.length);
    expect(mockCards.map((c) => c.id).sort()).toEqual(paced.map((c) => c.id).sort());
  });

  it('handles empty and single-card pools gracefully', () => {
    expect(paceDeckCards([])).toEqual([]);
    expect(paceDeckCards([mockCards[0]])).toEqual([mockCards[0]]);
  });

  it('penalizes topic repetition and consecutive heavy cards', () => {
    const lastCard = mockCards[1]; // topic: 'identity', intensity: 4
    const sameTopicCandidate = mockCards[0]; // topic: 'identity', intensity: 2
    const differentTopicCandidate = mockCards[2]; // topic: 'growth', intensity: 2

    const scoreSame = scoreCandidate(sameTopicCandidate, [lastCard], { randomJitter: 0 });
    const scoreDiff = scoreCandidate(differentTopicCandidate, [lastCard], { randomJitter: 0 });

    // Different topic should score significantly higher than repeated topic
    expect(scoreDiff).toBeGreaterThan(scoreSame);
  });

  it('penalizes heavy-after-heavy questions to give breathing room', () => {
    const heavyLastCard = mockCards[3]; // intensity: 5
    const heavyCandidate = mockCards[1]; // intensity: 4
    const lightCandidate = mockCards[4]; // intensity: 2

    const scoreHeavy = scoreCandidate(heavyCandidate, [heavyLastCard], { randomJitter: 0 });
    const scoreLight = scoreCandidate(lightCandidate, [heavyLastCard], { randomJitter: 0 });

    expect(scoreLight).toBeGreaterThan(scoreHeavy);
  });

  it('creates deck state with cursor 0 and correct shuffled IDs', () => {
    const deck = createPacedDeck(mockCards);
    expect(deck.cursor).toBe(0);
    expect(deck.usedIds).toEqual([]);
    expect(deck.shuffledIds.length).toBe(mockCards.length);
    expect(new Set(deck.shuffledIds).size).toBe(mockCards.length);
  });
});
