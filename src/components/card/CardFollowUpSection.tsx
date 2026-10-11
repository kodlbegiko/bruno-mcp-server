import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFollowUp, CardLevel } from '../../data/cards/types';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameStore } from '../../store/gameStore';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { trackEvent } from '../../utils/analytics';

interface CardFollowUpSectionProps {
  cardId: string;
  level: CardLevel;
  followUp: CardFollowUp;
  className?: string;
}

export const CardFollowUpSection: React.FC<CardFollowUpSectionProps> = ({
  cardId,
  level,
  followUp,
  className = '',
}) => {
  const [localOpen, setLocalOpen] = useState(false);
  const bilingual = useSettingsStore((s) => s.bilingual);
  const isFollowUpRecorded = useGameStore((s) =>
    s.gameState?.followUpOpenedCardIds?.includes(cardId)
  );
  const recordFollowUpOpened = useGameStore((s) => s.recordFollowUpOpened);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const sendAction = useMultiplayerStore((s) => s.sendAction);

  // Sync state: either locally opened or synced via host/gameState
  const isOpen = localOpen || Boolean(isFollowUpRecorded);

  // Reset local expansion whenever the card changes
  useEffect(() => {
    setLocalOpen(false);
  }, [cardId]);

  const handleToggle = () => {
    const nextState = !isOpen;
    if (nextState) {
      trackEvent('follow_up_opened', { cardId, level });
      recordFollowUpOpened(cardId);
      if (isOnlineMode) {
        sendAction({ action: 'OPEN_FOLLOW_UP', cardId });
      }
    }
    setLocalOpen(nextState);
  };

  return (
    <div className={`w-full max-w-[340px] sm:max-w-[380px] flex flex-col items-center select-none ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif text-ink-700 dark:text-stone-300 bg-paper-100/90 dark:bg-stone-800/90 hover:bg-paper-200/80 dark:hover:bg-stone-700/80 border border-paper-border dark:border-stone-700 shadow-2xs transition-all active:scale-95"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{isOpen ? '💬' : '✨'}</span>
        <span>{isOpen ? '收起深入追問' : '再問深一點'}</span>
        <span className="text-[10px] text-ink-400 dark:text-stone-400 leading-none">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
            className="w-full overflow-hidden mt-2.5"
          >
            <div className="p-3.5 sm:p-4 rounded-2xl bg-paper-100/95 dark:bg-stone-850/95 border border-paper-border dark:border-stone-700 shadow-soft text-left">
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-sans font-semibold tracking-wider text-ink-500 dark:text-stone-400 uppercase">
                <span>🌱 深入追問</span>
              </div>
              <p className="font-serif text-xs sm:text-sm font-medium leading-relaxed text-ink-900 dark:text-stone-100">
                {followUp.zh}
              </p>
              {bilingual && followUp.en && (
                <p className="font-serif italic text-[11px] sm:text-xs leading-normal text-ink-500 dark:text-stone-400 mt-1.5 pt-1.5 border-t border-paper-border/50 dark:border-stone-800">
                  {followUp.en}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
