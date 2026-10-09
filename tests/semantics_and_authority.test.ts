import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../src/store/gameStore';
import { clearGameState } from '../src/game/persistence';
import { Player } from '../src/types/player';
import { useMultiplayerStore } from '../src/store/multiplayerStore';
import { handleHostIncomingMessage } from '../src/store/multiplayer/messageHandlers';
import { executeHostAction } from '../src/store/multiplayer/actionHandlers';
import { OnlinePlayer } from '../src/types/multiplayer';

describe('Game State Semantics & Multiplayer Authority Suite', () => {
  const twoPlayers: Player[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ];

  const threePlayers: Player[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Charlie' },
  ];

  beforeEach(() => {
    clearGameState();
    useGameStore.getState().resetGame();
    useMultiplayerStore.setState({
      isOnlineMode: false,
      isGameStarted: false,
      role: null,
      roomCode: null,
      myPlayerId: null,
      players: [],
      threeStarConsent: null,
    });
  });

  describe('minPlayers Deck Filtering', () => {
    it('excludes ice-06 (minPlayers: 3) in 2-player games', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      const state = useGameStore.getState().gameState;
      expect(state).toBeDefined();
      expect(state?.decks.icebreaker.shuffledIds).not.toContain('ice-06');
      expect(state?.decks.icebreaker.shuffledIds.length).toBe(9);
    });

    it('includes ice-06 in 3-or-more player games', () => {
      useGameStore.getState().initGame(threePlayers, 'guided', null);
      const state = useGameStore.getState().gameState;
      expect(state).toBeDefined();
      expect(state?.decks.icebreaker.shuffledIds).toContain('ice-06');
      expect(state?.decks.icebreaker.shuffledIds.length).toBe(10);
    });
  });

  describe('Face-down Card History Leak Prevention', () => {
    it('does not add card to revealedCardIds or historyCardIds when dealt face-down', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      const state = useGameStore.getState().gameState;

      expect(state?.currentCardId).toBeDefined();
      expect(state?.revealedCardIds).toEqual([]);
      expect(state?.historyCardIds).toEqual([]);
      expect(useGameStore.getState().isCardFlipped).toBe(false);

      // Only after flipCard is the card added to revealedCardIds and historyCardIds
      useGameStore.getState().flipCard();
      const updatedState = useGameStore.getState().gameState;
      expect(updatedState?.revealedCardIds).toContain(state?.currentCardId);
      expect(updatedState?.historyCardIds).toContain(state?.currentCardId);
      expect(useGameStore.getState().isCardFlipped).toBe(true);
    });

    it('retains unrevealed status across drawNextCard and skipCard until explicitly flipped', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      const firstCard = useGameStore.getState().gameState?.currentCardId;

      // Draw next card without flipping first card
      useGameStore.getState().drawNextCard();
      const secondCard = useGameStore.getState().gameState?.currentCardId;
      expect(secondCard).not.toBe(firstCard);
      expect(useGameStore.getState().gameState?.revealedCardIds).toEqual([]);

      // Skip card without flipping
      useGameStore.getState().skipCard();
      const thirdCard = useGameStore.getState().gameState?.currentCardId;
      expect(thirdCard).not.toBe(secondCard);
      expect(useGameStore.getState().gameState?.revealedCardIds).toEqual([]);

      // Flip the third card
      useGameStore.getState().flipCard();
      expect(useGameStore.getState().gameState?.revealedCardIds).toEqual([thirdCard]);
    });
  });

  describe('Direct 3-Star Start Pre-Consent Protection & Cancel Fallback', () => {
    it('does not consume any 3-star card before consent is confirmed', () => {
      useGameStore.getState().initGame(twoPlayers, 'free', null, 'three-star');
      const state = useGameStore.getState().gameState;

      expect(state?.currentLevel).toBe('three-star');
      expect(state?.currentCardId).toBeNull();
      expect(state?.decks['three-star'].cursor).toBe(0);
      expect(state?.decks['three-star'].usedIds).toEqual([]);
      expect(state?.cardsDrawnCount).toBe(0);
      expect(useGameStore.getState().showThreeStarConsent).toBe(true);

      // If user cancels consent, cleanly fall back to 2-star without having burned 3-star cards
      useGameStore.getState().cancelThreeStarConsent();
      const fallbackState = useGameStore.getState().gameState;

      expect(fallbackState?.currentLevel).toBe('two-star');
      expect(fallbackState?.currentCardId).toBeDefined();
      expect(fallbackState?.decks['two-star'].cursor).toBe(1);
      // Three-star remains completely untouched
      expect(fallbackState?.decks['three-star'].cursor).toBe(0);
      expect(fallbackState?.decks['three-star'].usedIds).toEqual([]);
      expect(useGameStore.getState().showThreeStarConsent).toBe(false);
    });

    it('draws first 3-star card only upon confirming consent', () => {
      useGameStore.getState().initGame(twoPlayers, 'free', null, 'three-star');
      expect(useGameStore.getState().gameState?.decks['three-star'].cursor).toBe(0);

      useGameStore.getState().confirmThreeStarConsent();
      const state = useGameStore.getState().gameState;

      expect(state?.currentLevel).toBe('three-star');
      expect(state?.currentCardId).toBeDefined();
      expect(state?.decks['three-star'].cursor).toBe(1);
      expect(state?.decks['three-star'].usedIds.length).toBe(1);
      expect(state?.threeStarConsentSeen).toBe(true);
      expect(useGameStore.getState().showThreeStarConsent).toBe(false);
    });
  });

  describe('Multiplayer Authority & Host-Only Control Matrix', () => {
    const hostPlayer: OnlinePlayer = {
      id: 'host_1',
      name: 'Host Alex',
      isHost: true,
      peerId: 'peer_host',
    };
    const guestPlayer: OnlinePlayer = {
      id: 'guest_1',
      name: 'Guest Ben',
      isHost: false,
      peerId: 'peer_guest',
    };
    const players = [hostPlayer, guestPlayer];

    it('rejects host-only actions (END_GAME, RESET_GAME, CHANGE_LEVEL) sent by a guest', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      const mockConn: any = { peer: 'peer_guest', open: true, send: vi.fn() };
      const ctx: any = {
        myPlayerId: 'host_1',
        roomCode: 'TEST01',
        players,
        isGameStarted: true,
        setPlayers: vi.fn(),
        broadcastState: vi.fn(),
      };

      // Guest attempts to END_GAME
      const initialStatus = useGameStore.getState().gameState?.status;
      handleHostIncomingMessage(
        mockConn,
        {
          type: 'CLIENT_ACTION',
          senderId: 'guest_1',
          payload: { action: 'END_GAME' },
        },
        ctx
      );

      // Status must still be playing (not ended)
      expect(useGameStore.getState().gameState?.status).toBe(initialStatus);
      expect(ctx.broadcastState).not.toHaveBeenCalled();

      // Guest attempts to CHANGE_LEVEL
      handleHostIncomingMessage(
        mockConn,
        {
          type: 'CLIENT_ACTION',
          senderId: 'guest_1',
          payload: { action: 'CHANGE_LEVEL', level: 'two-star' },
        },
        ctx
      );
      expect(useGameStore.getState().gameState?.currentLevel).toBe('icebreaker');
    });

    it('enforces room size limit (8 players max) and rejects late joiners once game has started', () => {
      const mockConn: any = { peer: 'peer_late', open: true, send: vi.fn(), close: vi.fn() };
      const eightPlayers = Array.from({ length: 8 }, (_, idx) => ({
        id: `p_${idx}`,
        name: `Player ${idx}`,
        isHost: idx === 0,
        peerId: `peer_${idx}`,
      }));

      const ctxFull: any = {
        myPlayerId: 'p_0',
        roomCode: 'FULL01',
        players: eightPlayers,
        isGameStarted: false,
        setPlayers: vi.fn(),
        broadcastState: vi.fn(),
      };

      // 9th player attempts to join
      handleHostIncomingMessage(
        mockConn,
        {
          type: 'JOIN_REQUEST',
          senderId: 'unknown',
          payload: { playerName: 'Late' },
        },
        ctxFull
      );

      expect(mockConn.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'JOIN_REJECTED',
          payload: expect.objectContaining({ reason: expect.stringContaining('上限') }),
        })
      );

      // Late joiner when game already started
      const ctxStarted: any = {
        myPlayerId: 'p_0',
        roomCode: 'ROOM01',
        players: [hostPlayer, guestPlayer],
        isGameStarted: true,
        setPlayers: vi.fn(),
        broadcastState: vi.fn(),
      };

      handleHostIncomingMessage(
        mockConn,
        {
          type: 'JOIN_REQUEST',
          senderId: 'unknown',
          payload: { playerName: 'Late' },
        },
        ctxStarted
      );

      expect(mockConn.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'JOIN_REJECTED',
          payload: expect.objectContaining({ reason: expect.stringContaining('進行中') }),
        })
      );
    });
  });

  describe('Multiplayer Unanimous 3-Star Consent Gate', () => {
    it('requires all connected players to accept before promoting to 3-star', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      useMultiplayerStore.setState({
        isOnlineMode: true,
        players: [
          { id: 'p1', name: 'Alice', isHost: true, peerId: 'peer_1' },
          { id: 'p2', name: 'Bob', isHost: false, peerId: 'peer_2' },
        ],
        myPlayerId: 'p1',
      });

      // Host initiates change to 3-star
      executeHostAction({ action: 'CHANGE_LEVEL', level: 'three-star' });
      const consentState = useMultiplayerStore.getState().threeStarConsent;

      expect(consentState).toBeDefined();
      expect(consentState?.status).toBe('pending');
      expect(consentState?.requiredPlayerIds).toEqual(['p1', 'p2']);
      expect(consentState?.acceptedPlayerIds).toEqual([]);

      // Alice votes confirm
      executeHostAction({ action: 'CONFIRM_THREE_STAR', playerId: 'p1' });
      expect(useMultiplayerStore.getState().threeStarConsent?.acceptedPlayerIds).toEqual(['p1']);
      // Still in icebreaker / pending consent
      expect(useGameStore.getState().gameState?.currentLevel).toBe('icebreaker');

      // Bob votes confirm -> Unanimous!
      executeHostAction({ action: 'CONFIRM_THREE_STAR', playerId: 'p2' });
      // Promoted to three-star!
      expect(useGameStore.getState().gameState?.currentLevel).toBe('three-star');
      expect(useGameStore.getState().gameState?.threeStarConsentSeen).toBe(true);
    });

    it('aborts 3-star promotion if any player declines, safely remaining at 2-star', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      useMultiplayerStore.setState({
        isOnlineMode: true,
        players: [
          { id: 'p1', name: 'Alice', isHost: true, peerId: 'peer_1' },
          { id: 'p2', name: 'Bob', isHost: false, peerId: 'peer_2' },
        ],
        myPlayerId: 'p1',
      });

      // Host initiates change to 3-star
      executeHostAction({ action: 'CHANGE_LEVEL', level: 'three-star' });

      // Alice confirms, but Bob declines
      executeHostAction({ action: 'CONFIRM_THREE_STAR', playerId: 'p1' });
      executeHostAction({ action: 'CANCEL_THREE_STAR', playerId: 'p2' });

      // Remained in 2-star / not promoted
      expect(useGameStore.getState().gameState?.currentLevel).not.toBe('three-star');
      expect(useGameStore.getState().showThreeStarConsent).toBe(false);
    });
  });
});
