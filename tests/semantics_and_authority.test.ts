import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../src/store/gameStore';
import { clearGameState } from '../src/game/persistence';
import { Player } from '../src/types/player';
import { useMultiplayerStore } from '../src/store/multiplayerStore';
import { handleHostIncomingMessage, handleGuestIncomingMessage } from '../src/store/multiplayer/messageHandlers';
import { executeHostAction } from '../src/store/multiplayer/actionHandlers';
import { peerManager } from '../src/store/multiplayer/peerManager';
import { OnlinePlayer } from '../src/types/multiplayer';
import { trackEvent, resetSessionTimer, getSessionMetrics } from '../src/utils/analytics';

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
      useGameStore.getState().initGame(twoPlayers, 'guided', null, 'icebreaker', 'classic');
      const state = useGameStore.getState().gameState;
      expect(state).toBeDefined();
      expect(state?.decks.icebreaker.shuffledIds).not.toContain('ice-06');
      expect(state?.decks.icebreaker.shuffledIds.length).toBe(9);
    });

    it('includes ice-06 in 3-or-more player games', () => {
      useGameStore.getState().initGame(threePlayers, 'guided', null, 'icebreaker', 'classic');
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

  describe('Connection Identity Authority & Token Reconnection Hardening', () => {
    it('strictly identifies message sender by connection peer and rejects spoofed senderId', () => {
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      const hostPlayer: OnlinePlayer = { id: 'p_host', name: 'Host', isHost: true, peerId: 'peer_host' };
      const guestPlayer: OnlinePlayer = { id: 'p_guest', name: 'Guest Attacker', isHost: false, peerId: 'peer_attacker' };

      const mockConn = {
        peer: 'peer_attacker', // physical connection is the guest attacker
        send: vi.fn(),
        close: vi.fn(),
      } as any;

      const mockCtx = {
        myPlayerId: 'p_host',
        roomCode: 'ABCD',
        players: [hostPlayer, guestPlayer],
        isGameStarted: true,
        setPlayers: vi.fn(),
        broadcastState: vi.fn(),
      };

      // Attacker sends CLIENT_ACTION claiming senderId is 'p_host' to trigger END_GAME
      handleHostIncomingMessage(
        mockConn,
        {
          type: 'CLIENT_ACTION',
          senderId: 'p_host', // SPOOFED SENDER ID!
          payload: { action: 'END_GAME' },
        },
        mockCtx
      );

      // Game state must NOT be ended because connection peer is peer_attacker (not host!)
      expect(useGameStore.getState().gameState?.status).toBe('playing');
    });

    it('issues reconnectToken on JOIN_REQUEST and rejects RECONNECT_REQUEST with invalid token', () => {
      const mockConn = {
        peer: 'peer_new_guest',
        send: vi.fn(),
        close: vi.fn(),
      } as any;

      let roomPlayers: OnlinePlayer[] = [
        { id: 'p_host', name: 'Host', isHost: true, peerId: 'peer_host' },
      ];

      const mockCtx = {
        myPlayerId: 'p_host',
        roomCode: 'TEST',
        players: roomPlayers,
        isGameStarted: false,
        setPlayers: (p: OnlinePlayer[]) => {
          roomPlayers = p;
          mockCtx.players = p;
        },
        broadcastState: vi.fn(),
      };

      // Guest sends JOIN_REQUEST
      handleHostIncomingMessage(
        mockConn,
        {
          type: 'JOIN_REQUEST',
          senderId: 'peer_new_guest',
          payload: { playerName: 'Charlie' },
        },
        mockCtx
      );

      expect(mockConn.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'JOIN_ACCEPTED',
          payload: expect.objectContaining({
            reconnectToken: expect.any(String),
          }),
        })
      );

      const acceptedCall = mockConn.send.mock.calls.find(
        (c: any[]) => c[0].type === 'JOIN_ACCEPTED'
      );
      const validToken = acceptedCall[0].payload.reconnectToken;
      const guestPlayerId = acceptedCall[0].payload.myPlayerId;

      // Now guest tries to reconnect with an INVALID token
      const reconnectConn = {
        peer: 'peer_reconnected',
        send: vi.fn(),
        close: vi.fn(),
      } as any;

      handleHostIncomingMessage(
        reconnectConn,
        {
          type: 'RECONNECT_REQUEST',
          senderId: guestPlayerId,
          payload: {
            playerId: guestPlayerId,
            reconnectToken: 'WRONG_FORGED_TOKEN',
          },
        },
        mockCtx
      );

      // Must be rejected with RECONNECT_REJECTED!
      expect(reconnectConn.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RECONNECT_REJECTED',
        })
      );

      // Now guest reconnects with the VALID token
      const validReconnectConn = {
        peer: 'peer_valid_reconnect',
        send: vi.fn(),
        close: vi.fn(),
      } as any;

      handleHostIncomingMessage(
        validReconnectConn,
        {
          type: 'RECONNECT_REQUEST',
          senderId: guestPlayerId,
          payload: {
            playerId: guestPlayerId,
            reconnectToken: validToken,
          },
        },
        mockCtx
      );

      // Must be accepted!
      expect(validReconnectConn.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'JOIN_ACCEPTED',
          payload: expect.objectContaining({
            myPlayerId: guestPlayerId,
            reconnectToken: validToken,
          }),
        })
      );
    });

    it('triggers onJoinRejected callback when guest receives JOIN_REJECTED or RECONNECT_REJECTED', () => {
      const onJoinSuccess = vi.fn();
      const onJoinRejected = vi.fn();
      const updateGuestState = vi.fn();

      handleGuestIncomingMessage(
        {
          type: 'RECONNECT_REJECTED',
          senderId: 'host',
          payload: { reason: '驗證失敗' },
        },
        {
          onJoinSuccess,
          onJoinRejected,
          updateGuestState,
        }
      );

      expect(onJoinRejected).toHaveBeenCalledWith(expect.any(Error));
      expect(updateGuestState).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionStatus: 'error',
          errorMessage: '驗證失敗',
        })
      );
    });

    it('preserves initial drawer (Player 1) when starting directly on 3-star', () => {
      // Free play starting directly at three-star
      useGameStore.getState().initGame(twoPlayers, 'free', null, 'three-star');
      const stateBefore = useGameStore.getState().gameState;

      expect(stateBefore?.cardsDrawnCount).toBe(0);
      expect(stateBefore?.drawerIndex).toBe(0);
      expect(useGameStore.getState().showThreeStarConsent).toBe(true);

      // Confirm consent
      useGameStore.getState().confirmThreeStarConsent();

      const stateAfter = useGameStore.getState().gameState;
      expect(stateAfter?.currentLevel).toBe('three-star');
      expect(stateAfter?.threeStarConsentSeen).toBe(true);
      // Drawer must STILL be Player 1 (drawerIndex 0), NOT skipped to Player 2!
      expect(stateAfter?.drawerIndex).toBe(0);
      expect(stateAfter?.cardsDrawnCount).toBe(1);
    });

    it('deduplicates first_card_flip analytics and resets session timer on initGame', () => {
      resetSessionTimer();
      trackEvent('first_card_flip', { cardId: 'ice-01' });
      const metricsAfterFirst = getSessionMetrics();
      const initialCount = metricsAfterFirst.events.filter((e) => e.event === 'first_card_flip').length;
      expect(initialCount).toBe(1);

      // Subsequent first_card_flip calls should NOT add duplicate events
      trackEvent('first_card_flip', { cardId: 'ice-02' });
      const metricsAfterSecond = getSessionMetrics();
      const secondCount = metricsAfterSecond.events.filter((e) => e.event === 'first_card_flip').length;
      expect(secondCount).toBe(1);

      // When a new game initializes, session timer resets
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      const metricsAfterReset = getSessionMetrics();
      expect(metricsAfterReset.hasFirstCardFlipped).toBe(false);

      // Now first_card_flip can be tracked once again
      trackEvent('first_card_flip', { cardId: 'ice-03' });
      const metricsAfterNewGame = getSessionMetrics();
      expect(metricsAfterNewGame.hasFirstCardFlipped).toBe(true);
    });

    it('synchronizes Play Again lifecycle across Host and Guest: RESET_GAME resets both states, preserves room and players', () => {
      // 1. Setup online room with Host Alice and Guest Bob
      const onlinePlayers: OnlinePlayer[] = [
        { id: 'p1', name: 'Alice', isHost: true, peerId: 'peer_host', connectionStatus: 'connected' },
        { id: 'p2', name: 'Bob', isHost: false, peerId: 'peer_guest', connectionStatus: 'connected' },
      ];

      useMultiplayerStore.setState({
        isOnlineMode: true,
        role: 'host',
        roomCode: 'TEST99',
        myPlayerId: 'p1',
        players: onlinePlayers,
        isGameStarted: true,
      });

      // Initialize game and end it
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      useGameStore.getState().endGame();
      expect(useGameStore.getState().gameState?.status).toBe('ended');

      // 2. Mock broadcast channel from peerManager
      const sentMessages: any[] = [];
      const broadcastSpy = vi.spyOn(peerManager, 'broadcastToGuests').mockImplementation((msg) => {
        sentMessages.push(msg);
      });

      // 3. Host clicks Play Again -> executeHostAction with RESET_GAME
      executeHostAction({ action: 'RESET_GAME' }, { actorPlayerId: 'p1', isHost: true });

      // Host state verification:
      expect(useGameStore.getState().gameState).toBeNull();
      expect(useMultiplayerStore.getState().isGameStarted).toBe(false);
      expect(useMultiplayerStore.getState().roomCode).toBe('TEST99');
      expect(useMultiplayerStore.getState().players.length).toBe(2);

      // Verify SESSION_RESET was broadcast
      expect(sentMessages.some((m) => m.type === 'SESSION_RESET')).toBe(true);

      // 4. Guest receives SESSION_RESET
      useGameStore.getState().initGame(twoPlayers, 'guided', null);
      useGameStore.getState().endGame();
      useMultiplayerStore.setState({ isGameStarted: true });

      handleGuestIncomingMessage(
        {
          type: 'SESSION_RESET',
          senderId: 'p1',
        },
        { updateGuestState: vi.fn() }
      );

      // Guest state verification:
      expect(useGameStore.getState().gameState).toBeNull();
      expect(useMultiplayerStore.getState().isGameStarted).toBe(false);
      expect(useMultiplayerStore.getState().roomCode).toBe('TEST99');
      expect(useMultiplayerStore.getState().players.length).toBe(2);

      broadcastSpy.mockRestore();
    });
  });
});
