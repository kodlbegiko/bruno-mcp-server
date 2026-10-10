import type { ConversationCard } from '../types';

type ExpansionCardInput = Omit<ConversationCard, 'packId' | 'needsReview'>;

export function expansionCard(card: ExpansionCardInput): ConversationCard {
  return {
    ...card,
    packId: 'expansion-v1',
    needsReview: false,
    reviewStatus: 'approved',
  };
}
