import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { LEVEL_NAMES } from '../game/progression';
import { Button } from '../components/ui/Button';

interface EndingProps {
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const Ending: React.FC<EndingProps> = ({ onPlayAgain, onBackToHome }) => {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-stone-900 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-ink-600 dark:text-stone-300 font-serif mb-4">沒有結束的對話資料</p>
        <Button variant="primary" onClick={onBackToHome}>
          {t('ending.back_to_home')}
        </Button>
      </div>
    );
  }

  // Calculate session elapsed time
  const endedTime = gameState.endedAt || Date.now();
  const elapsedMinutes = Math.max(1, Math.round((endedTime - gameState.startedAt) / (60 * 1000)));

  // Calculate highest level reached
  const levelsPlayed = (['three-star', 'two-star', 'one-star', 'icebreaker'] as const);
  const highestLevel = levelsPlayed.find((lvl) => gameState.decks[lvl].cursor > 0) || 'icebreaker';
  const highestLevelInfo = LEVEL_NAMES[highestLevel];

  const handlePlayAgain = () => {
    resetGame();
    onPlayAgain();
  };

  const handleHome = () => {
    resetGame();
    onBackToHome();
  };

  const handleShare = async () => {
    const isEn = i18n.language === 'en';
    const shareTitle = isEn
      ? 'Deeply Know Someone · Conversation Session'
      : '深刻認識一個人 · 對話紀錄';
    const shareText = isEn
      ? `Deeply Know Someone · Session Record ✨\nWe spent ${elapsedMinutes} minutes in deep dialogue, drew ${gameState.cardsDrawnCount} cards, and reached the [${highestLevelInfo.en}] depth.\n"Thank you for being open and truly listening."\n👉 Try online: https://deeply-know-someone.vercel.app`
      : `深刻認識一個人 · 對話紀錄 ✨\n我們完成了 ${elapsedMinutes} 分鐘的深入對話，翻開了 ${gameState.cardsDrawnCount} 張卡牌，到達了【${highestLevelInfo.zh}】深度。\n「謝謝彼此的坦誠與聆聽。」\n👉 線上體驗：https://deeply-know-someone.vercel.app`;
    const shareUrl = 'https://deeply-know-someone.vercel.app';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        console.error('Clipboard copy failed', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-stone-900 flex flex-col justify-between px-4 py-8 sm:py-12 safe-top safe-bottom max-w-md mx-auto w-full text-center transition-colors">
      {/* Decorative Symbol */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-16 h-16 rounded-full bg-paper-100 dark:bg-stone-800 border border-paper-border dark:border-stone-700 flex items-center justify-center mx-auto mt-4 text-2xl shadow-soft"
      >
        ✨
      </motion.div>

      {/* Warm Reflection Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4 my-6"
      >
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-ink-900 dark:text-stone-100">
          {t('ending.title')}
        </h1>
        <div className="font-serif text-sm sm:text-base text-ink-700 dark:text-stone-300 leading-relaxed max-w-xs mx-auto space-y-2">
          <p>{t('ending.quote_1')}</p>
          <p>{t('ending.quote_2')}</p>
          <p>{t('ending.quote_3')}</p>
        </div>
      </motion.div>

      {/* Session Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-paper-100/70 dark:bg-stone-800/80 border border-paper-border dark:border-stone-700 rounded-2xl p-5 my-4 text-left space-y-3"
      >
        <h3 className="text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider font-sans">
          {t('ending.session_record')}
        </h3>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-paper-50 dark:bg-stone-900/80 rounded-xl border border-paper-border dark:border-stone-700">
            <span className="text-[11px] text-ink-500 dark:text-stone-400 font-sans block">
              {t('ending.cards_drawn')}
            </span>
            <span className="text-xl font-serif font-semibold text-ink-900 dark:text-stone-100">
              {gameState.cardsDrawnCount} 張
            </span>
          </div>

          <div className="p-3 bg-paper-50 dark:bg-stone-900/80 rounded-xl border border-paper-border dark:border-stone-700">
            <span className="text-[11px] text-ink-500 dark:text-stone-400 font-sans block">
              {t('ending.duration')}
            </span>
            <span className="text-xl font-serif font-semibold text-ink-900 dark:text-stone-100">
              {elapsedMinutes} 分鐘
            </span>
          </div>

          <div className="p-3 bg-paper-50 dark:bg-stone-900/80 rounded-xl border border-paper-border dark:border-stone-700">
            <span className="text-[11px] text-ink-500 dark:text-stone-400 font-sans block">
              {t('ending.participants')}
            </span>
            <span className="text-xl font-serif font-semibold text-ink-900 dark:text-stone-100">
              {gameState.players.length} 人
            </span>
          </div>

          <div className="p-3 bg-paper-50 dark:bg-stone-900/80 rounded-xl border border-paper-border dark:border-stone-700">
            <span className="text-[11px] text-ink-500 dark:text-stone-400 font-sans block">
              {t('ending.highest_depth')}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: highestLevelInfo.color }}
              />
              <span className="text-sm font-serif font-medium text-ink-900 dark:text-stone-100 truncate">
                {highestLevelInfo.zh}
              </span>
            </div>
          </div>
        </div>

        {/* Players Pill list */}
        <div className="pt-2 flex flex-wrap gap-1.5">
          {gameState.players.map((p) => (
            <span
              key={p.id}
              className="text-xs px-2.5 py-1 rounded-full bg-paper-200/60 dark:bg-stone-700/80 text-ink-700 dark:text-stone-200 font-serif"
            >
              {p.name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <footer className="space-y-2.5 mt-4">
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={handleShare}
          className="flex items-center justify-center gap-2 shadow-xs"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          <span>{copied ? t('ending.copied') : t('ending.share_button')}</span>
        </Button>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handlePlayAgain}
          className="shadow-md"
        >
          {t('ending.play_again')}
        </Button>

        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={handleHome}
          className="text-ink-600 dark:text-stone-400 hover:text-ink-900 dark:hover:text-stone-100"
        >
          {t('ending.back_to_home')}
        </Button>

        <p className="text-[11px] text-ink-500 dark:text-stone-400 font-sans pt-2">
          {t('ending.privacy_notice')}
        </p>
      </footer>
    </div>
  );
};
