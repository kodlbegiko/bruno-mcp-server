import { CardLevel } from '../../data/cards/types';
import { GameState } from '../../types/game';
import { getCardById } from '../../data/decks';

/**
 * Counts cards that were actually engaged with (revealed and not skipped)
 * for a specific level.
 *
 * This prevents skipped cards from prematurely triggering Guided Journey
 * progression prompts.
 */
export function countEngagedCardsInLevel(
  gameState: GameState,
  level: CardLevel,
  getCard: (id: string) => { level: CardLevel } | null | undefined = getCardById
): number {
  const revealed = gameState.revealedCardIds ?? [];
  const skipped = new Set(gameState.skippedCardIds ?? []);

  return revealed.filter((id) => {
    if (skipped.has(id)) return false;
    const card = getCard(id);
    return card?.level === level;
  }).length;
}
