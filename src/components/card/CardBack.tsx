import React from 'react';
import { CardLevel } from '../../types/card';
import { LEVEL_NAMES } from '../../game/progression';

interface CardBackProps {
  level: CardLevel;
  className?: string;
}

export const CardBack: React.FC<CardBackProps> = ({ level, className = '' }) => {
  const stageInfo = LEVEL_NAMES[level];
  const imageLevelName = level === 'one-star' ? 'one_star' : level === 'two-star' ? 'two_star' : level === 'three-star' ? 'three_star' : 'icebreaker';

  return (
    <div
      className={`relative w-full h-full rounded-3xl overflow-hidden border border-paper-border/80 dark:border-stone-700 shadow-card bg-paper-100 dark:bg-stone-850 flex flex-col justify-between select-none transition-colors ${className}`}
      style={{ aspectRatio: '2.5 / 3.7' }}
    >
      <picture className="absolute inset-0 w-full h-full">
        <source srcSet={`/assets/cards/card_back_${imageLevelName}.webp`} type="image/webp" />
        <img
          src={`/assets/cards/card_back_${imageLevelName}.png`}
          alt={`${stageInfo.zh} 卡背`}
          className="w-full h-full object-cover pointer-events-none select-none"
          loading="eager"
        />
      </picture>

      {/* Subtle paper reflection sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/10 dark:to-white/5 pointer-events-none" />
    </div>
  );
};
