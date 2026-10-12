export type CardLevel =
  | 'icebreaker'
  | 'one-star'
  | 'two-star'
  | 'three-star';

export type CardInteraction =
  | 'single'
  | 'all'
  | 'othersToDrawer'
  | 'chooseOne'
  | 'pair'
  | 'action'
  | 'discussion';

export type CardPackId =
  | 'original'
  | 'expansion-v1';

export type CardTopic =
  | 'daily-life'
  | 'preferences'
  | 'identity'
  | 'memories'
  | 'emotion'
  | 'relationships'
  | 'perception'
  | 'family'
  | 'belonging'
  | 'values'
  | 'trust'
  | 'boundaries'
  | 'conflict'
  | 'repair'
  | 'growth'
  | 'future'
  | 'meaning'
  | 'support'
  | 'authenticity';

export type EmotionalTone =
  | 'light'
  | 'warm'
  | 'reflective'
  | 'vulnerable'
  | 'heavy';

export type RelationshipTag =
  | 'new-friends'
  | 'friends'
  | 'dating'
  | 'couples'
  | 'family'
  | 'group';

export type SensitivityTag =
  | 'family'
  | 'grief'
  | 'romance'
  | 'conflict'
  | 'loneliness'
  | 'physical-touch'
  | 'money'
  | 'body'
  | 'loss'
  | 'public-sharing';

export type RelationshipFitScore = 0 | 1 | 2 | 3;

export interface RelationshipFit {
  'new-friends'?: RelationshipFitScore;
  'friends'?: RelationshipFitScore;
  'dating'?: RelationshipFitScore;
  'couples'?: RelationshipFitScore;
  'family'?: RelationshipFitScore;
  'group'?: RelationshipFitScore;
}

export interface CardFollowUp {
  zh: string;
  en: string;
}

export type ResponderRule =
  | 'drawer'
  | 'all'
  | 'everyoneExceptDrawer'
  | 'drawerChooses'
  | 'selectedPlayers'
  | 'selectedPlayer';

export type TargetRule =
  | 'none'
  | 'drawer'
  | 'chosenPlayer'
  | 'all';

export type ContentReviewStatus = 'draft' | 'content-reviewed' | 'approved';

export interface ConversationCard {
  id: string;

  level: CardLevel;

  zh: string;
  en?: string;

  interaction: CardInteraction;

  minPlayers?: number;

  packId?: CardPackId;

  topic?: CardTopic;

  /**
   * 1 = 幾乎沒有心理負荷
   * 5 = 高度脆弱／深入
   */
  intensity?: 1 | 2 | 3 | 4 | 5;

  emotionalTone?: EmotionalTone;

  relationshipTags?: RelationshipTag[];

  relationshipFit?: RelationshipFit;

  sensitivity?: SensitivityTag[];

  followUp?: CardFollowUp;

  /**
   * 題目審核進度狀態
   */
  reviewStatus?: ContentReviewStatus;

  /**
   * 原版卡人工核對或 Expansion 審核狀態
   */
  needsReview?: boolean;

  /**
   * 舊版相容欄位
   */
  stars?: 0 | 1 | 2 | 3;
  enTitle?: string;
  responderRule?: ResponderRule;
  targetRule?: TargetRule;
}
