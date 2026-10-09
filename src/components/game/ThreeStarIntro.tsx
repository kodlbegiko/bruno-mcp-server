import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface ThreeStarIntroProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ThreeStarIntro: React.FC<ThreeStarIntroProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-paper-50/95 dark:bg-stone-900/95 backdrop-blur-md transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full flex flex-col items-center text-center space-y-6"
      >
        {/* Three star card back visual */}
        <div className="w-28 rounded-2xl overflow-hidden shadow-card border border-threeStar-border/60">
          <img
            src="/assets/cards/card_back_three_star.webp"
            alt="三星連結卡背"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold tracking-widest text-threeStar-dark dark:text-pink-400">
            ★★★ 三星連結
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-ink-900 dark:text-stone-100 leading-snug">
            進入更深刻的對話
          </h2>
        </div>

        <div className="text-sm sm:text-base text-ink-700 dark:text-stone-300 font-serif leading-relaxed space-y-2 bg-paper-100/70 dark:bg-stone-800/70 p-5 rounded-2xl border border-paper-border dark:border-stone-700">
          <p>接下來的問題可能涉及比較私人的經驗。</p>
          <p className="text-ink-600 dark:text-stone-400 text-sm">
            任何人都可以換一題，不需要說明原因。
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-full pt-2">
          <Button variant="primary" size="lg" fullWidth onClick={onConfirm}>
            繼續
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={onCancel}>
            先留在二星
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
