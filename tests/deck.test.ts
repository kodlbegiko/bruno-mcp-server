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

  it('rejects cards with unapproved reviewStatus or needsReview flag in assertCardDatabase logic', async () => {
    const { validateCard, assertCardDatabase: assertFullDatabase } = await import(
      '../src/data/cards/validation'
    );

    const draftCard = {
      id: 'test-draft',
      level: 'one-star' as const,
      zh: '測試草稿題目',
      en: 'Test draft question',
      interaction: 'single' as const,
      topic: 'values' as const,
      emotionalTone: 'reflective' as const,
      intensity: 2 as const,
      relationshipTags: ['friends' as const],
      packId: 'original' as const,
      reviewStatus: 'draft' as const,
      needsReview: false,
    };

    const draftErrors = validateCard(draftCard, { production: true });
    expect(draftErrors.some((e) => e.includes('not approved for production release'))).toBe(true);

    const needsReviewCard = {
      ...draftCard,
      id: 'test-needs-review',
      reviewStatus: 'approved' as const,
      needsReview: true,
    };

    const reviewErrors = validateCard(needsReviewCard, { production: true });
    expect(reviewErrors.some((e) => e.includes('still marked needsReview'))).toBe(true);

    const report = assertFullDatabase([draftCard], 1, { production: true });
    expect(report.valid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
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
