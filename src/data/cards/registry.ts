import type {
  CardPackId,
  ConversationCard,
} from './types';

import { originalCards } from './original';
import { expansionV1Cards } from './expansion-v1';

export interface CardPack {
  id: CardPackId;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
  version: number;
  cards: ConversationCard[];
}

export const CARD_PACKS: Record<CardPackId, CardPack> = {
  original: {
    id: 'original',
    nameZh: '經典版',
    nameEn: 'Classic',
    descriptionZh: '原版 70 張完整題庫',
    descriptionEn: 'The original 70-card deck',
    version: 1,
    cards: originalCards,
  },
  'expansion-v1': {
    id: 'expansion-v1',
    nameZh: '深度擴充 I',
    nameEn: 'Deep Connection I',
    descriptionZh: '加入更多互動、信任、界線、理解與關係題目',
    descriptionEn: 'More interaction, trust, boundaries, understanding and connection',
    version: 1,
    cards: expansionV1Cards,
  },
};

export function getAllCards(): ConversationCard[] {
  return Object.values(CARD_PACKS).flatMap((pack) => pack.cards);
}

// O(1) indexed lookup map
const cardsMap = new Map<string, ConversationCard>();
function getCardsMap(): Map<string, ConversationCard> {
  if (cardsMap.size === 0) {
    for (const card of getAllCards()) {
      cardsMap.set(card.id, card);
    }
  }
  return cardsMap;
}

export function getCardById(id: string): ConversationCard | undefined {
  return getCardsMap().get(id);
}
