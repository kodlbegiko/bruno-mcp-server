import { CARD_PACKS } from '../../data/cards/registry';
import type {
  CardLevel,
  ConversationCard,
} from '../../data/cards/types';
import {
  QUESTION_SETS,
  type QuestionSetId,
} from './questionSets';

export interface QuestionPool {
  'icebreaker': ConversationCard[];
  'one-star': ConversationCard[];
  'two-star': ConversationCard[];
  'three-star': ConversationCard[];
}

export function buildQuestionPool({
  questionSetId = 'full',
  playerCount = 2,
}: {
  questionSetId?: QuestionSetId;
  playerCount?: number;
}): QuestionPool {
  const definition = QUESTION_SETS[questionSetId] || QUESTION_SETS.full;

  const allCards = definition.packIds.flatMap(
    (packId) => CARD_PACKS[packId]?.cards || []
  );

  /**
   * 玩家人數適配：過濾掉需要比目前玩家數更多人的題目
   */
  const eligible = allCards.filter((card) => {
    if (!card.minPlayers) {
      return true;
    }
    return playerCount >= card.minPlayers;
  });

  const groupByLevel = (level: CardLevel) =>
    eligible.filter((card) => card.level === level);

  return {
    'icebreaker': groupByLevel('icebreaker'),
    'one-star': groupByLevel('one-star'),
    'two-star': groupByLevel('two-star'),
    'three-star': groupByLevel('three-star'),
  };
}
