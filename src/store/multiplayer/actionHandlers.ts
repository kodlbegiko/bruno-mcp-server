import { ClientActionPayload } from '../../types/multiplayer';
import { useGameStore } from '../gameStore';

/**
 * Execute client actions locally on the authoritative host.
 */
export function executeHostAction(actionPayload: ClientActionPayload): void {
  const game = useGameStore.getState();

  switch (actionPayload.action) {
    case 'FLIP_CARD':
      game.flipCard();
      break;
    case 'DRAW_NEXT_CARD':
      game.drawNextCard();
      break;
    case 'SKIP_CARD':
      game.skipCard();
      break;
    case 'CHANGE_LEVEL':
      if (actionPayload.level) {
        game.changeLevel(actionPayload.level);
      }
      break;
    case 'CONFIRM_THREE_STAR':
      game.confirmThreeStarConsent();
      break;
    case 'CANCEL_THREE_STAR':
      game.cancelThreeStarConsent();
      break;
    case 'SELECT_PLAYER':
      if (actionPayload.playerId) {
        game.selectPlayer(actionPayload.playerId);
      }
      break;
    case 'END_GAME':
      game.endGame();
      break;
    case 'RESET_GAME':
      game.resetGame();
      break;
    default:
      console.warn('[executeHostAction] Unhandled action:', (actionPayload as any).action);
  }
}
