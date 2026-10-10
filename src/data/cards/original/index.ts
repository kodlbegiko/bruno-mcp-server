import { icebreakerCards } from './icebreaker';
import { oneStarCards } from './oneStar';
import { twoStarCards } from './twoStar';
import { threeStarCards } from './threeStar';

export { icebreakerCards, oneStarCards, twoStarCards, threeStarCards };

export const originalCards = [
  ...icebreakerCards,
  ...oneStarCards,
  ...twoStarCards,
  ...threeStarCards,
];
