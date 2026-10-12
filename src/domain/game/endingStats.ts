import { CardLevel } from '../../types/card';
import { GameState } from '../../types/game';
import { getCardById } from '../../data/decks';

const LEVEL_RANK: Record<CardLevel, number> = {
  icebreaker: 0,
  'one-star': 1,
  'two-star': 2,
  'three-star': 3,
};

/**
 * Computes the highest CardLevel actually revealed in the game
 * based on card metadata, never relying on fragile ID prefix checks.
 *
 * If no cards were revealed, returns null.
 */
export function getHighestRevealedLevel(
  gameState: GameState,
  getCard: (id: string) => { level: CardLevel } | null | undefined = getCardById
): CardLevel | null {
  const revealed = gameState.revealedCardIds ?? [];
  if (revealed.length === 0) {
    return null;
  }

  let highest: CardLevel | null = null;
  let highestRank = -1;

  for (const id of revealed) {
    const card = getCard(id);
    if (!card) continue;
    const rank = LEVEL_RANK[card.level];
    if (rank !== undefined && rank > highestRank) {
      highestRank = rank;
      highest = card.level;
    }
  }

  return highest;
}
