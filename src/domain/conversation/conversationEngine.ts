import type { ConversationCard, RelationshipTag } from '../../data/cards/types';
import { getCardById } from '../../data/cards/registry';

export interface ConversationPacingOptions {
  targetRelationship?: RelationshipTag;
  randomJitter?: number;
}

/**
 * Computes a suitability score for a candidate card given the recent conversation history.
 */
export function scoreCandidate(
  candidate: ConversationCard,
  recentHistory: ConversationCard[],
  options: ConversationPacingOptions = {}
): number {
  let score = 50;
  const lastCard = recentHistory[recentHistory.length - 1];
  const secondLastCard = recentHistory.length >= 2 ? recentHistory[recentHistory.length - 2] : null;

  if (lastCard) {
    // 1. Topic anti-clumping: Avoid consecutive questions about the same topic
    if (candidate.topic && lastCard.topic && candidate.topic === lastCard.topic) {
      score -= 35;
    }
    if (secondLastCard && candidate.topic && secondLastCard.topic && candidate.topic === secondLastCard.topic) {
      score -= 15;
    }

    // 2. Emotional Intensity Pacing: Heavy questions need breathing space
    const candidateIntensity = candidate.intensity || 2;
    const lastIntensity = lastCard.intensity || 2;

    if (lastIntensity >= 4 && candidateIntensity >= 4) {
      // Avoid stacking deep vulnerabilities back-to-back
      score -= 40;
    } else if (lastIntensity >= 4 && candidateIntensity <= 3) {
      // Reward grounding / relief after high vulnerability
      score += 25;
    }

    // 3. Interaction Diversity
    if (candidate.interaction === 'single' && lastCard.interaction === 'single') {
      score -= 15;
    } else if (
      candidate.interaction !== 'single' &&
      lastCard.interaction === 'single'
    ) {
      // Encourage interactive moments
      score += 20;
    } else if (
      candidate.interaction !== 'single' &&
      lastCard.interaction !== 'single'
    ) {
      // Don't overwhelm with consecutive group tasks
      score -= 10;
    }

    // 4. Sensitivity Spacing: Avoid clustering sensitive themes (conflict, grief, etc.)
    if (
      candidate.sensitivity &&
      candidate.sensitivity.length > 0 &&
      lastCard.sensitivity &&
      lastCard.sensitivity.length > 0
    ) {
      score -= 45;
    }

    // 5. Emotional Tone Variety
    if (candidate.emotionalTone && lastCard.emotionalTone && candidate.emotionalTone === lastCard.emotionalTone) {
      score -= 10;
    }
  }

  // 6. Relationship Context Alignment
  if (options.targetRelationship && candidate.relationshipTags) {
    if (candidate.relationshipTags.includes(options.targetRelationship)) {
      score += 30;
    }
  }

  // 7. Random Jitter: Introduces organic variation while maintaining pacing curves
  const jitterFactor = options.randomJitter !== undefined ? options.randomJitter : 25;
  if (jitterFactor > 0) {
    score += Math.random() * jitterFactor;
  }

  return score;
}

/**
 * Intelligent Conversation Pacing Engine (V1)
 *
 * Sequences card deck candidates into a psychologically safe, emotionally resonant,
 * and conversational arc while preserving 100% of available cards in the pool.
 */
export function paceDeckCards(
  cards: readonly ConversationCard[],
  options: ConversationPacingOptions = {}
): ConversationCard[] {
  if (cards.length <= 1) {
    return [...cards];
  }

  const remaining = [...cards];
  const ordered: ConversationCard[] = [];

  // Step 1: Select a gentle opening card
  // Prefer intensity <= 3, light/warm tone, non-sensitive
  const starterCandidates = remaining.filter((c) => {
    const isGentle = (c.intensity || 2) <= 3;
    const isNonSensitive = !c.sensitivity || c.sensitivity.length === 0;
    return isGentle && isNonSensitive;
  });

  const firstCardPool = starterCandidates.length > 0 ? starterCandidates : remaining;
  let bestStarterScore = -Infinity;
  let bestStarterIndex = 0;

  for (let i = 0; i < firstCardPool.length; i++) {
    const score = scoreCandidate(firstCardPool[i], [], options);
    if (score > bestStarterScore) {
      bestStarterScore = score;
      bestStarterIndex = i;
    }
  }

  const firstCard = firstCardPool[bestStarterIndex];

  ordered.push(firstCard);
  const remainingIndex = remaining.findIndex((c) => c.id === firstCard.id);
  remaining.splice(remainingIndex, 1);

  // Step 2: Greedily place remaining cards according to pacing heuristics
  while (remaining.length > 0) {
    let bestScore = -Infinity;
    let bestIndex = 0;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const score = scoreCandidate(candidate, ordered, options);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    ordered.push(remaining[bestIndex]);
    remaining.splice(bestIndex, 1);
  }

  return ordered;
}

/**
 * Creates a DeckState whose card IDs are sequenced by the Conversation Engine.
 */
export function createPacedDeck(
  cards: readonly ConversationCard[],
  options: ConversationPacingOptions = {}
): {
  shuffledIds: string[];
  cursor: number;
  usedIds: string[];
} {
  const paced = paceDeckCards(cards, options);
  return {
    shuffledIds: paced.map((c) => c.id),
    cursor: 0,
    usedIds: [],
  };
}

export interface AdaptiveSelectionContext {
  historyCardIds?: string[];
  justSkippedCardId?: string;
  skippedCardIds?: string[];
  followUpOpenedCardIds?: string[];
  targetRelationship?: RelationshipTag;
  randomJitter?: number;
  windowSize?: number;
}

/**
 * Computes adaptive score for candidate card based on real conversation signals
 * (skips, follow-ups opened, relationship context, anti-clumping).
 */
export function scoreCandidateAdaptive(
  candidate: ConversationCard,
  context: AdaptiveSelectionContext = {}
): number {
  const historyCards: ConversationCard[] = (context.historyCardIds || [])
    .map((id) => getCardById(id))
    .filter((c): c is ConversationCard => !!c);

  // 1. Base pacing score from conversation history (without jitter yet)
  let score = scoreCandidate(candidate, historyCards, {
    targetRelationship: context.targetRelationship,
    randomJitter: 0,
  });

  // 2. Skip Signal (Negative Feedback / Psychological Safety Back-off)
  if (context.justSkippedCardId) {
    const skippedCard = getCardById(context.justSkippedCardId);
    if (skippedCard) {
      // Same topic penalty: player didn't want to discuss this topic right now
      if (candidate.topic && skippedCard.topic && candidate.topic === skippedCard.topic) {
        score -= 40;
      }

      // Shared sensitivity tag penalty: player retreated from this sensitive theme
      if (candidate.sensitivity && skippedCard.sensitivity) {
        const hasSharedSensitivity = candidate.sensitivity.some((tag) =>
          skippedCard.sensitivity?.includes(tag)
        );
        if (hasSharedSensitivity) {
          score -= 50;
        }
      }

      // High intensity penalty after skip: back off to gentler questions
      if ((candidate.intensity || 2) >= 4) {
        score -= 35;
      } else if ((candidate.intensity || 2) <= 2) {
        score += 20;
      }
    }
  }

  // 3. Follow-Up Signal (Positive Feedback / Emotional Deepening Willingness)
  const lastHistoryCardId =
    context.historyCardIds && context.historyCardIds.length > 0
      ? context.historyCardIds[context.historyCardIds.length - 1]
      : null;

  const didOpenFollowUpOnLastCard =
    Boolean(lastHistoryCardId &&
    context.followUpOpenedCardIds &&
    context.followUpOpenedCardIds.includes(lastHistoryCardId));

  if (didOpenFollowUpOnLastCard) {
    const candidateIntensity = candidate.intensity || 2;
    // Players are engaged and invested in deep connection
    if (candidateIntensity >= 3) {
      score += 20;
    } else if (candidateIntensity <= 1) {
      // Don't suddenly collapse to superficial trivia
      score -= 15;
    }
  }

  // 4. Random Jitter
  const jitterFactor = context.randomJitter !== undefined ? context.randomJitter : 25;
  if (jitterFactor > 0) {
    score += Math.random() * jitterFactor;
  }

  return score;
}

/**
 * Dynamically selects the next best adaptive card from remaining candidates in deck
 * using a windowed evaluation pool to balance optimal conversational arc with organic surprise.
 */
export function selectNextAdaptiveCard(
  candidateIds: string[],
  context: AdaptiveSelectionContext = {}
): string | null {
  if (candidateIds.length === 0) return null;
  if (candidateIds.length === 1) return candidateIds[0];

  // Window sampling (e.g. 8-12 cards) prevents exhaustive rigidity while strongly favoring best fit
  const windowSize = Math.max(3, Math.min(candidateIds.length, context.windowSize || 10));
  const pool = candidateIds.slice(0, windowSize);

  let bestScore = -Infinity;
  let bestCardId = pool[0];

  for (const cardId of pool) {
    const card = getCardById(cardId);
    if (!card) continue;

    const score = scoreCandidateAdaptive(card, context);
    if (score > bestScore) {
      bestScore = score;
      bestCardId = cardId;
    }
  }

  return bestCardId;
}
