export type CardLevel = 'icebreaker' | 'one-star' | 'two-star' | 'three-star';

export type InteractionType =
  | 'single'
  | 'all'
  | 'othersToDrawer'
  | 'chooseOne'
  | 'pair'
  | 'action'
  | 'discussion';

export type ResponderRule =
  | 'drawer'
  | 'all'
  | 'everyoneExceptDrawer'
  | 'drawerChooses'
  | 'selectedPlayers';

export type TargetRule =
  | 'none'
  | 'drawer'
  | 'chosenPlayer'
  | 'all';

export interface Card {
  id: string;
  level: CardLevel;
  stars: 0 | 1 | 2 | 3;
  zh: string;
  enTitle?: string;
  en?: string;
  interaction: InteractionType;
  responderRule: ResponderRule;
  targetRule: TargetRule;
  minPlayers?: number;
  needsReview?: boolean;
}
