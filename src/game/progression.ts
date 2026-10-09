import { CardLevel } from '../types/card';

export const LEVEL_ORDER: CardLevel[] = [
  'icebreaker',
  'one-star',
  'two-star',
  'three-star',
];

export const LEVEL_NAMES: Record<CardLevel, { zh: string; en: string; stars: number; color: string }> = {
  icebreaker: {
    zh: '暖身破冰',
    en: 'Break The Ice',
    stars: 0,
    color: '#4C85C0',
  },
  'one-star': {
    zh: '一星連結',
    en: 'One-Star Connection',
    stars: 1,
    color: '#C4D63C',
  },
  'two-star': {
    zh: '二星連結',
    en: 'Two-Star Connection',
    stars: 2,
    color: '#E98C37',
  },
  'three-star': {
    zh: '三星連結',
    en: 'Three-Star Connection',
    stars: 3,
    color: '#E87483',
  },
};

export function getNextLevel(current: CardLevel): CardLevel | null {
  const currentIndex = LEVEL_ORDER.indexOf(current);
  if (currentIndex >= 0 && currentIndex < LEVEL_ORDER.length - 1) {
    return LEVEL_ORDER[currentIndex + 1];
  }
  return null;
}

export function getPreviousLevel(current: CardLevel): CardLevel | null {
  const currentIndex = LEVEL_ORDER.indexOf(current);
  if (currentIndex > 0) {
    return LEVEL_ORDER[currentIndex - 1];
  }
  return null;
}
