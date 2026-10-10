import { expansionIcebreakerCards } from './icebreaker';
import { expansionOneStarCards } from './oneStar';
import { expansionTwoStarCards } from './twoStar';
import { expansionThreeStarCards } from './threeStar';

export {
  expansionIcebreakerCards,
  expansionOneStarCards,
  expansionTwoStarCards,
  expansionThreeStarCards,
};

export const expansionV1Cards = [
  ...expansionIcebreakerCards,
  ...expansionOneStarCards,
  ...expansionTwoStarCards,
  ...expansionThreeStarCards,
];
