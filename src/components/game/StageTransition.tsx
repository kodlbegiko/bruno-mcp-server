import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardLevel } from '../../types/card';
import { LEVEL_NAMES, getNextLevel } from '../../game/progression';

interface DeepenPromptProps {
  currentLevel: CardLevel;
  cardsDrawnInLevel: number;
  isDeckEmpty: boolean;
  onEnterNextLevel: () => void;
  onDismiss: () => void;
}

export const DeepenPrompt: React.FC<DeepenPromptProps> = ({
  currentLevel,
  cardsDrawnInLevel,
  isDeckEmpty,
  onEnterNextLevel,
  onDismiss,
}) => {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return null;

  const nextInfo = LEVEL_NAMES[nextLevel];

  // Dynamic minimum depth threshold based on emotional pacing:
  // icebreaker: 4 cards, one-star: 4 cards, two-star: 5 cards
  const minRequiredCards = currentLevel === 'two-star' ? 5 : 4;
  if (!isDeckEmpty && cardsDrawnInLevel < minRequiredCards) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-sm mx-auto my-2 p-3 sm:p-3.5 rounded-2xl bg-paper-100/95 dark:bg-stone-850/95 border border-paper-border dark:border-stone-700 shadow-soft backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-serif font-medium text-ink-900 dark:text-stone-100 truncate">
              {isDeckEmpty ? '本階段卡片已翻完' : '現在的聊天節奏舒服嗎？'}
            </p>
            <p className="text-[11px] text-ink-500 dark:text-stone-400 font-sans truncate">
              {isDeckEmpty
                ? `可前往下一階段：${nextInfo.zh}`
                : `可繼續停留，或前往【${nextInfo.zh}】`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isDeckEmpty && (
              <button
                type="button"
                onClick={onDismiss}
                className="px-2.5 py-1.5 text-xs text-ink-500 dark:text-stone-400 hover:text-ink-700 dark:hover:text-stone-200 active:text-ink-900 dark:active:text-stone-100 transition-colors rounded-lg hover:bg-paper-200/60 dark:hover:bg-stone-700/60"
              >
                繼續留在這裡
              </button>
            )}
            <button
              type="button"
              onClick={onEnterNextLevel}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-paper-50 shadow-xs transition-transform active:scale-95"
              style={{ backgroundColor: nextInfo.color }}
            >
              進入下一階段
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
