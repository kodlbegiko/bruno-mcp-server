import { describe, it, expect, beforeEach } from 'vitest';
import {
  scoreCandidate,
  paceDeckCards,
  createPacedDeck,
  scoreCandidateAdaptive,
  selectNextAdaptiveCard,
} from '../src/domain/conversation/conversationEngine';
import { ConversationCard } from '../src/data/cards/types';
import { getCardById } from '../src/data/cards/registry';
import { useGameStore } from '../src/store/gameStore';
import { clearGameState } from '../src/game/persistence';

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

  it('boosts candidate cards matching the target relationship context', () => {
    const coupleCard: ConversationCard = {
      id: 'couple-1',
      level: 'two-star',
      zh: '我們之間最舒適的默契是什麼？',
      interaction: 'single',
      topic: 'relationships',
      intensity: 2,
      relationshipTags: ['couples', 'dating'],
    };
    const genericCard: ConversationCard = {
      id: 'generic-1',
      level: 'two-star',
      zh: '你平時最喜歡去哪裡散步？',
      interaction: 'single',
      topic: 'daily-life',
      intensity: 2,
      relationshipTags: ['friends'],
    };

    const coupleScore = scoreCandidate(coupleCard, [], {
      targetRelationship: 'couples',
      randomJitter: 0,
    });
    const genericScore = scoreCandidate(genericCard, [], {
      targetRelationship: 'couples',
      randomJitter: 0,
    });

    expect(coupleScore).toBe(80); // 50 base + 30 relationship
    expect(genericScore).toBe(50); // 50 base
    expect(coupleScore).toBeGreaterThan(genericScore);
  });

  it('shapes card 1 selection according to target relationship context in paceDeckCards', () => {
    const testDeck: ConversationCard[] = [
      {
        id: 'friend-ice',
        level: 'icebreaker',
        zh: '朋友題目',
        interaction: 'single',
        intensity: 2,
        relationshipTags: ['friends'],
      },
      {
        id: 'dating-ice',
        level: 'icebreaker',
        zh: '約會題目',
        interaction: 'single',
        intensity: 2,
        relationshipTags: ['dating'],
      },
    ];

    const paced = paceDeckCards(testDeck, {
      targetRelationship: 'dating',
      randomJitter: 0,
    });

    expect(paced[0].id).toBe('dating-ice');
  });
});

describe('Adaptive Conversation Engine V2 (Real-Time Dynamic Pacing)', () => {
  beforeEach(() => {
    clearGameState();
    useGameStore.getState().resetGame();
  });

  const conflictCard = getCardById('two-17')!;
  const griefCard = getCardById('three-08')!;

  it('penalizes cards sharing the same topic or sensitivity after a skip', () => {
    expect(conflictCard).toBeDefined();

    const sameTopicCandidate: ConversationCard = {
      id: 'candidate-conflict',
      level: 'two-star',
      zh: '衝突題目',
      interaction: 'single',
      topic: conflictCard.topic, // same topic
      intensity: 3,
    };

    const differentTopicCandidate: ConversationCard = {
      id: 'candidate-warm',
      level: 'two-star',
      zh: '溫暖題目',
      interaction: 'single',
      topic: 'support',
      intensity: 2,
    };

    const scoreSame = scoreCandidateAdaptive(sameTopicCandidate, {
      justSkippedCardId: conflictCard.id,
      randomJitter: 0,
    });

    const scoreDiff = scoreCandidateAdaptive(differentTopicCandidate, {
      justSkippedCardId: conflictCard.id,
      randomJitter: 0,
    });

    // Score for different topic should be substantially higher
    expect(scoreDiff).toBeGreaterThan(scoreSame + 30);
  });

  it('penalizes cards sharing the same sensitivity tag after a skip', () => {
    expect(griefCard).toBeDefined();

    const sharedSensitivityCandidate: ConversationCard = {
      id: 'candidate-grief',
      level: 'three-star',
      zh: '告別與遺憾',
      interaction: 'single',
      topic: 'memories',
      intensity: 3,
      sensitivity: ['grief'],
    };

    const neutralCandidate: ConversationCard = {
      id: 'candidate-neutral',
      level: 'three-star',
      zh: '成長與啟發',
      interaction: 'single',
      topic: 'growth',
      intensity: 3,
    };

    const scoreShared = scoreCandidateAdaptive(sharedSensitivityCandidate, {
      justSkippedCardId: griefCard.id,
      randomJitter: 0,
    });

    const scoreNeutral = scoreCandidateAdaptive(neutralCandidate, {
      justSkippedCardId: griefCard.id,
      randomJitter: 0,
    });

    expect(scoreNeutral).toBeGreaterThan(scoreShared + 40);
  });

  it('backs off from high intensity cards immediately following a skip', () => {
    const highIntensityCandidate: ConversationCard = {
      id: 'candidate-heavy',
      level: 'two-star',
      zh: '沉重深度題',
      interaction: 'single',
      topic: 'values',
      intensity: 5,
    };

    const gentleCandidate: ConversationCard = {
      id: 'candidate-gentle',
      level: 'two-star',
      zh: '輕鬆題',
      interaction: 'single',
      topic: 'values',
      intensity: 2,
    };

    const scoreHeavy = scoreCandidateAdaptive(highIntensityCandidate, {
      justSkippedCardId: 'two-01',
      randomJitter: 0,
    });

    const scoreGentle = scoreCandidateAdaptive(gentleCandidate, {
      justSkippedCardId: 'two-01',
      randomJitter: 0,
    });

    // Gentle candidate gets relief bonus (+20), heavy candidate gets penalty (-35)
    expect(scoreGentle).toBeGreaterThan(scoreHeavy);
  });

  it('boosts deeper questions when players opened follow-up on previous card', () => {
    const deepCandidate: ConversationCard = {
      id: 'candidate-deep',
      level: 'two-star',
      zh: '深層感受',
      interaction: 'single',
      topic: 'authenticity',
      intensity: 4,
    };

    const shallowCandidate: ConversationCard = {
      id: 'candidate-shallow',
      level: 'two-star',
      zh: '淺層偏好',
      interaction: 'single',
      topic: 'preferences',
      intensity: 1,
    };

    const scoreDeep = scoreCandidateAdaptive(deepCandidate, {
      historyCardIds: ['two-01'],
      followUpOpenedCardIds: ['two-01'],
      randomJitter: 0,
    });

    const scoreShallow = scoreCandidateAdaptive(shallowCandidate, {
      historyCardIds: ['two-01'],
      followUpOpenedCardIds: ['two-01'],
      randomJitter: 0,
    });

    expect(scoreDeep).toBeGreaterThan(scoreShallow);
  });

  it('selectNextAdaptiveCard window samples and avoids just-skipped attributes', () => {
    // candidate IDs containing conflictCard and other cards
    const candidates = ['two-17', 'two-02', 'two-03', 'two-04', 'two-05'];

    const chosenId = selectNextAdaptiveCard(candidates, {
      justSkippedCardId: 'two-17',
      randomJitter: 0,
    });

    expect(chosenId).toBeDefined();
    // Should NOT pick the skipped card or cards with same conflict topic
    expect(chosenId).not.toBe('two-17');
  });

  it('records skippedCardIds and updates deck with adaptive draw on skipCard() in gameStore', () => {
    useGameStore.getState().initGame(
      [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
      'guided',
      null
    );

    const firstCardId = useGameStore.getState().gameState?.currentCardId;
    expect(firstCardId).toBeTruthy();

    useGameStore.getState().skipCard();

    const stateAfterSkip = useGameStore.getState().gameState;
    expect(stateAfterSkip?.skippedCardIds).toContain(firstCardId);
    expect(stateAfterSkip?.currentCardId).not.toBe(firstCardId);
  });

  it('records followUpOpenedCardIds when recordFollowUpOpened is called', () => {
    useGameStore.getState().initGame(
      [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
      'guided',
      null
    );

    useGameStore.getState().recordFollowUpOpened('exp1-one-01');

    const state = useGameStore.getState().gameState;
    expect(state?.followUpOpenedCardIds).toContain('exp1-one-01');
  });
});
