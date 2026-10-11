import { Card, CardLevel } from '../types/card';
import { originalCards, icebreakerCards, oneStarCards, twoStarCards, threeStarCards } from './cards/original';
import { getCardById as getCardByIdFromRegistry, getAllCards } from './cards/registry';

export const deckCards: Record<CardLevel, Card[]> = {
  icebreaker: icebreakerCards,
  'one-star': oneStarCards,
  'two-star': twoStarCards,
  'three-star': threeStarCards,
};

export const totalDeckCounts: Record<CardLevel, number> = {
  icebreaker: 10,
  'one-star': 20,
  'two-star': 20,
  'three-star': 20,
};

export const allCards: Card[] = originalCards;

export function getCardById(id: string): Card | undefined {
  return getCardByIdFromRegistry(id);
}

/**
 * Development and test-time assertion verifying original data integrity:
 * - Exactly 10 icebreaker cards
 * - Exactly 20 one-star cards
 * - Exactly 20 two-star cards
 * - Exactly 20 three-star cards
 * - Total 70 cards
 * - All IDs unique
 * - All Chinese questions non-empty
 * - No needsReview cards in production
 */
export function assertCardDatabase(): void {
  if (icebreakerCards.length !== 10) {
    throw new Error(`Invalid icebreaker cards count: expected 10, got ${icebreakerCards.length}`);
  }
  if (oneStarCards.length !== 20) {
    throw new Error(`Invalid one-star cards count: expected 20, got ${oneStarCards.length}`);
  }
  if (twoStarCards.length !== 20) {
    throw new Error(`Invalid two-star cards count: expected 20, got ${twoStarCards.length}`);
  }
  if (threeStarCards.length !== 20) {
    throw new Error(`Invalid three-star cards count: expected 20, got ${threeStarCards.length}`);
  }
  if (originalCards.length !== 70) {
    throw new Error(`Invalid total cards count: expected 70, got ${originalCards.length}`);
  }

  const ids = new Set<string>();
  for (const card of getAllCards()) {
    if (ids.has(card.id)) {
      throw new Error(`Duplicate card ID detected: ${card.id}`);
    }
    ids.add(card.id);

    if (!card.zh || card.zh.trim() === '') {
      throw new Error(`Card ${card.id} has empty Chinese question`);
    }

    if (card.needsReview || card.reviewStatus !== 'approved') {
      throw new Error(
        `Card ${card.id} is not approved for production release (status: ${card.reviewStatus}, needsReview: ${card.needsReview})`
      );
    }
  }
}
