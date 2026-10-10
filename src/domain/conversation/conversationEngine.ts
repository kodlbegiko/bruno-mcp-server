import type { ConversationCard, RelationshipTag } from '../../data/cards/types';

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
  const firstIndex = Math.floor(Math.random() * firstCardPool.length);
  const firstCard = firstCardPool[firstIndex];

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
