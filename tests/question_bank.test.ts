import { describe, expect, it, beforeEach } from 'vitest';
import { originalCards } from '../src/data/cards/original';
import { expansionV1Cards } from '../src/data/cards/expansion-v1';
import { getAllCards, getCardById } from '../src/data/cards/registry';
import { buildQuestionPool } from '../src/domain/questions/buildQuestionPool';
import { useGameStore } from '../src/store/gameStore';
import { migrateGameState, clearGameState } from '../src/game/persistence';
import { Player } from '../src/types/player';

describe('Question Bank & Platform Expansion Suite', () => {
  const twoPlayers: Player[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ];

  beforeEach(() => {
    clearGameState();
    useGameStore.getState().resetGame();
  });

  describe('Deck Inventory & Card Pack Registry', () => {
    it('keeps original deck at 70 cards', () => {
      expect(originalCards).toHaveLength(70);
    });

    it('expansion v1 contains 60 cards (15 per level)', () => {
      expect(expansionV1Cards).toHaveLength(60);

      const icebreaker = expansionV1Cards.filter((c) => c.level === 'icebreaker');
      const oneStar = expansionV1Cards.filter((c) => c.level === 'one-star');
      const twoStar = expansionV1Cards.filter((c) => c.level === 'two-star');
      const threeStar = expansionV1Cards.filter((c) => c.level === 'three-star');

      expect(icebreaker).toHaveLength(15);
      expect(oneStar).toHaveLength(15);
      expect(twoStar).toHaveLength(15);
      expect(threeStar).toHaveLength(15);
    });

    it('full library contains exactly 130 cards', () => {
      expect(getAllCards()).toHaveLength(130);
    });

    it('has 100% unique IDs across all 130 cards', () => {
      const ids = getAllCards().map((card) => card.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBe(130);
    });

    it('card registry lookup finds cards from both original and expansion', () => {
      expect(getCardById('ice-01')).toBeDefined();
      expect(getCardById('ice-01')?.packId).toBe('original');

      expect(getCardById('exp1-ice-01')).toBeDefined();
      expect(getCardById('exp1-ice-01')?.packId).toBe('expansion-v1');
      expect(getCardById('exp1-three-15')).toBeDefined();
    });

    it('all expansion questions have valid Chinese and English text', () => {
      for (const card of expansionV1Cards) {
        expect(card.zh.trim()).not.toBe('');
        expect(card.en).toBeDefined();
        expect(card.en?.trim()).not.toBe('');
      }
    });

    it('all expansion cards have topic metadata and valid intensity (1 to 5)', () => {
      for (const card of expansionV1Cards) {
        expect(card.topic).toBeTruthy();
        expect(card.intensity).toBeGreaterThanOrEqual(1);
        expect(card.intensity).toBeLessThanOrEqual(5);
        expect(card.emotionalTone).toBeTruthy();
        expect(Array.isArray(card.relationshipTags)).toBe(true);
        expect(card.relationshipTags!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Question Pool Builder & Player Count Adaptation', () => {
    it('builds full 130 pool with correct level distribution for multi-player games', () => {
      const pool = buildQuestionPool({ questionSetId: 'full', playerCount: 4 });
      expect(pool['icebreaker']).toHaveLength(25); // 10 + 15
      expect(pool['one-star']).toHaveLength(35);   // 20 + 15
      expect(pool['two-star']).toHaveLength(35);   // 20 + 15
      expect(pool['three-star']).toHaveLength(35); // 20 + 15
    });

    it('filters cards by player count (excludes minPlayers > playerCount)', () => {
      const pool2P = buildQuestionPool({ questionSetId: 'full', playerCount: 2 });
      const allCards2P = [
        ...pool2P['icebreaker'],
        ...pool2P['one-star'],
        ...pool2P['two-star'],
        ...pool2P['three-star'],
      ];

      expect(
        allCards2P.every((card) => !card.minPlayers || card.minPlayers <= 2)
      ).toBe(true);

      // ice-06 has minPlayers: 3, so it must not be in 2-player pool
      expect(allCards2P.some((c) => c.id === 'ice-06')).toBe(false);
    });

    it('builds classic question pool with only 70 original cards', () => {
      const pool = buildQuestionPool({ questionSetId: 'classic', playerCount: 4 });
      const total =
        pool['icebreaker'].length +
        pool['one-star'].length +
        pool['two-star'].length +
        pool['three-star'].length;
      expect(total).toBe(70);
      expect(pool['icebreaker'].every((c) => c.packId === 'original')).toBe(true);
    });

    it('builds expansion-only question pool with 60 expansion cards', () => {
      const pool = buildQuestionPool({ questionSetId: 'expansion-only', playerCount: 4 });
      const total =
        pool['icebreaker'].length +
        pool['one-star'].length +
        pool['two-star'].length +
        pool['three-star'].length;
      expect(total).toBe(60);
      expect(pool['icebreaker'].every((c) => c.packId === 'expansion-v1')).toBe(true);
    });
  });

  describe('Game Engine & Storage Migration Compatibility', () => {
    it('initializes game with full 130 deck by default', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      const state = useGameStore.getState().gameState;

      expect(state).toBeDefined();
      expect(state?.questionSetId).toBe('full');
      // Total cards in 2-player game across 4 levels
      const totalInDecks =
        state!.decks['icebreaker'].shuffledIds.length +
        state!.decks['one-star'].shuffledIds.length +
        state!.decks['two-star'].shuffledIds.length +
        state!.decks['three-star'].shuffledIds.length;

      // 130 minus any minPlayers > 2 cards
      expect(totalInDecks).toBeGreaterThanOrEqual(125);
    });

    it('initializes game with classic 70 deck when specified', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null, 'icebreaker', 'classic');
      const state = useGameStore.getState().gameState;

      expect(state?.questionSetId).toBe('classic');
      const totalInDecks =
        state!.decks['icebreaker'].shuffledIds.length +
        state!.decks['one-star'].shuffledIds.length +
        state!.decks['two-star'].shuffledIds.length +
        state!.decks['three-star'].shuffledIds.length;

      // In 2P, 70 minus ice-06 (minPlayers: 3) = 69
      expect(totalInDecks).toBe(69);
    });

    it('migrates legacy saved game state without questionSetId safely to classic', () => {
      const legacyRawState = {
        version: 1,
        gameId: 'legacy_game_123',
        players: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
        mode: 'guided',
        // questionSetId is missing!
        currentLevel: 'icebreaker',
        drawerIndex: 0,
        decks: {
          icebreaker: { shuffledIds: ['ice-01'], cursor: 1, usedIds: ['ice-01'] },
          'one-star': { shuffledIds: [], cursor: 0, usedIds: [] },
          'two-star': { shuffledIds: [], cursor: 0, usedIds: [] },
          'three-star': { shuffledIds: [], cursor: 0, usedIds: [] },
        },
        status: 'playing',
      };

      const migrated = migrateGameState(legacyRawState);
      expect(migrated).toBeDefined();
      expect(migrated?.questionSetId).toBe('classic');
      expect(migrated?.gameId).toBe('legacy_game_123');
    });
  });
});
