import type { CardPackId, CardLevel } from '../../data/cards/types';

export type QuestionSetId =
  | 'classic'
  | 'full'
  | 'expansion-only';

export interface QuestionSetDefinition {
  id: QuestionSetId;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
  packIds: CardPackId[];
  recommended?: boolean;
}

export const QUESTION_SETS: Record<QuestionSetId, QuestionSetDefinition> = {
  full: {
    id: 'full',
    nameZh: '完整版',
    nameEn: 'Full Collection',
    descriptionZh: '原版 70 題 ＋ 深度擴充 60 題（共 130 題）',
    descriptionEn: 'Original 70 cards + Deep Expansion 60 cards (130 total)',
    packIds: ['original', 'expansion-v1'],
    recommended: true,
  },
  classic: {
    id: 'classic',
    nameZh: '經典版',
    nameEn: 'Classic Edition',
    descriptionZh: '完整保留原版 70 張核心題目',
    descriptionEn: 'The authentic original 70-card deck',
    packIds: ['original'],
  },
  'expansion-only': {
    id: 'expansion-only',
    nameZh: '只玩新題目',
    nameEn: 'Expansion Only',
    descriptionZh: '只抽深度擴充題庫（共 60 題）',
    descriptionEn: 'Experience the 60 new expansion questions only',
    packIds: ['expansion-v1'],
  },
};

export function getQuestionSetLevelCounts(questionSetId: QuestionSetId = 'full'): Record<CardLevel, number> {
  // Direct pack definitions to avoid circular dependencies
  let icebreaker = 0;
  let oneStar = 0;
  let twoStar = 0;
  let threeStar = 0;

  const definition = QUESTION_SETS[questionSetId] || QUESTION_SETS.full;
  if (definition.packIds.includes('original')) {
    icebreaker += 10;
    oneStar += 20;
    twoStar += 20;
    threeStar += 20;
  }
  if (definition.packIds.includes('expansion-v1')) {
    icebreaker += 15;
    oneStar += 15;
    twoStar += 15;
    threeStar += 15;
  }

  return {
    icebreaker,
    'one-star': oneStar,
    'two-star': twoStar,
    'three-star': threeStar,
  };
}

export function getQuestionSetTotalCount(questionSetId: QuestionSetId = 'full'): number {
  const counts = getQuestionSetLevelCounts(questionSetId);
  return counts.icebreaker + counts['one-star'] + counts['two-star'] + counts['three-star'];
}
