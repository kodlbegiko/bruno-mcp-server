import { create } from 'zustand';
import { CardLevel } from '../types/card';
import { RelationshipTag } from '../data/cards/types';
import { Player } from '../types/player';
import { GameMode, GameState, SessionGoalMinutes } from '../types/game';
import { getCardById } from '../data/decks';
import { createPacedDeck, selectNextAdaptiveCard } from '../domain/conversation/conversationEngine';
import { clearGameState, loadGameState, saveGameState, GAME_STATE_VERSION } from '../game/persistence';
import { resetSessionTimer } from '../utils/analytics';

import { QuestionSetId } from '../domain/questions/questionSets';
import { buildQuestionPool } from '../domain/questions/buildQuestionPool';

export function getNextEligibleDrawerIndex(
  players: Player[],
  currentIndex: number,
  inactivePlayerIds: string[] = []
): number {
  if (players.length === 0) return 0;
  const inactive = new Set(inactivePlayerIds);
  for (let offset = 1; offset <= players.length; offset += 1) {
    const candidateIndex = (currentIndex + offset) % players.length;
    const candidate = players[candidateIndex];
    if (candidate && !inactive.has(candidate.id)) {
      return candidateIndex;
    }
  }
  return currentIndex;
}

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
    startingLevel?: CardLevel,
    questionSetId?: QuestionSetId,
    targetRelationship?: RelationshipTag
  ) => void;
  resumeGame: () => boolean;
  flipCard: () => void;
  drawNextCard: () => void;
  skipCard: () => void;
  changeLevel: (level: CardLevel) => void;
  confirmThreeStarConsent: () => void;
  cancelThreeStarConsent: () => void;
  openFollowUp: () => void;
  closeFollowUp: () => void;
  recordFollowUpOpened: (cardId?: string) => void;
  setPlayerAvailability: (playerId: string, available: boolean) => void;
  removePlayer: (playerId: string) => void;
  selectPlayer: (playerId: string) => void;
  clearSelection: () => void;
  dismissTimeReminder: () => void;
  endGame: () => void;
  resetGame: () => void;
}

function initializeDecks(
  questionSetId: QuestionSetId = 'full',
  playerCount: number = 2,
  targetRelationship?: RelationshipTag
): GameState['decks'] {
  const pool = buildQuestionPool({ questionSetId, playerCount });
  const pacingOptions = targetRelationship ? { targetRelationship } : {};

  return {
    icebreaker: createPacedDeck(pool['icebreaker'], pacingOptions),
    'one-star': createPacedDeck(pool['one-star'], pacingOptions),
    'two-star': createPacedDeck(pool['two-star'], pacingOptions),
    'three-star': createPacedDeck(pool['three-star'], pacingOptions),
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

  initGame: (players, mode, sessionGoalMinutes, startingLevel, questionSetId = 'full', targetRelationship) => {
    resetSessionTimer();
    const playerCount = players.length;
    const decks = initializeDecks(questionSetId, playerCount, targetRelationship);
    const startLevel: CardLevel = mode === 'free' && startingLevel ? startingLevel : 'icebreaker';
    const isThreeStarStart = startLevel === 'three-star';
    const deck = decks[startLevel];
    // If starting directly on three-star, do not consume or draw card until consent is validated!
    const initialCardId = isThreeStarStart
      ? null
      : deck.shuffledIds.length > 0
      ? deck.shuffledIds[0]
      : null;

    const newGameState: GameState = {
      version: GAME_STATE_VERSION,
      gameId: `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      players: players.map((p, idx) => ({
        id: p.id || `player_${idx + 1}`,
        name: p.name.trim() || `玩家 ${idx + 1}`,
      })),
      mode,
      questionSetId,
      targetRelationship,
      sessionGoalMinutes,
      startedAt: Date.now(),
      currentLevel: startLevel,
      drawerIndex: 0,
      currentCardId: initialCardId,
      currentSelection: { selectedPlayerIds: [] },
      decks: {
        ...decks,
        ...(isThreeStarStart
          ? {}
          : {
              [startLevel]: {
                ...deck,
                cursor: initialCardId ? 1 : 0,
                usedIds: initialCardId ? [initialCardId] : [],
              },
            }),
      },
      threeStarConsentSeen: false,
      cardsDrawnCount: initialCardId ? 1 : 0,
      historyCardIds: [],
      revealedCardIds: [],
      skippedCardIds: [],
      followUpOpenedCardIds: [],
      activeFollowUpCardId: null,
      inactivePlayerIds: [],
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
    const state = get().gameState;
    if (!state || !state.currentCardId) {
      set({ isCardFlipped: true });
      return;
    }

    const currentCardId = state.currentCardId;
    const revealed = state.revealedCardIds || [];
    const history = state.historyCardIds || [];
    const updatedRevealed = revealed.includes(currentCardId)
      ? revealed
      : [...revealed, currentCardId];
    const updatedHistory = history.includes(currentCardId)
      ? history
      : [...history, currentCardId];

    const updatedState: GameState = {
      ...state,
      revealedCardIds: updatedRevealed,
      historyCardIds: updatedHistory,
    };

    saveGameState(updatedState);
    set({
      gameState: updatedState,
      isCardFlipped: true,
    });
  },

  drawNextCard: () => {
    const state = get().gameState;
    if (!state || state.status !== 'playing') return;

    const currentLevel = state.currentLevel;
    const deck = state.decks[currentLevel];
    const nextCursor = deck.cursor;
    const remainingIds = deck.shuffledIds.slice(nextCursor);

    if (remainingIds.length === 0) {
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

    const adaptiveCardId =
      selectNextAdaptiveCard(remainingIds, {
        historyCardIds: state.historyCardIds,
        skippedCardIds: state.skippedCardIds,
        followUpOpenedCardIds: state.followUpOpenedCardIds,
        targetRelationship: state.targetRelationship,
      }) || remainingIds[0];

    // Reorder deck.shuffledIds: swap chosen adaptive card to position nextCursor
    const chosenIndexInShuffled = deck.shuffledIds.indexOf(adaptiveCardId, nextCursor);
    const updatedShuffledIds = [...deck.shuffledIds];
    if (chosenIndexInShuffled > nextCursor) {
      const temp = updatedShuffledIds[nextCursor];
      updatedShuffledIds[nextCursor] = updatedShuffledIds[chosenIndexInShuffled];
      updatedShuffledIds[chosenIndexInShuffled] = temp;
    }

    const nextDrawerIndex = getNextEligibleDrawerIndex(
      state.players,
      state.drawerIndex,
      state.inactivePlayerIds ?? []
    );

    const updatedState: GameState = {
      ...state,
      drawerIndex: nextDrawerIndex,
      currentCardId: adaptiveCardId,
      currentSelection: { selectedPlayerIds: [] },
      cardsDrawnCount: state.cardsDrawnCount + 1,
      activeFollowUpCardId: null,
      decks: {
        ...state.decks,
        [currentLevel]: {
          shuffledIds: updatedShuffledIds,
          cursor: nextCursor + 1,
          usedIds: [...deck.usedIds, adaptiveCardId],
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
    const remainingIds = deck.shuffledIds.slice(nextCursor);

    const skippedCardId = state.currentCardId;
    const updatedSkipped = skippedCardId
      ? (state.skippedCardIds?.includes(skippedCardId)
          ? state.skippedCardIds
          : [...(state.skippedCardIds || []), skippedCardId])
      : state.skippedCardIds || [];

    if (remainingIds.length === 0) {
      // Deck is empty - current card was skipped and there is no replacement
      const updatedState: GameState = {
        ...state,
        currentCardId: null,
        skippedCardIds: updatedSkipped,
        activeFollowUpCardId: null,
        currentSelection: { selectedPlayerIds: [] },
      };
      saveGameState(updatedState);
      set({
        gameState: updatedState,
        isCardFlipped: false,
        selectedPlayerIds: [],
      });
      return;
    }

    const adaptiveCardId =
      selectNextAdaptiveCard(remainingIds, {
        historyCardIds: state.historyCardIds,
        justSkippedCardId: skippedCardId || undefined,
        skippedCardIds: updatedSkipped,
        followUpOpenedCardIds: state.followUpOpenedCardIds,
        targetRelationship: state.targetRelationship,
      }) || remainingIds[0];

    // Reorder deck.shuffledIds: swap chosen card to position nextCursor
    const chosenIndexInShuffled = deck.shuffledIds.indexOf(adaptiveCardId, nextCursor);
    const updatedShuffledIds = [...deck.shuffledIds];
    if (chosenIndexInShuffled > nextCursor) {
      const temp = updatedShuffledIds[nextCursor];
      updatedShuffledIds[nextCursor] = updatedShuffledIds[chosenIndexInShuffled];
      updatedShuffledIds[chosenIndexInShuffled] = temp;
    }

    // Keep drawerIndex unchanged: the same player draws the replacement card!
    const updatedState: GameState = {
      ...state,
      // drawerIndex remains unchanged
      currentCardId: adaptiveCardId,
      currentSelection: { selectedPlayerIds: [] },
      cardsDrawnCount: state.cardsDrawnCount + 1,
      skippedCardIds: updatedSkipped,
      activeFollowUpCardId: null,
      decks: {
        ...state.decks,
        [currentLevel]: {
          shuffledIds: updatedShuffledIds,
          cursor: nextCursor + 1,
          usedIds: [...deck.usedIds, adaptiveCardId],
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
    let updatedShuffledIds = [...deck.shuffledIds];

    const remainingIds = deck.shuffledIds.slice(deck.cursor);
    if (remainingIds.length > 0) {
      nextCardId =
        selectNextAdaptiveCard(remainingIds, {
          historyCardIds: state.historyCardIds,
          skippedCardIds: state.skippedCardIds,
          followUpOpenedCardIds: state.followUpOpenedCardIds,
          targetRelationship: state.targetRelationship,
        }) || remainingIds[0];

      const chosenIndex = deck.shuffledIds.indexOf(nextCardId, deck.cursor);
      if (chosenIndex > deck.cursor) {
        const temp = updatedShuffledIds[deck.cursor];
        updatedShuffledIds[deck.cursor] = updatedShuffledIds[chosenIndex];
        updatedShuffledIds[chosenIndex] = temp;
      }

      nextCursor = deck.cursor + 1;
      newUsedIds = [...deck.usedIds, nextCardId];
    } else {
      nextCardId = null;
    }

    const isInitialDeal = state.cardsDrawnCount === 0;
    const nextDrawerIndex = isInitialDeal
      ? state.drawerIndex
      : getNextEligibleDrawerIndex(
          state.players,
          state.drawerIndex,
          state.inactivePlayerIds ?? []
        );

    const updatedState: GameState = {
      ...state,
      currentLevel: level,
      drawerIndex: nextDrawerIndex,
      currentCardId: nextCardId,
      currentSelection: { selectedPlayerIds: [] },
      cardsDrawnCount: nextCardId ? state.cardsDrawnCount + 1 : state.cardsDrawnCount,
      activeFollowUpCardId: null,
      decks: {
        ...state.decks,
        [level]: {
          shuffledIds: updatedShuffledIds,
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

  openFollowUp: () => {
    const game = get().gameState;
    if (!game || !game.currentCardId) return;
    get().recordFollowUpOpened(game.currentCardId);
  },

  closeFollowUp: () => {
    const game = get().gameState;
    if (!game) return;
    const updatedState: GameState = {
      ...game,
      activeFollowUpCardId: null,
    };
    saveGameState(updatedState);
    set({ gameState: updatedState });
  },

  recordFollowUpOpened: (cardId?: string) => {
    const game = get().gameState;
    if (!game) return;
    const targetCardId = cardId || game.currentCardId;
    if (!targetCardId) return;

    const current = game.followUpOpenedCardIds || [];
    const opened = current.includes(targetCardId) ? current : [...current, targetCardId];

    const updatedState: GameState = {
      ...game,
      followUpOpenedCardIds: opened,
      activeFollowUpCardId: targetCardId,
    };
    saveGameState(updatedState);
    set({ gameState: updatedState });
  },

  setPlayerAvailability: (playerId: string, available: boolean) => {
    const game = get().gameState;
    if (!game) return;

    const inactive = new Set(game.inactivePlayerIds ?? []);
    if (available) {
      inactive.delete(playerId);
    } else {
      inactive.add(playerId);
    }

    let nextDrawerIndex = game.drawerIndex;
    const currentDrawer = game.players[game.drawerIndex];

    if (!available && currentDrawer?.id === playerId) {
      nextDrawerIndex = getNextEligibleDrawerIndex(
        game.players,
        game.drawerIndex,
        [...inactive]
      );
    }

    // Prune disconnected player from active target selection
    let updatedSelection = game.currentSelection;
    let selectedPlayerIds = get().selectedPlayerIds;
    if (!available) {
      const filtered = (game.currentSelection?.selectedPlayerIds || []).filter(
        (id) => id !== playerId
      );
      updatedSelection = { selectedPlayerIds: filtered };
      selectedPlayerIds = selectedPlayerIds.filter((id) => id !== playerId);
    }

    const updatedState: GameState = {
      ...game,
      inactivePlayerIds: [...inactive],
      drawerIndex: nextDrawerIndex,
      currentSelection: updatedSelection,
    };
    saveGameState(updatedState);
    set({ gameState: updatedState, selectedPlayerIds });
  },

  removePlayer: (playerId: string) => {
    const game = get().gameState;
    if (!game) return;

    const remainingPlayers = game.players.filter((p) => p.id !== playerId);
    if (remainingPlayers.length === 0) return;

    const inactive = (game.inactivePlayerIds ?? []).filter((id) => id !== playerId);
    const currentDrawer = game.players[game.drawerIndex];
    const isRemovingCurrentDrawer = currentDrawer && currentDrawer.id === playerId;

    let nextDrawerIndex: number;
    if (isRemovingCurrentDrawer) {
      // The current drawer was removed; advance to next eligible drawer
      const baseIndex = game.drawerIndex >= remainingPlayers.length ? 0 : game.drawerIndex;
      const inactiveSet = new Set(inactive);
      if (remainingPlayers[baseIndex] && !inactiveSet.has(remainingPlayers[baseIndex].id)) {
        nextDrawerIndex = baseIndex;
      } else {
        nextDrawerIndex = getNextEligibleDrawerIndex(remainingPlayers, baseIndex, inactive);
      }
    } else {
      // The removed player was NOT the drawer; keep current drawer's turn!
      const newDrawerIdx = remainingPlayers.findIndex((p) => p.id === currentDrawer?.id);
      nextDrawerIndex = newDrawerIdx !== -1 ? newDrawerIdx : 0;
    }

    const updatedSelection = {
      selectedPlayerIds: (game.currentSelection?.selectedPlayerIds || []).filter(
        (id) => id !== playerId
      ),
    };

    const updatedState: GameState = {
      ...game,
      players: remainingPlayers,
      inactivePlayerIds: inactive,
      drawerIndex: nextDrawerIndex,
      currentSelection: updatedSelection,
    };
    saveGameState(updatedState);
    set({
      gameState: updatedState,
      selectedPlayerIds: get().selectedPlayerIds.filter((id) => id !== playerId),
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
    set({ gameState: updatedState, showThreeStarConsent: false, pendingStage: null });
    get().changeLevel('three-star');
  },

  cancelThreeStarConsent: () => {
    const state = get().gameState;
    if (state && state.currentLevel === 'three-star' && !state.threeStarConsentSeen) {
      // If we entered directly at 3-star and cancelled, fall back to 2-star
      const twoStarDeck = state.decks['two-star'];
      const firstCardId = twoStarDeck.shuffledIds.length > 0 ? twoStarDeck.shuffledIds[0] : null;
      const updatedState: GameState = {
        ...state,
        currentLevel: 'two-star',
        currentCardId: firstCardId,
        cardsDrawnCount: firstCardId ? 1 : 0,
        decks: {
          ...state.decks,
          'two-star': {
            ...twoStarDeck,
            cursor: firstCardId ? 1 : 0,
            usedIds: firstCardId ? [firstCardId] : [],
          },
        },
      };
      saveGameState(updatedState);
      set({
        gameState: updatedState,
        showThreeStarConsent: false,
        pendingStage: null,
        isCardFlipped: false,
      });
      return;
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
