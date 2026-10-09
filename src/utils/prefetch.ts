/**
 * Utility to prefetch critical assets (card backs and upcoming deck entries)
 * to ensure zero-latency flipping and stage transitions.
 */
export function prefetchCardAssets(): void {
  if (typeof window === 'undefined') return;

  const cardBacks = ['icebreaker', 'one_star', 'two_star', 'three_star'];
  cardBacks.forEach((level) => {
    const webpImg = new Image();
    webpImg.src = `/assets/cards/card_back_${level}.webp`;
  });
}
