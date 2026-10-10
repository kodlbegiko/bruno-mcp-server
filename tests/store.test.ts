import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../src/store/gameStore';
import { clearGameState, loadGameState } from '../src/game/persistence';
import { Player } from '../src/types/player';

describe('Game Store & State Machine', () => {
  beforeEach(() => {
    clearGameState();
    useGameStore.getState().resetGame();
  });

  const players: Player[] = [
    { id: 'p1', name: 'Sean' },
    { id: 'p2', name: 'Amy' },
    { id: 'p3', name: 'John' },
  ];

  it('initializes game with correct default state and shuffles', () => {
    const store = useGameStore.getState();
    store.initGame(players, 'guided', 30);

    const state = useGameStore.getState().gameState;
    expect(state).not.toBeNull();
    expect(state?.players.length).toBe(3);
    expect(state?.drawerIndex).toBe(0);
    expect(state?.mode).toBe('guided');
    expect(state?.currentLevel).toBe('icebreaker');
    expect(state?.cardsDrawnCount).toBe(1);
    expect(state?.threeStarConsentSeen).toBe(false);

    // Persisted to localStorage
    const saved = loadGameState();
    expect(saved?.gameId).toBe(state?.gameId);
  });

  it('rotates drawer on drawNextCard (Sean -> Amy -> John -> Sean)', () => {
    const store = useGameStore.getState();
    store.initGame(players, 'guided', null);

    expect(useGameStore.getState().gameState?.drawerIndex).toBe(0); // Sean
    expect(useGameStore.getState().gameState?.cardsDrawnCount).toBe(1);

    useGameStore.getState().drawNextCard();
    expect(useGameStore.getState().gameState?.drawerIndex).toBe(1); // Amy
    expect(useGameStore.getState().gameState?.cardsDrawnCount).toBe(2);

    useGameStore.getState().drawNextCard();
    expect(useGameStore.getState().gameState?.drawerIndex).toBe(2); // John
    expect(useGameStore.getState().gameState?.cardsDrawnCount).toBe(3);

    useGameStore.getState().drawNextCard();
    expect(useGameStore.getState().gameState?.drawerIndex).toBe(0); // Back to Sean
    expect(useGameStore.getState().gameState?.cardsDrawnCount).toBe(4);
  });

  it('skipCard immediately burns current card, retains drawer, and draws replacement card without penalty', () => {
    const store = useGameStore.getState();
    store.initGame(players, 'guided', null);

    const firstCardId = useGameStore.getState().gameState?.currentCardId;
    expect(firstCardId).toBeDefined();

    useGameStore.getState().skipCard();

    const state = useGameStore.getState().gameState;
    expect(state?.currentCardId).not.toBe(firstCardId);
    expect(state?.decks.icebreaker.usedIds).toContain(firstCardId);
    expect(state?.drawerIndex).toBe(0); // Drawer retained for replacement card
  });

  it('handles deck exhaustion by setting currentCardId to null', () => {
    useGameStore.getState().initGame(players, 'guided', null);

    const deckLength = useGameStore.getState().gameState?.decks.icebreaker.shuffledIds.length || 0;
    // Exhaust icebreaker deck
    for (let i = 0; i < deckLength + 1; i++) {
      useGameStore.getState().drawNextCard();
    }

    const state = useGameStore.getState().gameState;
    expect(state?.currentCardId).toBeNull();
  });

  it('supports Free Play mode starting with specified deck and enforces 3-star consent', () => {
    const store = useGameStore.getState();
    store.initGame(players, 'free', null, 'two-star');

    let state = useGameStore.getState().gameState;
    expect(state?.currentLevel).toBe('two-star');
    expect(state?.mode).toBe('free');

    // Starting directly on three-star shows consent modal immediately
    store.initGame(players, 'free', null, 'three-star');
    expect(useGameStore.getState().showThreeStarConsent).toBe(true);

    useGameStore.getState().confirmThreeStarConsent();
    state = useGameStore.getState().gameState;
    expect(state?.currentLevel).toBe('three-star');
    expect(state?.threeStarConsentSeen).toBe(true);
  });

  it('records endedAt timestamp when game ends', () => {
    const store = useGameStore.getState();
    store.initGame(players, 'guided', 30);

    useGameStore.getState().endGame();
    const state = useGameStore.getState().gameState;
    expect(state?.status).toBe('ended');
    expect(state?.endedAt).toBeDefined();
    expect(state?.endedAt).toBeGreaterThan(0);
  });

  it('protects Three-Star level with first-time consent screen', () => {
    const store = useGameStore.getState();
    store.initGame(players, 'guided', null);

    // Attempt to change level directly to three-star
    useGameStore.getState().changeLevel('three-star');
    expect(useGameStore.getState().showThreeStarConsent).toBe(true);
    expect(useGameStore.getState().gameState?.currentLevel).toBe('icebreaker');

    // Confirm consent
    useGameStore.getState().confirmThreeStarConsent();
    expect(useGameStore.getState().showThreeStarConsent).toBe(false);
    expect(useGameStore.getState().gameState?.currentLevel).toBe('three-star');
    expect(useGameStore.getState().gameState?.threeStarConsentSeen).toBe(true);

    // Switching away and back does NOT trigger consent prompt a second time
    useGameStore.getState().changeLevel('one-star');
    expect(useGameStore.getState().gameState?.currentLevel).toBe('one-star');

    useGameStore.getState().changeLevel('three-star');
    expect(useGameStore.getState().showThreeStarConsent).toBe(false);
    expect(useGameStore.getState().gameState?.currentLevel).toBe('three-star');
  });

  it('resumes game seamlessly from localStorage without changing deck order or cursors', () => {
    const store = useGameStore.getState();
    store.initGame(players, 'guided', 60);

    const originalState = useGameStore.getState().gameState;
    const shuffledOrder = originalState?.decks.icebreaker.shuffledIds;

    // Simulate page reload
    useGameStore.setState({ gameState: null });
    const resumed = useGameStore.getState().resumeGame();

    expect(resumed).toBe(true);
    const reloadedState = useGameStore.getState().gameState;
    expect(reloadedState?.gameId).toBe(originalState?.gameId);
    expect(reloadedState?.decks.icebreaker.shuffledIds).toEqual(shuffledOrder);
    expect(reloadedState?.drawerIndex).toBe(originalState?.drawerIndex);
    expect(reloadedState?.currentCardId).toBe(originalState?.currentCardId);
  });
});
