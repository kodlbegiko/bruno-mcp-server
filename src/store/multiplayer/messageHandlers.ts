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

      const newPlayer: OnlinePlayer = {
        id: guestPlayerId,
        name: guestName,
        isHost: false,
        peerId: conn.peer,
      };

      const updatedPlayers = [...ctx.players, newPlayer];
      ctx.setPlayers(updatedPlayers);

      conn.send({
        type: 'JOIN_ACCEPTED',
        senderId: ctx.myPlayerId || 'host',
        payload: {
          myPlayerId: guestPlayerId,
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
      const guestName = message.payload?.playerName || '旅人';

      let existingPlayer = ctx.players.find((p) => p.id === guestPlayerId);
      let updatedPlayers = [...ctx.players];

      if (existingPlayer) {
        existingPlayer.peerId = conn.peer;
      } else {
        existingPlayer = {
          id: guestPlayerId || `player_${Date.now()}`,
          name: guestName,
          isHost: false,
          peerId: conn.peer,
        };
        updatedPlayers.push(existingPlayer);
      }

      peerManager.getHostConnections().set(conn.peer, conn);
      ctx.setPlayers(updatedPlayers);

      conn.send({
        type: 'JOIN_ACCEPTED',
        senderId: ctx.myPlayerId || 'host',
        payload: {
          myPlayerId: existingPlayer.id,
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

    case 'CLIENT_ACTION': {
      const sender = ctx.players.find(
        (p) => p.peerId === conn.peer || p.id === message.senderId
      );
      if (!sender) {
        console.warn('[Host Rejected Action] Unknown sender:', message.senderId);
        break;
      }

      const actionPayload = message.payload as ClientActionPayload;
      if (!actionPayload.playerId) {
        actionPayload.playerId = sender.id;
      }
      const currentGameState = useGameStore.getState().gameState;

      // Host-only authority verification
      const isHostOnlyAction =
        actionPayload.action === 'CHANGE_LEVEL' ||
        actionPayload.action === 'END_GAME' ||
        actionPayload.action === 'RESET_GAME';

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
          actionPayload.action === 'SELECT_PLAYER';

        if (isTurnRestrictedAction && !isCurrentDrawer && !sender.isHost) {
          console.warn(
            `[Host Rejected Action] Non-drawer (${sender.name}) attempted restricted action:`,
            actionPayload.action
          );
          break;
        }
      }

      executeHostAction(actionPayload);
      ctx.broadcastState();
      break;
    }
  }
}

export interface GuestMessageContext {
  onJoinSuccess?: (val: any) => void;
  updateGuestState: (data: {
    myPlayerId?: string;
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

    case 'JOIN_REJECTED': {
      peerManager.stopHeartbeat();
      const reason = message.payload?.reason || '無法加入房間。';
      ctx.updateGuestState({
        connectionStatus: 'error',
        errorMessage: reason,
      });
      break;
    }

    case 'JOIN_ACCEPTED': {
      const {
        myPlayerId,
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
        roomCode,
        players,
        connectionStatus: 'connected',
        errorMessage: null,
      });

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

    case 'ROOM_CLOSED': {
      peerManager.stopHeartbeat();
      ctx.updateGuestState({
        connectionStatus: 'disconnected',
        errorMessage: '房主已關閉房間。',
      });
      break;
    }
  }
}
