import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed / standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Check if user dismissed recently
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
    setIsDismissed(dismissed);

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // Only show if not standalone, not dismissed, and either beforeinstallprompt is ready OR is iOS
  const shouldShow = !isStandalone && !isDismissed && (deferredPrompt !== null || isIos);

  if (!shouldShow) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-md mx-auto px-4 py-2"
        >
          <div className="bg-paper-100/90 dark:bg-stone-850/90 backdrop-blur-sm border border-paper-border dark:border-stone-700 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-paper-200 dark:bg-stone-750 text-ink-800 dark:text-stone-200 flex items-center justify-center shrink-0 text-base">
                📲
              </div>
              <div className="min-w-0">
                <p className="text-xs font-serif font-medium text-ink-900 dark:text-stone-100 truncate">
                  加入手機主畫面
                </p>
                <p className="text-[11px] text-ink-500 dark:text-stone-400 truncate font-sans">
                  像真實卡牌 App 一樣全螢幕沉浸遊玩
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-lg bg-ink-900 text-paper-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-medium hover:bg-ink-800 dark:hover:bg-stone-200 active:scale-95 transition-all"
              >
                {isIos ? '如何加入' : '立即安裝'}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-ink-400 dark:text-stone-400 hover:text-ink-700 dark:hover:text-stone-200 hover:bg-paper-200/60 dark:hover:bg-stone-750 transition-colors"
                aria-label="關閉提示"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-paper-50 dark:bg-stone-900 rounded-2xl p-6 max-w-xs w-full border border-paper-border dark:border-stone-700 text-center space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-paper-200 dark:bg-stone-800 text-ink-800 dark:text-stone-200 flex items-center justify-center mx-auto text-lg">
              🍎
            </div>
            <h3 className="font-serif text-base font-medium text-ink-900 dark:text-stone-100">
              在 Safari 加入主畫面
            </h3>
            <div className="text-xs text-ink-600 dark:text-stone-300 font-sans text-left space-y-2 bg-paper-100 dark:bg-stone-800 p-3 rounded-xl border border-paper-border/60 dark:border-stone-700">
              <p>1. 點擊 Safari 底部工具列的 <strong>分享圖示</strong>（帶有箭頭的方框）。</p>
              <p>2. 在選單中往下滑動，選擇 <strong>「加入主畫面」</strong>。</p>
              <p>3. 點擊右上角 <strong>「新增」</strong> 即可像 App 般暢玩！</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 rounded-xl bg-ink-900 text-paper-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-medium hover:bg-ink-800 dark:hover:bg-stone-200 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};
