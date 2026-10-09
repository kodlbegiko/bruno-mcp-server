import { GameState } from './game';
import { CardLevel } from './card';

export type MultiplayerRole = 'host' | 'guest';

export interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  peerId: string;
  isReady?: boolean;
}

export type PeerMessageType =
  | 'JOIN_REQUEST'
  | 'JOIN_ACCEPTED'
  | 'JOIN_REJECTED'
  | 'RECONNECT_REQUEST'
  | 'PLAYER_LIST_UPDATE'
  | 'GAME_START'
  | 'SYNC_STATE'
  | 'CLIENT_ACTION'
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
  | 'END_GAME'
  | 'RESET_GAME';

export interface ClientActionPayload {
  action: ClientActionType;
  level?: CardLevel;
  playerId?: string;
}

export interface PeerMessage {
  type: PeerMessageType;
  senderId: string;
  payload?: any;
}

export interface JoinRequestPayload {
  playerName: string;
}

export interface ThreeStarConsentState {
  status: 'pending' | 'accepted' | 'declined';
  requiredPlayerIds: string[];
  acceptedPlayerIds: string[];
  declinedPlayerIds: string[];
}

export interface JoinAcceptedPayload {
  myPlayerId: string;
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
