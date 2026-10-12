import {
  CardInteraction,
  CardLevel,
  CardTopic,
  ContentReviewStatus,
  ConversationCard,
  EmotionalTone,
  RelationshipTag,
  SensitivityTag,
} from './types';

export const VALID_LEVELS: ReadonlySet<CardLevel> = new Set([
  'icebreaker',
  'one-star',
  'two-star',
  'three-star',
]);

export const VALID_INTERACTIONS: ReadonlySet<CardInteraction> = new Set([
  'single',
  'all',
  'othersToDrawer',
  'chooseOne',
  'pair',
  'action',
  'discussion',
]);

export const VALID_TOPICS: ReadonlySet<CardTopic> = new Set([
  'daily-life',
  'preferences',
  'identity',
  'memories',
  'emotion',
  'relationships',
  'perception',
  'family',
  'belonging',
  'values',
  'trust',
  'boundaries',
  'conflict',
  'repair',
  'growth',
  'future',
  'meaning',
  'support',
  'authenticity',
]);

export const VALID_TONES: ReadonlySet<EmotionalTone> = new Set([
  'light',
  'warm',
  'reflective',
  'vulnerable',
  'heavy',
]);

export const VALID_RELATIONSHIP_TAGS: ReadonlySet<RelationshipTag> = new Set([
  'new-friends',
  'friends',
  'dating',
  'couples',
  'family',
  'group',
]);

export const VALID_SENSITIVITY_TAGS: ReadonlySet<SensitivityTag> = new Set([
  'family',
  'grief',
  'romance',
  'conflict',
  'loneliness',
  'physical-touch',
  'money',
  'body',
  'loss',
  'public-sharing',
]);

export const VALID_REVIEW_STATUSES: ReadonlySet<ContentReviewStatus> = new Set([
  'draft',
  'content-reviewed',
  'approved',
]);

export interface ValidationReport {
  valid: boolean;
  total: number;
  errors: string[];
  warnings: string[];
  levelBreakdown: Record<CardLevel, number>;
}

export interface ValidateCardOptions {
  production?: boolean;
}

export function validateCard(
  card: ConversationCard,
  options: ValidateCardOptions = { production: true }
): string[] {
  const errors: string[] = [];
  const isProduction = options.production !== false;

  if (!card.id || typeof card.id !== 'string') {
    errors.push(`Card missing valid id: ${JSON.stringify(card)}`);
  }

  if (!VALID_LEVELS.has(card.level)) {
    errors.push(`[${card.id}] Invalid card level: "${card.level}"`);
  }

  if (!card.zh || typeof card.zh !== 'string' || card.zh.trim().length === 0) {
    errors.push(`[${card.id}] Missing or empty zh text`);
  }

  if (!VALID_INTERACTIONS.has(card.interaction)) {
    errors.push(`[${card.id}] Invalid interaction type: "${card.interaction}"`);
  }

  // Production Gate: reviewStatus MUST be 'approved'
  if (isProduction) {
    if (card.reviewStatus !== 'approved') {
      errors.push(
        `[${card.id}] Card is not approved for production release: status is "${card.reviewStatus ?? 'missing'}"`
      );
    }

    if (card.needsReview === true) {
      errors.push(`[${card.id}] Card is still marked needsReview: true`);
    }

    // Production cards require complete metadata
    if (!card.en || typeof card.en !== 'string' || card.en.trim().length === 0) {
      errors.push(`[${card.id}] Missing or empty en text for production release`);
    }

    if (!card.topic || !VALID_TOPICS.has(card.topic)) {
      errors.push(`[${card.id}] Missing or invalid topic for production release: "${card.topic}"`);
    }

    if (!card.emotionalTone || !VALID_TONES.has(card.emotionalTone)) {
      errors.push(
        `[${card.id}] Missing or invalid emotionalTone for production release: "${card.emotionalTone}"`
      );
    }

    if (
      card.intensity === undefined ||
      !Number.isInteger(card.intensity) ||
      card.intensity < 1 ||
      card.intensity > 5
    ) {
      errors.push(
        card.intensity === undefined
          ? `[${card.id}] Missing intensity for production release`
          : `[${card.id}] Invalid intensity for production release: ${card.intensity} (must be integer 1-5)`
      );
    }

    if (!card.relationshipTags || card.relationshipTags.length === 0) {
      errors.push(`[${card.id}] Missing relationshipTags for production release`);
    }

    if (!card.packId || (card.packId !== 'original' && card.packId !== 'expansion-v1')) {
      errors.push(`[${card.id}] Missing or invalid packId for production release: "${card.packId}"`);
    }
  } else {
    // Non-production draft checks
    if (card.topic && !VALID_TOPICS.has(card.topic)) {
      errors.push(`[${card.id}] Invalid topic: "${card.topic}"`);
    }

    if (card.emotionalTone && !VALID_TONES.has(card.emotionalTone)) {
      errors.push(`[${card.id}] Invalid emotionalTone: "${card.emotionalTone}"`);
    }

    if (card.intensity !== undefined) {
      if (!Number.isInteger(card.intensity) || card.intensity < 1 || card.intensity > 5) {
        errors.push(`[${card.id}] Invalid intensity: ${card.intensity} (must be integer 1-5)`);
      }
    }

    if (card.reviewStatus && !VALID_REVIEW_STATUSES.has(card.reviewStatus)) {
      errors.push(`[${card.id}] Invalid reviewStatus: "${card.reviewStatus}"`);
    }
  }

  if (card.relationshipTags) {
    for (const tag of card.relationshipTags) {
      if (!VALID_RELATIONSHIP_TAGS.has(tag)) {
        errors.push(`[${card.id}] Invalid relationship tag: "${tag}"`);
      }
    }
  }

  if (card.sensitivity) {
    for (const tag of card.sensitivity) {
      if (!VALID_SENSITIVITY_TAGS.has(tag)) {
        errors.push(`[${card.id}] Invalid sensitivity tag: "${tag}"`);
      }
    }
  }

  if (card.relationshipFit) {
    for (const [key, score] of Object.entries(card.relationshipFit)) {
      if (!VALID_RELATIONSHIP_TAGS.has(key as RelationshipTag)) {
        errors.push(`[${card.id}] Invalid relationshipFit key: "${key}"`);
      }
      if (score === undefined || !Number.isInteger(score) || score < 0 || score > 3) {
        errors.push(`[${card.id}] Invalid relationshipFit score for "${key}": ${score} (must be 0-3)`);
      }
    }
  }

  if (card.followUp) {
    if (!card.followUp.zh || card.followUp.zh.trim().length === 0) {
      errors.push(`[${card.id}] followUp is present but missing zh text`);
    }
  }

  return errors;
}

export function assertCardDatabase(
  cards: ConversationCard[],
  expectedTotal = 130,
  options: ValidateCardOptions = { production: true }
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  const levelBreakdown: Record<CardLevel, number> = {
    icebreaker: 0,
    'one-star': 0,
    'two-star': 0,
    'three-star': 0,
  };

  for (const card of cards) {
    if (seenIds.has(card.id)) {
      errors.push(`Duplicate card ID detected: "${card.id}"`);
    }
    seenIds.add(card.id);

    if (VALID_LEVELS.has(card.level)) {
      levelBreakdown[card.level] += 1;
    }

    const cardErrors = validateCard(card, options);
    errors.push(...cardErrors);
  }

  if (expectedTotal > 0 && cards.length !== expectedTotal) {
    errors.push(
      `Database card count mismatch: expected ${expectedTotal} cards, found ${cards.length}`
    );
  }

  return {
    valid: errors.length === 0,
    total: cards.length,
    errors,
    warnings,
    levelBreakdown,
  };
}
