import { ClientActionPayload, ThreeStarConsentState } from '../../types/multiplayer';
import { useGameStore } from '../gameStore';
import { useMultiplayerStore } from '../multiplayerStore';
import { peerManager } from './peerManager';

export interface HostActionContext {
  actorPlayerId: string;
  isHost: boolean;
}

/**
 * Execute client actions locally on the authoritative host.
 * Actor identity is strictly derived from the verified network connection context.
 */
export function executeHostAction(
  actionPayload: ClientActionPayload,
  ctx?: HostActionContext
): void {
  const game = useGameStore.getState();
  const mp = useMultiplayerStore.getState();
  const actorPlayerId = ctx?.actorPlayerId || actionPayload.playerId || mp.myPlayerId || '';

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
        if (actionPayload.level === 'three-star' && !game.gameState?.threeStarConsentSeen) {
          // In multiplayer, initiate unanimous consent across all active connected players
          const activePlayers = mp.players.filter(
            (p) => p.connectionStatus !== 'disconnected'
          );
          const allPlayerIds = (activePlayers.length > 0 ? activePlayers : mp.players).map(
            (p) => p.id
          );
          const initialConsent: ThreeStarConsentState = {
            status: 'pending',
            requiredPlayerIds: allPlayerIds,
            acceptedPlayerIds: [],
            declinedPlayerIds: [],
          };
          useMultiplayerStore.setState({ threeStarConsent: initialConsent });
          useGameStore.setState({
            showThreeStarConsent: true,
            pendingStage: 'three-star',
          });
        } else {
          game.changeLevel(actionPayload.level);
        }
      }
      break;
    case 'CONFIRM_THREE_STAR': {
      const consent = useMultiplayerStore.getState().threeStarConsent;
      // Actor identity is strictly derived from verified connection
      const voterId = actorPlayerId;
      if (consent && consent.status === 'pending' && voterId) {
        const updatedAccepted = consent.acceptedPlayerIds.includes(voterId)
          ? consent.acceptedPlayerIds
          : [...consent.acceptedPlayerIds, voterId];

        // Check if all required active players accepted
        const allAccepted =
          consent.requiredPlayerIds.length > 0 &&
          consent.requiredPlayerIds.every((id: string) => updatedAccepted.includes(id));

        if (allAccepted) {
          useMultiplayerStore.setState({
            threeStarConsent: {
              ...consent,
              status: 'accepted',
              acceptedPlayerIds: updatedAccepted,
            },
          });
          game.confirmThreeStarConsent();
          useMultiplayerStore.setState({ threeStarConsent: null });
        } else {
          useMultiplayerStore.setState({
            threeStarConsent: {
              ...consent,
              acceptedPlayerIds: updatedAccepted,
            },
          });
        }
      } else {
        // Fallback for single-device or already confirmed
        game.confirmThreeStarConsent();
      }
      break;
    }
    case 'CANCEL_THREE_STAR': {
      const consent = useMultiplayerStore.getState().threeStarConsent;
      const voterId = actorPlayerId;
      if (consent && consent.status === 'pending') {
        const updatedDeclined = voterId
          ? [...consent.declinedPlayerIds, voterId]
          : consent.declinedPlayerIds;
        useMultiplayerStore.setState({
          threeStarConsent: {
            ...consent,
            status: 'declined',
            declinedPlayerIds: updatedDeclined,
          },
        });
      }
      // Authoritatively cancel three star consent and remain in two-star
      game.cancelThreeStarConsent();
      useMultiplayerStore.setState({ threeStarConsent: null });
      break;
    }
    case 'SELECT_PLAYER': {
      const targetId = actionPayload.targetPlayerId || actionPayload.playerId;
      if (targetId) {
        game.selectPlayer(targetId);
      }
      break;
    }
    case 'OPEN_FOLLOW_UP':
      game.openFollowUp();
      break;
    case 'CLOSE_FOLLOW_UP':
      game.closeFollowUp();
      break;
    case 'TOGGLE_FOLLOW_UP': {
      if (game.gameState?.activeFollowUpCardId) {
        game.closeFollowUp();
      } else {
        game.openFollowUp();
      }
      break;
    }
    case 'END_GAME':
      game.endGame();
      break;
    case 'RESET_GAME':
      peerManager.broadcastToGuests({
        type: 'SESSION_RESET',
        senderId: mp.myPlayerId || 'host',
      });
      game.resetGame();
      break;
    default:
      console.warn('[executeHostAction] Unhandled action:', (actionPayload as any).action);
  }
}
