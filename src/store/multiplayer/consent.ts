import { OnlinePlayer, ThreeStarConsentState } from '../../types/multiplayer';

/**
 * Returns active players eligible for voting (not disconnected).
 */
export function getConsentEligiblePlayerIds(players: OnlinePlayer[]): string[] {
  return players
    .filter((p) => p.connectionStatus !== 'disconnected')
    .map((p) => p.id);
}

/**
 * Reconciles three-star consent state when player connectivity changes.
 * Prunes disconnected players from requiredPlayerIds so the voting is not blocked.
 */
export function reconcileThreeStarConsent(
  consent: ThreeStarConsentState | null,
  activePlayerIds: string[]
): ThreeStarConsentState | null {
  if (!consent || consent.status !== 'pending') return consent;

  const filteredRequired = consent.requiredPlayerIds.filter((id) =>
    activePlayerIds.includes(id)
  );

  if (filteredRequired.length === 0) {
    return null;
  }

  const allAccepted = filteredRequired.every((id) =>
    consent.acceptedPlayerIds.includes(id)
  );

  if (allAccepted) {
    return {
      ...consent,
      status: 'accepted',
      requiredPlayerIds: filteredRequired,
    };
  }

  return {
    ...consent,
    requiredPlayerIds: filteredRequired,
  };
}
