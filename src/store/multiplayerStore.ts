import { create } from 'zustand';
import { Peer } from 'peerjs';
import {
  OnlinePlayer,
  MultiplayerRole,
  PeerMessage,
  ClientActionPayload,
  SyncStatePayload,
} from '../types/multiplayer';
import { PEER_CONFIG, generateRoomCode, formatPeerId } from '../game/multiplayer/peerConfig';
import { useGameStore } from './gameStore';
import { peerManager } from './multiplayer/peerManager';
import { executeHostAction } from './multiplayer/actionHandlers';
import {
  handleHostIncomingMessage,
  handleGuestIncomingMessage,
} from './multiplayer/messageHandlers';

export interface MultiplayerStore {
  isOnlineMode: boolean;
  isGameStarted: boolean;
  role: MultiplayerRole | null;
  roomCode: string | null;
  myPlayerId: string | null;
  myPlayerName: string;
  players: OnlinePlayer[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string | null;
  isReconnecting: boolean;
  reconnectAttempt: number;

  createRoom: (hostName: string) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
  reconnect: () => Promise<void>;
  broadcastState: () => void;
  sendAction: (action: ClientActionPayload) => void;
  leaveRoom: () => void;
  clearError: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 3;

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  isOnlineMode: false,
  isGameStarted: false,
  role: null,
  roomCode: null,
  myPlayerId: null,
  myPlayerName: '',
  players: [],
  connectionStatus: 'disconnected',
  errorMessage: null,
  isReconnecting: false,
  reconnectAttempt: 0,

  createRoom: async (hostName: string) => {
    get().leaveRoom();
    peerManager.setManualLeave(false);

    // Reset local game state for clean online session
    useGameStore.setState({
      gameState: null,
      isCardFlipped: false,
      selectedPlayerIds: [],
      showThreeStarConsent: false,
    });

    const roomCode = generateRoomCode();
    const hostPeerId = formatPeerId(roomCode);
    const hostPlayerId = `player_host_${Date.now()}`;
    const name = hostName.trim() || '房主';

    set({
      isOnlineMode: true,
      isGameStarted: false,
      role: 'host',
      roomCode,
      myPlayerId: hostPlayerId,
      myPlayerName: name,
      connectionStatus: 'connecting',
      errorMessage: null,
      isReconnecting: false,
      reconnectAttempt: 0,
      players: [{ id: hostPlayerId, name, isHost: true, peerId: hostPeerId }],
    });

    try {
      const peer = new Peer(hostPeerId, PEER_CONFIG);
      peerManager.setPeer(peer);

      peer.on('open', () => {
        set({ connectionStatus: 'connected' });
      });

      peer.on('error', (err) => {
        console.error('[P2P Host Error]:', err);
        set({
          connectionStatus: 'error',
          errorMessage: `房間連線異常 (${err.type || '連線逾時'})。`,
        });
      });

      // Listen for guest connections
      peer.on('connection', (conn) => {
        peerManager.getHostConnections().set(conn.peer, conn);

        conn.on('data', (data) => {
          const message = data as PeerMessage;
          handleHostIncomingMessage(conn, message, {
            myPlayerId: get().myPlayerId,
            roomCode: get().roomCode,
            players: get().players,
            isGameStarted: get().isGameStarted,
            setPlayers: (players) => set({ players }),
            broadcastState: () => get().broadcastState(),
          });
        });

        conn.on('close', () => {
          peerManager.getHostConnections().delete(conn.peer);
          // Only remove players if game hasn't started yet; during active game, preserve slot for reconnection
          if (!get().isGameStarted) {
            const remaining = get().players.filter((p) => p.peerId !== conn.peer);
            set({ players: remaining });
            peerManager.broadcastToGuests({
              type: 'PLAYER_LIST_UPDATE',
              senderId: hostPlayerId,
              payload: { players: remaining },
            });
          }
        });
      });
    } catch (err: any) {
      set({ connectionStatus: 'error', errorMessage: err.message });
    }

    return roomCode;
  },

  joinRoom: async (code: string, playerName: string) => {
    get().leaveRoom();
    peerManager.setManualLeave(false);

    useGameStore.setState({
      gameState: null,
      isCardFlipped: false,
      selectedPlayerIds: [],
      showThreeStarConsent: false,
    });

    const sanitizedCode = code.trim().toUpperCase();
    const hostPeerId = formatPeerId(sanitizedCode);
    const guestPeerSuffix = Math.random().toString(36).substring(2, 7);
    const guestPeerId = formatPeerId(sanitizedCode, guestPeerSuffix);
    const name = playerName.trim() || '旅人';

    set({
      isOnlineMode: true,
      isGameStarted: false,
      role: 'guest',
      roomCode: sanitizedCode,
      myPlayerName: name,
      connectionStatus: 'connecting',
      errorMessage: null,
      isReconnecting: false,
      reconnectAttempt: 0,
      players: [],
    });

    return new Promise<void>((resolve, reject) => {
      try {
        const peer = new Peer(guestPeerId, PEER_CONFIG);
        peerManager.setPeer(peer);

        peer.on('open', () => {
          const conn = peer.connect(hostPeerId, { reliable: true });
          peerManager.setGuestConnection(conn);

          conn.on('open', () => {
            set({
              connectionStatus: 'connected',
              isReconnecting: false,
              reconnectAttempt: 0,
            });

            // Start heartbeat monitoring (ping every 3.5s, trigger reconnect if no response in 9s)
            peerManager.startHeartbeat(
              () => {
                peerManager.sendToHost({
                  type: 'PING',
                  senderId: guestPeerId,
                });
              },
              () => {
                scheduleAutoReconnect();
              }
            );

            // Send join request
            conn.send({
              type: 'JOIN_REQUEST',
              senderId: guestPeerId,
              payload: { playerName: name },
            } as PeerMessage);
          });

          conn.on('data', (data) => {
            const message = data as PeerMessage;
            handleGuestIncomingMessage(message, {
              onJoinSuccess: resolve,
              updateGuestState: (state) => set(state),
            });
          });

          conn.on('close', () => {
            peerManager.stopHeartbeat();
            if (!peerManager.getManualLeave()) {
              scheduleAutoReconnect();
            } else {
              set({
                connectionStatus: 'disconnected',
                errorMessage: '與房主的連線已中斷。房主可能已離開或關閉房間。',
              });
            }
          });

          conn.on('error', (err) => {
            console.error('[Guest Connection Error]:', err);
            peerManager.stopHeartbeat();
            if (!peerManager.getManualLeave() && get().isGameStarted) {
              scheduleAutoReconnect();
            } else {
              set({
                connectionStatus: 'error',
                errorMessage: '無法連線至該房間，請確認房間代碼是否正確。',
              });
              reject(err);
            }
          });
        });

        peer.on('error', (err) => {
          console.error('[P2P Guest Peer Error]:', err);
          peerManager.stopHeartbeat();
          if (!peerManager.getManualLeave() && get().isGameStarted) {
            scheduleAutoReconnect();
          } else {
            set({
              connectionStatus: 'error',
              errorMessage: '加入房間失敗，請確認代碼是否輸入正確。',
            });
            reject(err);
          }
        });
      } catch (err: any) {
        set({ connectionStatus: 'error', errorMessage: err.message });
        reject(err);
      }
    });
  },

  reconnect: async () => {
    const state = get();
    if (!state.isOnlineMode || state.role !== 'guest' || !state.roomCode) return;

    peerManager.clearReconnectTimer();

    set({
      connectionStatus: 'connecting',
      isReconnecting: true,
      reconnectAttempt: 1,
      errorMessage: '正在重新嘗試連線...',
    });

    performGuestReconnect();
  },

  broadcastState: () => {
    const role = get().role;
    if (role !== 'host') return;

    const gameStore = useGameStore.getState();
    const gameState = gameStore.gameState;
    if (!gameState) return;

    const payload: SyncStatePayload = {
      gameState,
      isCardFlipped: gameStore.isCardFlipped,
      selectedPlayerIds: gameStore.selectedPlayerIds,
      showThreeStarConsent: gameStore.showThreeStarConsent,
    };

    peerManager.broadcastToGuests({
      type: 'SYNC_STATE',
      senderId: get().myPlayerId || 'host',
      payload,
    });
  },

  sendAction: (actionPayload: ClientActionPayload) => {
    const { role, isOnlineMode } = get();
    if (!isOnlineMode) return;

    if (role === 'host') {
      executeHostAction(actionPayload);
      get().broadcastState();
    } else if (role === 'guest') {
      peerManager.sendToHost({
        type: 'CLIENT_ACTION',
        senderId: get().myPlayerId || '',
        payload: actionPayload,
      });
    }
  },

  leaveRoom: () => {
    peerManager.setManualLeave(true);
    peerManager.cleanup();

    set({
      isOnlineMode: false,
      isGameStarted: false,
      role: null,
      roomCode: null,
      myPlayerId: null,
      players: [],
      connectionStatus: 'disconnected',
      errorMessage: null,
      isReconnecting: false,
      reconnectAttempt: 0,
    });
  },

  clearError: () => set({ errorMessage: null }),
}));

function scheduleAutoReconnect() {
  if (peerManager.getManualLeave()) return;
  const state = useMultiplayerStore.getState();
  if (!state.isOnlineMode || state.role !== 'guest' || !state.roomCode) return;

  const nextAttempt = state.reconnectAttempt + 1;
  if (nextAttempt > MAX_RECONNECT_ATTEMPTS) {
    peerManager.stopHeartbeat();
    useMultiplayerStore.setState({
      connectionStatus: 'disconnected',
      isReconnecting: false,
      errorMessage: '與房主的連線已中斷。您可以點擊「手動重新連線」再試一次，或返回首頁。',
    });
    return;
  }

  useMultiplayerStore.setState({
    connectionStatus: 'connecting',
    isReconnecting: true,
    reconnectAttempt: nextAttempt,
    errorMessage: `連線中斷，正在自動重新連線（第 ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS} 次）...`,
  });

  const timer = setTimeout(() => {
    performGuestReconnect();
  }, nextAttempt * 1800);

  peerManager.setReconnectTimer(timer);
}

function performGuestReconnect() {
  if (peerManager.getManualLeave()) return;
  const state = useMultiplayerStore.getState();
  if (!state.isOnlineMode || state.role !== 'guest' || !state.roomCode) return;

  const sanitizedCode = state.roomCode;
  const hostPeerId = formatPeerId(sanitizedCode);
  const guestPeerSuffix = Math.random().toString(36).substring(2, 7);
  const guestPeerId = formatPeerId(sanitizedCode, guestPeerSuffix);

  try {
    const existingGuestConn = peerManager.getGuestConnection();
    if (existingGuestConn) {
      try {
        existingGuestConn.close();
      } catch {}
      peerManager.setGuestConnection(null);
    }

    const existingPeer = peerManager.getPeer();
    if (existingPeer) {
      try {
        existingPeer.destroy();
      } catch {}
      peerManager.setPeer(null);
    }

    const peer = new Peer(guestPeerId, PEER_CONFIG);
    peerManager.setPeer(peer);

    peer.on('open', () => {
      const conn = peer.connect(hostPeerId, { reliable: true });
      peerManager.setGuestConnection(conn);

      conn.on('open', () => {
        useMultiplayerStore.setState({
          connectionStatus: 'connected',
          isReconnecting: false,
          reconnectAttempt: 0,
          errorMessage: null,
        });

        // Resume heartbeat monitoring
        peerManager.startHeartbeat(
          () => {
            peerManager.sendToHost({
              type: 'PING',
              senderId: guestPeerId,
            });
          },
          () => {
            scheduleAutoReconnect();
          }
        );

        conn.send({
          type: 'RECONNECT_REQUEST',
          senderId: state.myPlayerId || guestPeerId,
          payload: {
            playerId: state.myPlayerId,
            playerName: state.myPlayerName,
          },
        } as PeerMessage);
      });

      conn.on('data', (data) => {
        handleGuestIncomingMessage(data as PeerMessage, {
          updateGuestState: (s) => useMultiplayerStore.setState(s),
        });
      });

      conn.on('close', () => {
        peerManager.stopHeartbeat();
        if (!peerManager.getManualLeave()) {
          scheduleAutoReconnect();
        }
      });

      conn.on('error', (err) => {
        console.error('[Reconnect Conn Error]:', err);
        peerManager.stopHeartbeat();
        if (!peerManager.getManualLeave()) {
          scheduleAutoReconnect();
        }
      });
    });

    peer.on('error', (err) => {
      console.error('[Reconnect Peer Error]:', err);
      peerManager.stopHeartbeat();
      if (!peerManager.getManualLeave()) {
        scheduleAutoReconnect();
      }
    });
  } catch (err) {
    console.error('[Reconnect Error]:', err);
    scheduleAutoReconnect();
  }
}
