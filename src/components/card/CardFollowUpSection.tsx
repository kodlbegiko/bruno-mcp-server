import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFollowUp, CardLevel } from '../../data/cards/types';
import { useSettingsStore } from '../../store/settingsStore';

export interface CardFollowUpSectionProps {
  cardId: string;
  level: CardLevel;
  followUp: CardFollowUp;
  isOpen: boolean;
  canControl?: boolean;
  onOpen: () => void;
  onClose: () => void;
  className?: string;
}

export const CardFollowUpSection: React.FC<CardFollowUpSectionProps> = ({
  followUp,
  isOpen,
  canControl = true,
  onOpen,
  onClose,
  className = '',
}) => {
  const bilingual = useSettingsStore((s) => s.bilingual);

  const handleToggle = () => {
    if (!canControl) return;
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };

  return (
    <div
      className={`w-full max-w-[340px] sm:max-w-[380px] flex flex-col items-center select-none ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={!canControl}
        title={!canControl ? '由當前抽牌者主持深入追問' : undefined}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-all ${
          !canControl
            ? 'opacity-70 cursor-not-allowed bg-paper-100/60 dark:bg-stone-800/60 text-ink-500 dark:text-stone-400 border border-paper-border/60 dark:border-stone-700/60'
            : 'text-ink-700 dark:text-stone-300 bg-paper-100/90 dark:bg-stone-800/90 hover:bg-paper-200/80 dark:hover:bg-stone-700/80 border border-paper-border dark:border-stone-700 shadow-2xs active:scale-95 cursor-pointer'
        }`}
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
