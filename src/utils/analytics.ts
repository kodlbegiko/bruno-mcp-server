/**
 * Privacy-preserving Product Analytics
 * 
 * Strict Principle:
 * - NO personal data
 * - NO player names
 * - NO audio/speech recording
 * - NO conversation response text
 * 
 * Only tracks anonymous operational rhythms:
 * - Time to First Card (funnel speed)
 * - Card skip rates (content difficulty/discomfort feedback)
 * - Stage progression & session length
 */

export type AnalyticsEventType =
  | 'home_view'
  | 'shared_device_start'
  | 'quick_start'
  | 'custom_setup_start'
  | 'multiplayer_start'
  | 'setup_complete'
  | 'first_card_flip'
  | 'card_flip'
  | 'card_next'
  | 'card_skip'
  | 'level_enter'
  | 'two_star_notice_shown'
  | 'three_star_prompt_shown'
  | 'three_star_accept'
  | 'three_star_decline'
  | 'closing_card_view'
  | 'game_end'
  | 'share'
  | 'play_again';

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | undefined;
}

let sessionStartTime = typeof window !== 'undefined' ? Date.now() : 0;
let hasFirstCardFlipped = false;

// In-memory event buffer for local inspection
const eventBuffer: Array<{ event: AnalyticsEventType; timestamp: number; payload?: AnalyticsPayload }> = [];

export function trackEvent(event: AnalyticsEventType, payload?: AnalyticsPayload): void {
  const timestamp = Date.now();

  // If first card flip, calculate time to first card
  let enrichedPayload = { ...payload };
  if (event === 'first_card_flip') {
    if (hasFirstCardFlipped) {
      return;
    }
    hasFirstCardFlipped = true;
    const timeToFirstCardMs = sessionStartTime > 0 ? timestamp - sessionStartTime : 0;
    enrichedPayload = {
      ...enrichedPayload,
      timeToFirstCardMs,
      timeToFirstCardSec: Math.round(timeToFirstCardMs / 1000),
    };
  }

  eventBuffer.push({ event, timestamp, payload: enrichedPayload });
  if (eventBuffer.length > 100) {
    eventBuffer.shift();
  }

  // Debug log in development environment
  if (process.env.NODE_ENV === 'development') {
    // console.debug('[Analytics]', event, enrichedPayload);
  }

  // Safe anonymous local storage sync for session telemetry
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('deeply_anonymous_metrics', JSON.stringify({
        lastEvent: event,
        eventCount: eventBuffer.length,
        hasFirstCardFlipped,
      }));
    }
  } catch {
    // ignore
  }
}

export function resetSessionTimer(): void {
  sessionStartTime = Date.now();
  hasFirstCardFlipped = false;
}

export function getSessionMetrics() {
  return {
    events: [...eventBuffer],
    hasFirstCardFlipped,
  };
}
