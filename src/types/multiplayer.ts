import { GameState } from './game';
import { CardLevel } from './card';

export type MultiplayerRole = 'host' | 'guest';

export interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  peerId: string;
  isReady?: boolean;
  reconnectToken?: string;
  connectionStatus?: 'connected' | 'reconnecting' | 'disconnected';
}

export type PeerMessageType =
  | 'JOIN_REQUEST'
  | 'JOIN_ACCEPTED'
  | 'JOIN_REJECTED'
  | 'RECONNECT_REQUEST'
  | 'RECONNECT_REJECTED'
  | 'PLAYER_LIST_UPDATE'
  | 'GAME_START'
  | 'SYNC_STATE'
  | 'CLIENT_ACTION'
  | 'SESSION_RESET'
  | 'ROOM_CLOSED'
  | 'PING'
  | 'PONG';

export type ClientActionType =
  | 'FLIP_CARD'
  | 'DRAW_NEXT_CARD'
  | 'SKIP_CARD'
  | 'CHANGE_LEVEL'
  | 'CONFIRM_THREE_STAR'
  | 'CANCEL_THREE_STAR'
  | 'SELECT_PLAYER'
  | 'OPEN_FOLLOW_UP'
  | 'TOGGLE_FOLLOW_UP'
  | 'END_GAME'
  | 'RESET_GAME';

export interface ClientActionPayload {
  action: ClientActionType;
  level?: CardLevel;
  targetPlayerId?: string;
  playerId?: string;
  cardId?: string;
}

export interface PeerMessage {
  type: PeerMessageType;
  senderId: string;
  payload?: any;
}

export interface JoinRequestPayload {
  playerName: string;
}

export interface ReconnectRequestPayload {
  playerId: string;
  reconnectToken?: string;
  playerName?: string;
}

export interface ThreeStarConsentState {
  status: 'pending' | 'accepted' | 'declined';
  requiredPlayerIds: string[];
  acceptedPlayerIds: string[];
  declinedPlayerIds: string[];
}

export interface JoinAcceptedPayload {
  myPlayerId: string;
  reconnectToken?: string;
  roomCode: string;
  players: OnlinePlayer[];
  gameState?: GameState | null;
  isCardFlipped?: boolean;
  selectedPlayerIds?: string[];
  showThreeStarConsent?: boolean;
  threeStarConsent?: ThreeStarConsentState | null;
}

export interface SyncStatePayload {
  gameState: GameState;
  isCardFlipped: boolean;
  selectedPlayerIds: string[];
  showThreeStarConsent?: boolean;
  threeStarConsent?: ThreeStarConsentState | null;
}
