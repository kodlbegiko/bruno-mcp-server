import React from 'react';
import { Card } from '../../types/card';
import { LEVEL_NAMES } from '../../game/progression';
import { useSettingsStore } from '../../store/settingsStore';

interface CardFrontProps {
  card: Card;
  className?: string;
}

export const CardFront: React.FC<CardFrontProps> = ({ card, className = '' }) => {
  const bilingual = useSettingsStore((s) => s.bilingual);
  const stageInfo = LEVEL_NAMES[card.level];

  const renderStars = () => {
    const level = card.level;
    switch (level) {
      case 'icebreaker':
        return <span className="text-xl tracking-wider text-icebreaker font-bold">☆</span>;
      case 'one-star':
        return <span className="text-xl tracking-wider text-oneStar-dark dark:text-lime-400 font-bold">★</span>;
      case 'two-star':
        return <span className="text-xl tracking-wider text-twoStar-dark dark:text-orange-400 font-bold">★★</span>;
      case 'three-star':
        return <span className="text-xl tracking-wider text-threeStar-dark dark:text-pink-400 font-bold">★★★</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative w-full h-full rounded-3xl bg-[#FCFAF7] dark:bg-[#1E1B18] border border-paper-border/90 dark:border-stone-700 shadow-card flex flex-col justify-between p-6 sm:p-8 select-none transition-colors ${className}`}
      style={{ aspectRatio: '2.5 / 3.7' }}
    >
      {/* Top Header: Star depth rating */}
      <div className="flex items-center justify-between w-full">
        <div>{renderStars()}</div>
        <span className="text-xs tracking-wider uppercase text-ink-400 dark:text-stone-400 font-medium">
          {stageInfo.zh}
        </span>
      </div>

      {/* Main Question Body */}
      <div className="my-auto flex flex-col justify-center py-4">
        <h2 className="text-xl sm:text-2xl font-serif font-medium leading-relaxed sm:leading-loose text-ink-900 dark:text-stone-100 text-center tracking-normal">
          {card.zh}
        </h2>

        {/* Bilingual English content (if enabled in settings) */}
        {bilingual && (card.enTitle || card.en) && (
          <div className="mt-5 pt-4 border-t border-paper-border/60 dark:border-stone-800 text-center">
            {card.enTitle && (
              <p className="text-xs sm:text-sm font-semibold text-ink-700 dark:text-stone-300 tracking-wide mb-1">
                {card.enTitle}
              </p>
            )}
            {card.en && (
              <p className="text-xs sm:text-sm font-serif italic text-ink-500 dark:text-stone-400 leading-normal">
                {card.en}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Stage Identifier */}
      <div className="flex items-center justify-between pt-3 border-t border-paper-border/50 dark:border-stone-800 text-[11px] text-ink-400 dark:text-stone-400">
        <span>{stageInfo.zh}</span>
        <span className="font-serif italic">{stageInfo.en}</span>
      </div>
    </div>
  );
};
