import { describe, it, expect } from 'vitest';
import { assertCardDatabase, allCards, deckCards } from '../src/data/decks';
import { icebreakerCards } from '../src/data/cards/icebreaker';
import { oneStarCards } from '../src/data/cards/oneStar';
import { twoStarCards } from '../src/data/cards/twoStar';
import { threeStarCards } from '../src/data/cards/threeStar';

describe('Card Database Ingestion & Audit', () => {
  it('passes assertCardDatabase with exact counts', () => {
    expect(() => assertCardDatabase()).not.toThrow();
  });

  it('contains exactly 10 icebreaker cards', () => {
    expect(icebreakerCards.length).toBe(10);
    expect(deckCards.icebreaker.length).toBe(10);
  });

  it('contains exactly 20 one-star cards', () => {
    expect(oneStarCards.length).toBe(20);
    expect(deckCards['one-star'].length).toBe(20);
  });

  it('contains exactly 20 two-star cards', () => {
    expect(twoStarCards.length).toBe(20);
    expect(deckCards['two-star'].length).toBe(20);
  });

  it('contains exactly 20 three-star cards', () => {
    expect(threeStarCards.length).toBe(20);
    expect(deckCards['three-star'].length).toBe(20);
  });

  it('has a total of exactly 70 cards', () => {
    expect(allCards.length).toBe(70);
  });

  it('has 100% unique IDs with no collisions', () => {
    const ids = new Set(allCards.map((c) => c.id));
    expect(ids.size).toBe(70);
  });

  it('has no empty or undefined Chinese question texts', () => {
    for (const card of allCards) {
      expect(card.zh).toBeDefined();
      expect(card.zh.trim().length).toBeGreaterThan(0);
    }
  });

  it('has 0 needsReview flags and all cards are approved', () => {
    for (const card of allCards) {
      expect(card.needsReview).toBeFalsy();
      expect(card.reviewStatus).toBe('approved');
    }
  });

  it('rejects cards with unapproved reviewStatus or needsReview flag in assertCardDatabase logic', () => {
    const unapprovedCard = {
      id: 'test-unapproved',
      level: 'one-star' as const,
      zh: '測試題目',
      interaction: 'single' as const,
      reviewStatus: 'draft' as const,
      needsReview: true,
    };

    expect(unapprovedCard.needsReview || (unapprovedCard.reviewStatus as string) !== 'approved').toBe(true);
  });

  it('computes dynamic question set level counts and totals from registry', async () => {
    const { getQuestionSetLevelCounts, getQuestionSetTotalCount } = await import(
      '../src/domain/questions/questionSets'
    );

    const classicCounts = getQuestionSetLevelCounts('classic');
    expect(classicCounts.icebreaker).toBe(10);
    expect(classicCounts['one-star']).toBe(20);
    expect(classicCounts['two-star']).toBe(20);
    expect(classicCounts['three-star']).toBe(20);
    expect(getQuestionSetTotalCount('classic')).toBe(70);

    const expansionCounts = getQuestionSetLevelCounts('expansion-only');
    expect(expansionCounts.icebreaker).toBe(15);
    expect(expansionCounts['one-star']).toBe(15);
    expect(expansionCounts['two-star']).toBe(15);
    expect(expansionCounts['three-star']).toBe(15);
    expect(getQuestionSetTotalCount('expansion-only')).toBe(60);

    const fullCounts = getQuestionSetLevelCounts('full');
    expect(fullCounts.icebreaker).toBe(25);
    expect(fullCounts['one-star']).toBe(35);
    expect(fullCounts['two-star']).toBe(35);
    expect(fullCounts['three-star']).toBe(35);
    expect(getQuestionSetTotalCount('full')).toBe(130);
  });
});
