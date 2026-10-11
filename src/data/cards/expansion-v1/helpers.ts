import type { ConversationCard } from '../types';

type ExpansionCardInput = Omit<ConversationCard, 'packId' | 'needsReview'>;

export function expansionCard(card: ExpansionCardInput): ConversationCard {
  const status = card.reviewStatus ?? 'draft';
  return {
    ...card,
    packId: 'expansion-v1',
    reviewStatus: status,
    needsReview: status !== 'approved',
  };
}
