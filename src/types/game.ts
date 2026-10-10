import { CardLevel } from './card';
import { Player } from './player';
import { QuestionSetId } from '../domain/questions/questionSets';

export type GameMode = 'guided' | 'free';

export type SessionGoalMinutes = 15 | 30 | 60 | 90 | null;

export interface DeckState {
  shuffledIds: string[];
  cursor: number;
  usedIds: string[];
}

export interface GameState {
  version: number;
  gameId: string;
  players: Player[];
  mode: GameMode;
  questionSetId?: QuestionSetId;
  sessionGoalMinutes: SessionGoalMinutes;
  startedAt: number;
  currentLevel: CardLevel;
  drawerIndex: number;
  currentCardId: string | null;
  currentSelection?: {
    selectedPlayerIds: string[];
  };
  decks: {
    icebreaker: DeckState;
    'one-star': DeckState;
    'two-star': DeckState;
    'three-star': DeckState;
  };
  threeStarConsentSeen: boolean;
  cardsDrawnCount: number;
  historyCardIds?: string[];
  revealedCardIds?: string[];
  status: 'playing' | 'ended';
  endedAt?: number;
}

export interface ResolvedInteraction {
  drawer: Player;
  responders: Player[];
  targets: Player[];
  needsPlayerSelection: boolean;
  selectionCount: number;
  instruction: string;
}
