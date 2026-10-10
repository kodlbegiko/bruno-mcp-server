import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/ui/Button';
import { RulesModal } from '../components/common/RulesModal';
import { SettingsModal } from '../components/common/SettingsModal';
import { PwaInstallPrompt } from '../components/ui/PwaInstallPrompt';
import { LEVEL_NAMES } from '../game/progression';
import { trackEvent, resetSessionTimer } from '../utils/analytics';

interface HomeProps {
  onStartNewGame: () => void;
  onResumeGame: () => void;
  onStartOnlineGame: () => void;
  onQuickStart: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onStartNewGame,
  onResumeGame,
  onStartOnlineGame,
  onQuickStart,
}) => {
  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);

  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [pendingAction, setPendingAction] = useState<'quick' | 'custom' | null>(null);

  useEffect(() => {
    resetSessionTimer();
    trackEvent('home_view');
  }, []);

  const hasActiveGame = !!(gameState && gameState.status === 'playing');

  const handleQuickStart = () => {
    if (hasActiveGame) {
      setPendingAction('quick');
      setShowConfirmNew(true);
    } else {
      trackEvent('quick_start');
      trackEvent('shared_device_start');
      onQuickStart();
    }
  };

  const handleNewGameClick = () => {
    if (hasActiveGame) {
      setPendingAction('custom');
      setShowConfirmNew(true);
    } else {
      trackEvent('custom_setup_start');
      onStartNewGame();
    }
  };

  const handleConfirmNewGame = () => {
    const action = pendingAction;
    resetGame();
    setShowConfirmNew(false);
    setPendingAction(null);
    if (action === 'quick') {
      trackEvent('quick_start');
      trackEvent('shared_device_start');
      onQuickStart();
    } else {
      trackEvent('custom_setup_start');
      onStartNewGame();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper-50 dark:bg-stone-900 flex flex-col justify-between px-4 py-6 sm:py-10 safe-top safe-bottom transition-colors">
      {/* Top Header Actions */}
      <header className="flex justify-between items-center max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={() => setShowRules(true)}
          className="text-xs sm:text-sm font-serif text-ink-600 dark:text-stone-300 hover:text-ink-900 dark:hover:text-stone-100 px-3 py-1.5 rounded-xl hover:bg-paper-100 dark:hover:bg-stone-800 transition-colors"
        >
          遊戲方法
        </button>

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="text-xs sm:text-sm font-serif text-ink-600 dark:text-stone-300 hover:text-ink-900 dark:hover:text-stone-100 px-3 py-1.5 rounded-xl hover:bg-paper-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>設定</span>
        </button>
      </header>

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Main Hero & Card Deck Visual */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full my-6 text-center space-y-6">
        {/* Title & Editorial Subtitle */}
        <div className="space-y-3">
          <div className="inline-block px-3 py-1 rounded-full bg-paper-200/70 dark:bg-stone-800 text-[11px] font-mono tracking-widest text-ink-600 dark:text-stone-400">
            手機是牌盒，不是主角
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-stone-100 tracking-tight">
            深刻認識一個人
          </h1>
          <p className="text-xs font-sans tracking-widest text-ink-500 dark:text-stone-400 uppercase">
            Deeply Know Someone
          </p>
          <div className="pt-2 text-sm sm:text-base font-serif text-ink-700 dark:text-stone-300 leading-relaxed max-w-xs mx-auto">
            <p>有些人認識很久，</p>
            <p>卻從來沒有真正認識過彼此。</p>
          </div>
        </div>

        {/* Tactile 4-Deck Preview */}
        <div className="relative w-64 h-48 my-4 flex items-center justify-center">
          {/* Deck 0: Icebreaker */}
          <motion.div
            initial={{ rotate: -12, x: -45, y: 10 }}
            animate={{ rotate: -12, x: -45, y: 10 }}
            whileHover={{ scale: 1.05, y: 2 }}
            className="absolute w-28 rounded-xl overflow-hidden shadow-card border border-icebreaker-border/80 cursor-pointer"
            onClick={() => setShowRules(true)}
          >
            <img
              src="/assets/cards/card_back_icebreaker.webp"
              alt="暖身破冰"
              className="w-full h-auto object-cover"
            />
          </motion.div>

          {/* Deck 1: One-Star */}
          <motion.div
            initial={{ rotate: -4, x: -15, y: 0 }}
            animate={{ rotate: -4, x: -15, y: 0 }}
            whileHover={{ scale: 1.05, y: -8 }}
            className="absolute w-28 rounded-xl overflow-hidden shadow-card border border-oneStar-border/80 cursor-pointer z-10"
            onClick={() => setShowRules(true)}
          >
            <img
              src="/assets/cards/card_back_one_star.webp"
              alt="一星連結"
              className="w-full h-auto object-cover"
            />
          </motion.div>

          {/* Deck 2: Two-Star */}
          <motion.div
            initial={{ rotate: 5, x: 15, y: -4 }}
            animate={{ rotate: 5, x: 15, y: -4 }}
            whileHover={{ scale: 1.05, y: -12 }}
            className="absolute w-28 rounded-xl overflow-hidden shadow-card border border-twoStar-border/80 cursor-pointer z-20"
            onClick={() => setShowRules(true)}
          >
            <img
              src="/assets/cards/card_back_two_star.webp"
              alt="二星連結"
              className="w-full h-auto object-cover"
            />
          </motion.div>

          {/* Deck 3: Three-Star */}
          <motion.div
            initial={{ rotate: 14, x: 45, y: 8 }}
            animate={{ rotate: 14, x: 45, y: 8 }}
            whileHover={{ scale: 1.05, y: 0 }}
            className="absolute w-28 rounded-xl overflow-hidden shadow-card border border-threeStar-border/80 cursor-pointer z-30"
            onClick={() => setShowRules(true)}
          >
            <img
              src="/assets/cards/card_back_three_star.webp"
              alt="三星連結"
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </div>

        {/* 4 Levels Badge strip */}
        <div className="flex items-center justify-center gap-3 py-1">
          {(['icebreaker', 'one-star', 'two-star', 'three-star'] as const).map((lvl) => {
            const info = LEVEL_NAMES[lvl];
            return (
              <div key={lvl} className="flex items-center gap-1.5 text-[11px] text-ink-600 dark:text-stone-300 font-serif">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                <span>{info.zh.slice(0, 2)}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Primary CTAs & Footer */}
      <footer className="max-w-md mx-auto w-full space-y-3">
        {hasActiveGame ? (
          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={onResumeGame}
              className="shadow-lg"
            >
              繼續上次遊戲
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs sm:text-sm font-medium"
                onClick={handleNewGameClick}
              >
                開始遊戲 · 自訂設定
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs sm:text-sm font-medium border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40"
                onClick={() => {
                  trackEvent('multiplayer_start');
                  onStartOnlineGame();
                }}
              >
                每人用自己的手機（多人連線 Beta）
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleQuickStart}
              className="shadow-lg flex items-center justify-center gap-2"
            >
              <span className="font-medium">⚡ 快速開始（共用這支手機）</span>
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs sm:text-sm font-medium"
                onClick={handleNewGameClick}
              >
                開始遊戲 · 自訂設定
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs sm:text-sm font-medium border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50"
                onClick={() => {
                  trackEvent('multiplayer_start');
                  onStartOnlineGame();
                }}
              >
                每人用自己的手機（多人連線 Beta）
              </Button>
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <p className="text-[11px] text-ink-500 dark:text-stone-400 font-sans tracking-wide">
            130 道深度對話 · 原版 70 題＋全新擴充 60 題 · 不記錄對話 · 專注於彼此
          </p>
        </div>
      </footer>

      {/* Confirmation Modal for Overwriting Active Game */}
      {showConfirmNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-paper-50 dark:bg-stone-900 rounded-2xl p-6 max-w-xs w-full border border-paper-border dark:border-stone-700 text-center space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-medium text-ink-900 dark:text-stone-100">
              開始新遊戲？
            </h3>
            <p className="text-xs text-ink-600 dark:text-stone-300 font-serif leading-relaxed">
              目前有進行中的對話進度。開始新遊戲將重新洗牌並清空當前紀錄。
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  setShowConfirmNew(false);
                  setPendingAction(null);
                }}
              >
                保留上次
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleConfirmNewGame}
              >
                確認開始
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rules & Settings Modals */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};
