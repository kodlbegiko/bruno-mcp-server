import { create } from 'zustand';
import { CardLevel } from '../types/card';
import { Player } from '../types/player';
import { GameMode, GameState, SessionGoalMinutes } from '../types/game';
import { deckCards, getCardById } from '../data/decks';
import { createShuffledDeck } from '../game/shuffle';
import { clearGameState, loadGameState, saveGameState } from '../game/persistence';

interface GameStore {
  // State
  gameState: GameState | null;
  isCardFlipped: boolean;
  isTransitioningStage: boolean;
  pendingStage: CardLevel | null;
  showThreeStarConsent: boolean;
  showTimeReminder: boolean;
  selectedPlayerIds: string[];

  // Actions
  initGame: (
    players: Player[],
    mode: GameMode,
    sessionGoalMinutes: SessionGoalMinutes,
    startingLevel?: CardLevel
  ) => void;
  resumeGame: () => boolean;
  flipCard: () => void;
  drawNextCard: () => void;
  skipCard: () => void;
  changeLevel: (level: CardLevel) => void;
  confirmThreeStarConsent: () => void;
  cancelThreeStarConsent: () => void;
  selectPlayer: (playerId: string) => void;
  clearSelection: () => void;
  dismissTimeReminder: () => void;
  endGame: () => void;
  resetGame: () => void;
}

function initializeDecks(): GameState['decks'] {
  return {
    icebreaker: createShuffledDeck(deckCards.icebreaker.map((c) => c.id)),
    'one-star': createShuffledDeck(deckCards['one-star'].map((c) => c.id)),
    'two-star': createShuffledDeck(deckCards['two-star'].map((c) => c.id)),
    'three-star': createShuffledDeck(deckCards['three-star'].map((c) => c.id)),
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: loadGameState(),
  isCardFlipped: false,
  isTransitioningStage: false,
  pendingStage: null,
  showThreeStarConsent: false,
  showTimeReminder: false,
  selectedPlayerIds: [],

  initGame: (players, mode, sessionGoalMinutes, startingLevel) => {
    const decks = initializeDecks();
    const startLevel: CardLevel = mode === 'free' && startingLevel ? startingLevel : 'icebreaker';
    const deck = decks[startLevel];
    const initialCardId = deck.shuffledIds.length > 0 ? deck.shuffledIds[0] : null;
    const isThreeStarStart = startLevel === 'three-star';

    const newGameState: GameState = {
      version: 1,
      gameId: `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      players: players.map((p, idx) => ({
        id: p.id || `player_${idx + 1}`,
        name: p.name.trim() || `玩家 ${idx + 1}`,
      })),
      mode,
      sessionGoalMinutes,
      startedAt: Date.now(),
      currentLevel: startLevel,
      drawerIndex: 0,
      currentCardId: initialCardId,
      currentSelection: { selectedPlayerIds: [] },
      decks: {
        ...decks,
        [startLevel]: {
          ...deck,
          cursor: 1,
          usedIds: initialCardId ? [initialCardId] : [],
        },
      },
      threeStarConsentSeen: false,
      cardsDrawnCount: initialCardId ? 1 : 0,
      historyCardIds: initialCardId ? [initialCardId] : [],
      status: 'playing',
    };

    saveGameState(newGameState);
    set({
      gameState: newGameState,
      isCardFlipped: false,
      isTransitioningStage: false,
      pendingStage: isThreeStarStart ? 'three-star' : null,
      showThreeStarConsent: isThreeStarStart,
      showTimeReminder: false,
      selectedPlayerIds: [],
    });
  },

  resumeGame: () => {
    const saved = loadGameState();
    if (saved && saved.status === 'playing') {
      set({
        gameState: saved,
        isCardFlipped: false,
        selectedPlayerIds: saved.currentSelection?.selectedPlayerIds || [],
      });
      return true;
    }
    return false;
  },

  flipCard: () => {
    set({ isCardFlipped: true });
  },

  drawNextCard: () => {
    const state = get().gameState;
    if (!state || state.status !== 'playing') return;

    const currentLevel = state.currentLevel;
    const deck = state.decks[currentLevel];
    const nextCursor = deck.cursor;
    const hasMoreInDeck = nextCursor < deck.shuffledIds.length;

    if (!hasMoreInDeck) {
      // Current deck is empty
      const updatedState: GameState = {
        ...state,
        currentCardId: null,
      };
      saveGameState(updatedState);
      set({
        gameState: updatedState,
        isCardFlipped: false,
        selectedPlayerIds: [],
      });
      return;
    }

    const nextCardId = deck.shuffledIds[nextCursor];
    const nextDrawerIndex = (state.drawerIndex + 1) % state.players.length;

    const history = state.historyCardIds || [];
    const updatedState: GameState = {
      ...state,
      drawerIndex: nextDrawerIndex,
      currentCardId: nextCardId,
      currentSelection: { selectedPlayerIds: [] },
      cardsDrawnCount: state.cardsDrawnCount + 1,
      historyCardIds: [...history, nextCardId],
      decks: {
        ...state.decks,
        [currentLevel]: {
          ...deck,
          cursor: nextCursor + 1,
          usedIds: [...deck.usedIds, nextCardId],
        },
      },
    };

    saveGameState(updatedState);
    set({
      gameState: updatedState,
      isCardFlipped: false,
      selectedPlayerIds: [],
    });
  },

  skipCard: () => {
    const state = get().gameState;
    if (!state || state.status !== 'playing') return;

    const currentLevel = state.currentLevel;
    const deck = state.decks[currentLevel];
    const nextCursor = deck.cursor;
    const hasMoreInDeck = nextCursor < deck.shuffledIds.length;

    if (!hasMoreInDeck) {
      // Deck is empty
      const updatedState: GameState = {
        ...state,
        currentCardId: null,
      };
      saveGameState(updatedState);
      set({
        gameState: updatedState,
        isCardFlipped: false,
        selectedPlayerIds: [],
      });
      return;
    }

    const nextCardId = deck.shuffledIds[nextCursor];
    // Keep drawerIndex unchanged: the same player draws the replacement card!
    const history = state.historyCardIds || [];
    const updatedState: GameState = {
      ...state,
      // drawerIndex remains unchanged
      currentCardId: nextCardId,
      currentSelection: { selectedPlayerIds: [] },
      cardsDrawnCount: state.cardsDrawnCount + 1,
      historyCardIds: [...history, nextCardId],
      decks: {
        ...state.decks,
        [currentLevel]: {
          ...deck,
          cursor: nextCursor + 1,
          usedIds: [...deck.usedIds, nextCardId],
        },
      },
    };

    saveGameState(updatedState);
    set({
      gameState: updatedState,
      isCardFlipped: false,
      selectedPlayerIds: [],
    });
  },

  changeLevel: (level: CardLevel) => {
    const state = get().gameState;
    if (!state) return;

    // Check Three-Star protection
    if (level === 'three-star' && !state.threeStarConsentSeen) {
      set({
        showThreeStarConsent: true,
        pendingStage: 'three-star',
      });
      return;
    }

    const deck = state.decks[level];
    let nextCardId: string | null = null;
    let nextCursor = deck.cursor;
    let newUsedIds = [...deck.usedIds];

    if (deck.cursor === 0 && deck.shuffledIds.length > 0) {
      // Fresh deck
      nextCardId = deck.shuffledIds[0];
      nextCursor = 1;
      newUsedIds = [nextCardId];
    } else if (deck.cursor < deck.shuffledIds.length) {
      // Deck in progress: draw next unplayed card
      nextCardId = deck.shuffledIds[deck.cursor];
      nextCursor = deck.cursor + 1;
      newUsedIds = [...deck.usedIds, nextCardId];
    } else {
      // Deck is already exhausted
      nextCardId = null;
    }

    const nextDrawerIndex = (state.drawerIndex + 1) % state.players.length;
    const history = state.historyCardIds || [];
    const shouldAddToHistory = nextCardId && !history.includes(nextCardId);

    const updatedState: GameState = {
      ...state,
      currentLevel: level,
      drawerIndex: nextDrawerIndex,
      currentCardId: nextCardId,
      currentSelection: { selectedPlayerIds: [] },
      cardsDrawnCount: nextCardId ? state.cardsDrawnCount + 1 : state.cardsDrawnCount,
      historyCardIds: shouldAddToHistory && nextCardId ? [...history, nextCardId] : history,
      decks: {
        ...state.decks,
        [level]: {
          ...deck,
          cursor: nextCursor,
          usedIds: newUsedIds,
        },
      },
    };

    saveGameState(updatedState);
    set({
      gameState: updatedState,
      isCardFlipped: false,
      isTransitioningStage: false,
      pendingStage: null,
      selectedPlayerIds: [],
    });
  },

  confirmThreeStarConsent: () => {
    const state = get().gameState;
    if (!state) return;

    const updatedState: GameState = {
      ...state,
      threeStarConsentSeen: true,
    };
    saveGameState(updatedState);
    set({ gameState: updatedState, showThreeStarConsent: false });
    get().changeLevel('three-star');
  },

  cancelThreeStarConsent: () => {
    const state = get().gameState;
    if (state && state.currentLevel === 'three-star' && !state.threeStarConsentSeen) {
      // If we entered directly at 3-star and cancelled, fall back to 2-star
      get().changeLevel('two-star');
    }
    set({
      showThreeStarConsent: false,
      pendingStage: null,
    });
  },

  selectPlayer: (playerId: string) => {
    const state = get().gameState;
    if (!state || !state.currentCardId) return;

    const card = getCardById(state.currentCardId);
    if (!card) return;

    const current = get().selectedPlayerIds;
    let next: string[];

    if (card.interaction === 'chooseOne' || card.interaction === 'pair') {
      next = current.includes(playerId) ? [] : [playerId];
    } else if (card.interaction === 'action' && card.responderRule === 'selectedPlayers') {
      // Max 2 players
      if (current.includes(playerId)) {
        next = current.filter((id) => id !== playerId);
      } else {
        next = current.length >= 2 ? [current[1], playerId] : [...current, playerId];
      }
    } else {
      next = current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId];
    }

    const updatedState: GameState = {
      ...state,
      currentSelection: { selectedPlayerIds: next },
    };
    saveGameState(updatedState);
    set({ selectedPlayerIds: next, gameState: updatedState });
  },

  clearSelection: () => {
    const state = get().gameState;
    if (!state) return;
    const updatedState: GameState = {
      ...state,
      currentSelection: { selectedPlayerIds: [] },
    };
    saveGameState(updatedState);
    set({ selectedPlayerIds: [], gameState: updatedState });
  },

  dismissTimeReminder: () => {
    set({ showTimeReminder: false });
  },

  endGame: () => {
    const state = get().gameState;
    if (!state) return;
    const updatedState: GameState = {
      ...state,
      status: 'ended',
      endedAt: Date.now(),
    };
    saveGameState(updatedState);
    set({ gameState: updatedState });
  },

  resetGame: () => {
    clearGameState();
    set({
      gameState: null,
      isCardFlipped: false,
      isTransitioningStage: false,
      pendingStage: null,
      showThreeStarConsent: false,
      showTimeReminder: false,
      selectedPlayerIds: [],
    });
  },
}));
