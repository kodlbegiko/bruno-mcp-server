import { DataConnection } from 'peerjs';
import {
  OnlinePlayer,
  PeerMessage,
  ClientActionPayload,
  SyncStatePayload,
} from '../../types/multiplayer';
import { useGameStore } from '../gameStore';
import { useSettingsStore } from '../settingsStore';
import { useMultiplayerStore } from '../multiplayerStore';
import { playFlipSound, playSlideSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';
import { peerManager } from './peerManager';
import { executeHostAction } from './actionHandlers';

export interface HostMessageContext {
  myPlayerId: string | null;
  roomCode: string | null;
  players: OnlinePlayer[];
  isGameStarted: boolean;
  setPlayers: (players: OnlinePlayer[]) => void;
  broadcastState: () => void;
}

export function handleHostIncomingMessage(
  conn: DataConnection,
  message: PeerMessage,
  ctx: HostMessageContext
): void {
  // Always register heartbeat from active client
  peerManager.recordHeartbeat();

  switch (message.type) {
    case 'PING': {
      if (conn.open) {
        conn.send({
          type: 'PONG',
          senderId: ctx.myPlayerId || 'host',
        } as PeerMessage);
      }
      break;
    }

    case 'PONG': {
      // Handled by recordHeartbeat above
      break;
    }

    case 'JOIN_REQUEST': {
      if (ctx.players.length >= 8) {
        conn.send({
          type: 'JOIN_REJECTED',
          senderId: ctx.myPlayerId || 'host',
          payload: { reason: '房間人數已達上限（最多 8 人）' },
        } as PeerMessage);
        setTimeout(() => conn.close(), 500);
        break;
      }

      if (ctx.isGameStarted) {
        conn.send({
          type: 'JOIN_REJECTED',
          senderId: ctx.myPlayerId || 'host',
          payload: { reason: '對話已在進行中，無法中途加入' },
        } as PeerMessage);
        setTimeout(() => conn.close(), 500);
        break;
      }

      const guestName = message.payload?.playerName || '旅人';
      const guestPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const reconnectToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

      const newPlayer: OnlinePlayer = {
        id: guestPlayerId,
        name: guestName,
        isHost: false,
        peerId: conn.peer,
        reconnectToken,
        connectionStatus: 'connected',
      };

      const updatedPlayers = [...ctx.players, newPlayer];
      ctx.setPlayers(updatedPlayers);

      conn.send({
        type: 'JOIN_ACCEPTED',
        senderId: ctx.myPlayerId || 'host',
        payload: {
          myPlayerId: guestPlayerId,
          reconnectToken,
          roomCode: ctx.roomCode,
          players: updatedPlayers,
          gameState: ctx.isGameStarted ? useGameStore.getState().gameState : null,
          isCardFlipped: useGameStore.getState().isCardFlipped,
          selectedPlayerIds: useGameStore.getState().selectedPlayerIds,
          showThreeStarConsent: useGameStore.getState().showThreeStarConsent,
          threeStarConsent: useMultiplayerStore.getState().threeStarConsent,
        },
      } as PeerMessage);

      peerManager.broadcastToGuests({
        type: 'PLAYER_LIST_UPDATE',
        senderId: ctx.myPlayerId || 'host',
        payload: { players: updatedPlayers },
      });
      break;
    }

    case 'RECONNECT_REQUEST': {
      const guestPlayerId = message.payload?.playerId;
      const reconnectToken = message.payload?.reconnectToken;

      const existingPlayer = ctx.players.find((p) => p.id === guestPlayerId);

      // Verify slot existence and reconnect token authenticity!
      // NEVER create an unknown player in RECONNECT_REQUEST!
      if (
        !existingPlayer ||
        (existingPlayer.reconnectToken && existingPlayer.reconnectToken !== reconnectToken)
      ) {
        conn.send({
          type: 'RECONNECT_REJECTED',
          senderId: ctx.myPlayerId || 'host',
          payload: { reason: '重新連線驗證失敗或玩家紀錄不存在，請重新加入房間。' },
        } as PeerMessage);
        setTimeout(() => conn.close(), 500);
        break;
      }

      // Clear disconnect grace timer if active
      peerManager.clearDisconnectGrace(existingPlayer.id);

      existingPlayer.peerId = conn.peer;
      existingPlayer.connectionStatus = 'connected';
      delete existingPlayer.disconnectedAt;
      delete existingPlayer.graceExpired;
      const updatedPlayers = [...ctx.players];

      peerManager.getHostConnections().set(conn.peer, conn);
      ctx.setPlayers(updatedPlayers);

      // Re-enable player in game store
      useGameStore.getState().setPlayerAvailability(existingPlayer.id, true);

      // Reconcile three-star consent if pending
      const currentConsent = useMultiplayerStore.getState().threeStarConsent;
      if (currentConsent && currentConsent.status === 'pending') {
        if (!currentConsent.requiredPlayerIds.includes(existingPlayer.id)) {
          useMultiplayerStore.setState({
            threeStarConsent: {
              ...currentConsent,
              requiredPlayerIds: [...currentConsent.requiredPlayerIds, existingPlayer.id],
            },
          });
        }
      }

      conn.send({
        type: 'JOIN_ACCEPTED',
        senderId: ctx.myPlayerId || 'host',
        payload: {
          myPlayerId: existingPlayer.id,
          reconnectToken: existingPlayer.reconnectToken,
          roomCode: ctx.roomCode,
          players: updatedPlayers,
          gameState: ctx.isGameStarted ? useGameStore.getState().gameState : null,
          isCardFlipped: useGameStore.getState().isCardFlipped,
          selectedPlayerIds: useGameStore.getState().selectedPlayerIds,
          showThreeStarConsent: useGameStore.getState().showThreeStarConsent,
          threeStarConsent: useMultiplayerStore.getState().threeStarConsent,
        },
      } as PeerMessage);

      peerManager.broadcastToGuests({
        type: 'PLAYER_LIST_UPDATE',
        senderId: ctx.myPlayerId || 'host',
        payload: { players: updatedPlayers },
      });
      ctx.broadcastState();
      break;
    }

    case 'CLIENT_ACTION': {
      // Authenticate sender strictly by WebRTC peer connection! NEVER trust message.senderId!
      const sender = ctx.players.find((p) => p.peerId === conn.peer);
      if (!sender) {
        console.warn('[Host Rejected Action] Unknown connection peer:', conn.peer);
        break;
      }

      const actionPayload = message.payload as ClientActionPayload;
      const currentGameState = useGameStore.getState().gameState;

      // Host-only authority verification
      const isHostOnlyAction =
        actionPayload.action === 'CHANGE_LEVEL' ||
        actionPayload.action === 'END_GAME' ||
        actionPayload.action === 'RESET_GAME' ||
        actionPayload.action === 'REMOVE_PLAYER';

      if (isHostOnlyAction && !sender.isHost) {
        console.warn(
          `[Host Rejected Action] Non-host (${sender.name}) attempted host-only action:`,
          actionPayload.action
        );
        break;
      }

      // Drawer-only authority verification
      if (currentGameState && currentGameState.status === 'playing') {
        const currentDrawer = currentGameState.players[currentGameState.drawerIndex];
        const isCurrentDrawer = currentDrawer && currentDrawer.id === sender.id;

        const isTurnRestrictedAction =
          actionPayload.action === 'FLIP_CARD' ||
          actionPayload.action === 'DRAW_NEXT_CARD' ||
          actionPayload.action === 'SKIP_CARD' ||
          actionPayload.action === 'SELECT_PLAYER' ||
          actionPayload.action === 'OPEN_FOLLOW_UP' ||
          actionPayload.action === 'CLOSE_FOLLOW_UP';

        if (isTurnRestrictedAction && !isCurrentDrawer && !sender.isHost) {
          console.warn(
            `[Host Rejected Action] Non-drawer (${sender.name}) attempted restricted action:`,
            actionPayload.action
          );
          break;
        }
      }

      executeHostAction(actionPayload, {
        actorPlayerId: sender.id,
        isHost: sender.isHost,
      });
      ctx.broadcastState();
      break;
    }
  }
}

export interface GuestMessageContext {
  onJoinSuccess?: (val: any) => void;
  onJoinRejected?: (err: Error) => void;
  updateGuestState: (data: {
    myPlayerId?: string;
    reconnectToken?: string;
    roomCode?: string;
    players?: OnlinePlayer[];
    errorMessage?: string | null;
    connectionStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
  }) => void;
}

export function handleGuestIncomingMessage(
  message: PeerMessage,
  ctx: GuestMessageContext
): void {
  // Record heartbeat on any incoming packet from host
  peerManager.recordHeartbeat();
  const settings = useSettingsStore.getState();

  switch (message.type) {
    case 'PING': {
      // Echo PONG back to host
      peerManager.sendToHost({
        type: 'PONG',
        senderId: 'guest',
      });
      break;
    }

    case 'PONG': {
      // Heartbeat updated
      break;
    }

    case 'JOIN_REJECTED':
    case 'RECONNECT_REJECTED': {
      peerManager.setManualLeave(true); // Stop auto-reconnect loop immediately
      peerManager.stopHeartbeat();
      const reason = message.payload?.reason || '加入或重新連線房間被拒絕。';
      ctx.updateGuestState({
        connectionStatus: 'error',
        errorMessage: reason,
      });
      if (ctx.onJoinRejected) {
        ctx.onJoinRejected(new Error(reason));
      }
      break;
    }

    case 'JOIN_ACCEPTED': {
      const {
        myPlayerId,
        reconnectToken,
        roomCode,
        players,
        gameState,
        isCardFlipped,
        selectedPlayerIds,
        showThreeStarConsent,
        threeStarConsent,
      } = message.payload;

      ctx.updateGuestState({
        myPlayerId,
        reconnectToken,
        roomCode,
        players,
        connectionStatus: 'connected',
        errorMessage: null,
      });

      if (typeof window !== 'undefined' && reconnectToken) {
        try {
          sessionStorage.setItem('dks_reconnect_token', reconnectToken);
          sessionStorage.setItem('dks_player_id', myPlayerId);
          sessionStorage.setItem('dks_room_code', roomCode);
        } catch {
          // ignore
        }
      }

      if (threeStarConsent !== undefined) {
        useMultiplayerStore.setState({ threeStarConsent: threeStarConsent ?? null });
      }

      if (gameState) {
        if (gameState.status === 'playing') {
          useMultiplayerStore.setState({ isGameStarted: true });
        }
        useGameStore.setState({
          gameState,
          isCardFlipped: isCardFlipped ?? false,
          selectedPlayerIds: selectedPlayerIds ?? [],
          showThreeStarConsent: showThreeStarConsent ?? false,
        });
      }
      if (ctx.onJoinSuccess) ctx.onJoinSuccess(undefined);
      break;
    }

    case 'PLAYER_LIST_UPDATE': {
      ctx.updateGuestState({ players: message.payload.players });
      break;
    }

    case 'SYNC_STATE': {
      const {
        gameState,
        isCardFlipped,
        selectedPlayerIds,
        showThreeStarConsent,
        threeStarConsent,
      } = message.payload as SyncStatePayload;
      const prevFlipped = useGameStore.getState().isCardFlipped;
      const prevCardId = useGameStore.getState().gameState?.currentCardId;

      if (threeStarConsent !== undefined) {
        useMultiplayerStore.setState({ threeStarConsent: threeStarConsent ?? null });
      }

      if (gameState && gameState.status === 'playing') {
        useMultiplayerStore.setState({ isGameStarted: true });
      }

      useGameStore.setState({
        gameState,
        isCardFlipped,
        selectedPlayerIds,
        showThreeStarConsent: showThreeStarConsent ?? false,
      });

      if (!prevFlipped && isCardFlipped) {
        playFlipSound(settings.soundEnabled);
        triggerHaptic('light', settings.hapticsEnabled);
      } else if (prevCardId !== gameState.currentCardId) {
        playSlideSound(settings.soundEnabled);
        triggerHaptic('light', settings.hapticsEnabled);
      }
      break;
    }

    case 'SESSION_RESET': {
      useGameStore.getState().resetGame();
      ctx.updateGuestState({
        connectionStatus: 'connected',
        errorMessage: '房主已重設本局遊戲。',
      });
      break;
    }

    case 'ROOM_CLOSED': {
      peerManager.setManualLeave(true); // Stop auto reconnect loops
      peerManager.stopHeartbeat();
      ctx.updateGuestState({
        connectionStatus: 'disconnected',
        errorMessage: '房主已關閉房間。',
      });
      break;
    }
  }
}
