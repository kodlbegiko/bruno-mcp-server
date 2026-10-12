import { describe, it, expect, beforeEach } from 'vitest';
import { countEngagedCardsInLevel } from '../src/domain/game/progress';
import { getHighestRevealedLevel } from '../src/domain/game/endingStats';
import { getNextEligibleDrawerIndex, useGameStore } from '../src/store/gameStore';
import { reconcileThreeStarConsent, getConsentEligiblePlayerIds } from '../src/store/multiplayer/consent';
import { assertCardDatabase, validateCard } from '../src/data/cards/validation';
import { getRelationshipBonus } from '../src/domain/conversation/conversationEngine';
import { getAllCards } from '../src/data/cards/registry';
import { GameState } from '../src/types/game';
import { OnlinePlayer, ThreeStarConsentState } from '../src/types/multiplayer';
import { ConversationCard } from '../src/data/cards/types';

describe('V2.2 Architectural Refinements Suite', () => {
  beforeEach(() => {
    useGameStore.setState({
      gameState: null,
      isCardFlipped: false,
      selectedPlayerIds: [],
    });
  });

  describe('1. Guided Journey Progress (countEngagedCardsInLevel)', () => {
    it('excludes skipped cards and only counts engaged cards for the target level', () => {
      const mockState: Partial<GameState> = {
        revealedCardIds: ['ice-01', 'ice-02', 'ice-03', 'one-01'],
        skippedCardIds: ['ice-02'],
      };

      const mockGetCard = (id: string) => {
        if (id.startsWith('ice-')) return { level: 'icebreaker' as const };
        if (id.startsWith('one-')) return { level: 'one-star' as const };
        return null;
      };

      const icebreakerCount = countEngagedCardsInLevel(
        mockState as GameState,
        'icebreaker',
        mockGetCard
      );
      // ice-01 (engaged), ice-02 (skipped), ice-03 (engaged) -> 2
      expect(icebreakerCount).toBe(2);

      const oneStarCount = countEngagedCardsInLevel(
        mockState as GameState,
        'one-star',
        mockGetCard
      );
      expect(oneStarCount).toBe(1);

      const twoStarCount = countEngagedCardsInLevel(
        mockState as GameState,
        'two-star',
        mockGetCard
      );
      expect(twoStarCount).toBe(0);
    });
  });

  describe('2. Ending Stats Metadata Level (getHighestRevealedLevel)', () => {
    it('computes highest level via card metadata rather than string prefix, handling exp1- ids', () => {
      const mockState: Partial<GameState> = {
        revealedCardIds: ['exp1-ice-01', 'exp1-two-08', 'ice-02'],
      };

      const mockGetCard = (id: string) => {
        if (id === 'exp1-ice-01' || id === 'ice-02') return { level: 'icebreaker' as const };
        if (id === 'exp1-two-08') return { level: 'two-star' as const };
        return null;
      };

      const highest = getHighestRevealedLevel(mockState as GameState, mockGetCard);
      expect(highest).toBe('two-star');
    });

    it('returns null when no cards were revealed', () => {
      const mockState: Partial<GameState> = {
        revealedCardIds: [],
      };
      const highest = getHighestRevealedLevel(mockState as GameState);
      expect(highest).toBeNull();
    });
  });

  describe('3. Follow-up State Decoupling & Lifecycle Reset', () => {
    it('opens and closes follow-up independently from historical record', () => {
      useGameStore.getState().initGame(
        [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
        'free',
        null
      );

      const currentCardId = useGameStore.getState().gameState?.currentCardId;
      expect(currentCardId).toBeTruthy();

      // Open follow up
      useGameStore.getState().openFollowUp();
      let state = useGameStore.getState().gameState;
      expect(state?.activeFollowUpCardId).toBe(currentCardId);
      expect(state?.followUpOpenedCardIds).toContain(currentCardId);

      // Close follow up
      useGameStore.getState().closeFollowUp();
      state = useGameStore.getState().gameState;
      expect(state?.activeFollowUpCardId).toBeNull();
      // Historical intent remains preserved for Conversation Engine
      expect(state?.followUpOpenedCardIds).toContain(currentCardId);
    });

    it('resets activeFollowUpCardId to null on drawNextCard, skipCard, and changeLevel', () => {
      useGameStore.getState().initGame(
        [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
        'free',
        null
      );

      // 1. Draw next card resets
      useGameStore.getState().openFollowUp();
      expect(useGameStore.getState().gameState?.activeFollowUpCardId).not.toBeNull();
      useGameStore.getState().drawNextCard();
      expect(useGameStore.getState().gameState?.activeFollowUpCardId).toBeNull();

      // 2. Skip card resets
      useGameStore.getState().openFollowUp();
      expect(useGameStore.getState().gameState?.activeFollowUpCardId).not.toBeNull();
      useGameStore.getState().skipCard();
      expect(useGameStore.getState().gameState?.activeFollowUpCardId).toBeNull();

      // 3. Change level resets
      useGameStore.getState().openFollowUp();
      expect(useGameStore.getState().gameState?.activeFollowUpCardId).not.toBeNull();
      useGameStore.getState().changeLevel('one-star');
      expect(useGameStore.getState().gameState?.activeFollowUpCardId).toBeNull();
    });
  });

  describe('4. Multiplayer Disconnect & Drawer Rotation', () => {
    it('getNextEligibleDrawerIndex skips players in inactivePlayerIds', () => {
      const players = [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' },
      ];

      // If currentIndex = 0 (Alice), and Bob is inactive, next is Charlie (index 2)
      const next = getNextEligibleDrawerIndex(players, 0, ['p2']);
      expect(next).toBe(2);

      // If Bob and Charlie are both inactive, wraps back to Alice (index 0)
      const nextOnlyAlice = getNextEligibleDrawerIndex(players, 0, ['p2', 'p3']);
      expect(nextOnlyAlice).toBe(0);
    });

    it('setPlayerAvailability moves drawerIndex forward if disconnected player was the active drawer', () => {
      useGameStore.getState().initGame(
        [
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
          { id: 'p3', name: 'Charlie' },
        ],
        'free',
        null
      );

      // Drawer index is initially 0 (Alice)
      expect(useGameStore.getState().gameState?.drawerIndex).toBe(0);

      // Alice disconnects
      useGameStore.getState().setPlayerAvailability('p1', false);
      const state = useGameStore.getState().gameState;

      expect(state?.inactivePlayerIds).toContain('p1');
      // Drawer automatically rotates to Bob (index 1)
      expect(state?.drawerIndex).toBe(1);

      // Alice reconnects
      useGameStore.getState().setPlayerAvailability('p1', true);
      expect(useGameStore.getState().gameState?.inactivePlayerIds).not.toContain('p1');
    });

    it('prunes disconnected player from currentSelection.selectedPlayerIds', () => {
      useGameStore.getState().initGame(
        [
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
        ],
        'free',
        null
      );

      // Select Bob as answering player
      useGameStore.getState().selectPlayer('p2');
      expect(useGameStore.getState().gameState?.currentSelection?.selectedPlayerIds).toContain('p2');

      // Bob disconnects
      useGameStore.getState().setPlayerAvailability('p2', false);
      expect(useGameStore.getState().gameState?.currentSelection?.selectedPlayerIds).not.toContain('p2');
      expect(useGameStore.getState().selectedPlayerIds).not.toContain('p2');
    });

    it('removePlayer permanently removes player and preserves drawer validity', () => {
      useGameStore.getState().initGame(
        [
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
          { id: 'p3', name: 'Charlie' },
        ],
        'free',
        null
      );

      // Select Charlie
      useGameStore.getState().selectPlayer('p3');

      // Remove Charlie
      useGameStore.getState().removePlayer('p3');
      const state = useGameStore.getState().gameState;
      expect(state?.players.map((p) => p.id)).toEqual(['p1', 'p2']);
      expect(state?.currentSelection?.selectedPlayerIds).not.toContain('p3');
    });

    it('reconcileThreeStarConsent auto-accepts when remaining active players have accepted', () => {
      const consent: ThreeStarConsentState = {
        status: 'pending',
        requiredPlayerIds: ['p1', 'p2', 'p3'],
        acceptedPlayerIds: ['p1', 'p2'],
        declinedPlayerIds: [],
      };

      // p3 disconnected -> active players are ['p1', 'p2']
      const reconciled = reconcileThreeStarConsent(consent, ['p1', 'p2']);
      expect(reconciled?.status).toBe('accepted');
      expect(reconciled?.requiredPlayerIds).toEqual(['p1', 'p2']);
    });

    it('getConsentEligiblePlayerIds filters out disconnected players', () => {
      const players: OnlinePlayer[] = [
        { id: 'p1', name: 'Alice', isHost: true, peerId: 'peer1', connectionStatus: 'connected' },
        { id: 'p2', name: 'Bob', isHost: false, peerId: null, connectionStatus: 'disconnected' },
      ];
      expect(getConsentEligiblePlayerIds(players)).toEqual(['p1']);
    });
  });

  describe('5. Relationship Context & getRelationshipBonus', () => {
    it('prioritizes relationshipFit metadata over generic relationshipTags', () => {
      const cardWithBoth: ConversationCard = {
        id: 'c-test',
        level: 'two-star',
        zh: '測試',
        interaction: 'single',
        relationshipFit: { couples: 3 },
        relationshipTags: ['friends', 'dating', 'couples', 'family'],
      };

      // Explicit fit score 3 * 12 = 36
      const bonus = getRelationshipBonus(cardWithBoth, 'couples');
      expect(bonus).toBe(36);
    });

    it('scales fallback generic tags by specificity', () => {
      const singleTagCard: ConversationCard = {
        id: 'c1',
        level: 'two-star',
        zh: '測試',
        interaction: 'single',
        relationshipTags: ['couples'],
      };
      expect(getRelationshipBonus(singleTagCard, 'couples')).toBe(30);

      const twoTagCard: ConversationCard = {
        id: 'c2',
        level: 'two-star',
        zh: '測試',
        interaction: 'single',
        relationshipTags: ['couples', 'dating'],
      };
      expect(getRelationshipBonus(twoTagCard, 'couples')).toBe(24);

      const threeTagCard: ConversationCard = {
        id: 'c3',
        level: 'two-star',
        zh: '測試',
        interaction: 'single',
        relationshipTags: ['couples', 'dating', 'friends'],
      };
      expect(getRelationshipBonus(threeTagCard, 'couples')).toBe(18);

      const fourTagCard: ConversationCard = {
        id: 'c4',
        level: 'two-star',
        zh: '測試',
        interaction: 'single',
        relationshipTags: ['couples', 'dating', 'friends', 'family'],
      };
      expect(getRelationshipBonus(fourTagCard, 'couples')).toBe(10);

      const genericCard: ConversationCard = {
        id: 'c5',
        level: 'two-star',
        zh: '測試',
        interaction: 'single',
        relationshipTags: ['new-friends', 'friends', 'dating', 'couples', 'family'],
      };
      expect(getRelationshipBonus(genericCard, 'couples')).toBe(4);
    });
  });

  describe('6. Content Review Build Gate & Validation', () => {
    it('validates entire 130-card registry successfully', () => {
      const allCards = getAllCards();
      const report = assertCardDatabase(allCards, 130);
      expect(report.valid).toBe(true);
      expect(report.total).toBe(130);
      expect(report.errors).toHaveLength(0);
      expect(report.levelBreakdown.icebreaker).toBe(25);
      expect(report.levelBreakdown['one-star']).toBe(35);
      expect(report.levelBreakdown['two-star']).toBe(35);
      expect(report.levelBreakdown['three-star']).toBe(35);
    });

    it('rejects invalid card data', () => {
      const badCard: any = {
        id: 'bad-card',
        level: 'invalid-level',
        zh: '',
        interaction: 'unsupported-interaction',
        intensity: 99,
        relationshipFit: { couples: 5 },
      };

      const errors = validateCard(badCard);
      expect(errors.length).toBeGreaterThanOrEqual(4);
      expect(errors.some((e) => e.includes('Invalid card level'))).toBe(true);
      expect(errors.some((e) => e.includes('empty zh text'))).toBe(true);
      expect(errors.some((e) => e.includes('Invalid interaction'))).toBe(true);
      expect(errors.some((e) => e.includes('Invalid intensity'))).toBe(true);
    });
  });
});
