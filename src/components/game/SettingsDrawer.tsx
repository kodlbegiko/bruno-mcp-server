import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardLevel } from '../../types/card';
import { LEVEL_ORDER, LEVEL_NAMES } from '../../game/progression';
import { totalDeckCounts, getCardById } from '../../data/decks';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useTranslation } from 'react-i18next';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEndGame: () => void;
  onResetGame: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  onEndGame,
  onResetGame,
}) => {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const changeLevel = useGameStore((s) => s.changeLevel);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const bilingual = useSettingsStore((s) => s.bilingual);
  const setBilingual = useSettingsStore((s) => s.setBilingual);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const sendAction = useMultiplayerStore((s) => s.sendAction);

  const [activeTab, setActiveTab] = useState<'decks' | 'history' | 'settings'>('decks');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!gameState) return null;

  const currentLevel = gameState.currentLevel;
  const historyCardIds = gameState.historyCardIds || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-md h-full bg-paper-50 dark:bg-stone-900 shadow-2xl flex flex-col border-l border-paper-border dark:border-stone-800 safe-top safe-bottom transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-paper-border dark:border-stone-800">
              <div>
                <h2 className="text-lg font-serif font-medium text-ink-900 dark:text-stone-100">遊戲選單</h2>
                <p className="text-xs text-ink-500 dark:text-stone-400 font-sans">
                  {gameState.mode === 'guided' ? '深度旅程 Guided Journey' : '自由抽牌 Free Play'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="關閉選單"
                className="w-9 h-9 rounded-full flex items-center justify-center text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-100 hover:bg-paper-200/70 dark:hover:bg-stone-800/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-paper-border dark:border-stone-800 px-5 bg-paper-100/50 dark:bg-stone-850/50">
              <button
                type="button"
                onClick={() => setActiveTab('decks')}
                className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'decks'
                    ? 'border-ink-900 dark:border-stone-100 text-ink-900 dark:text-stone-100'
                    : 'border-transparent text-ink-500 dark:text-stone-400 hover:text-ink-700 dark:hover:text-stone-200'
                }`}
              >
                牌組進度
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-ink-900 dark:border-stone-100 text-ink-900 dark:text-stone-100'
                    : 'border-transparent text-ink-500 dark:text-stone-400 hover:text-ink-700 dark:hover:text-stone-200'
                }`}
              >
                本局歷程 ({historyCardIds.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-ink-900 dark:border-stone-100 text-ink-900 dark:text-stone-100'
                    : 'border-transparent text-ink-500 dark:text-stone-400 hover:text-ink-700 dark:hover:text-stone-200'
                }`}
              >
                設定與控制
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {activeTab === 'decks' && (
                <div className="space-y-3">
                  <p className="text-xs text-ink-500 dark:text-stone-400 font-sans">
                    點擊任何牌組可直接切換。已抽過的牌不會在同局重複出現。
                  </p>

                  <div className="space-y-2.5">
                    {LEVEL_ORDER.map((level: CardLevel) => {
                      const info = LEVEL_NAMES[level];
                      const total = totalDeckCounts[level];
                      const deckState = gameState.decks[level];
                      const drawn = deckState.cursor;
                      const isCurrent = level === currentLevel;

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            if (!isCurrent) {
                              if (isOnlineMode) {
                                sendAction({ action: 'CHANGE_LEVEL', level });
                              } else {
                                changeLevel(level);
                              }
                              onClose();
                            }
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                            isCurrent
                              ? 'bg-paper-100 dark:bg-stone-800 border-ink-900 dark:border-stone-400 ring-1 ring-ink-900/10'
                              : 'bg-paper-50 dark:bg-stone-900 hover:bg-paper-100/70 dark:hover:bg-stone-800/70 border-paper-border dark:border-stone-750'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: info.color }}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-serif font-medium text-sm text-ink-900 dark:text-stone-100">
                                  {info.zh}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ink-900 text-paper-50 dark:bg-stone-100 dark:text-stone-900 font-sans">
                                    進行中
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-ink-500 dark:text-stone-400 font-sans">{info.en}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-medium text-ink-700 dark:text-stone-300">
                              {drawn} / {total}
                            </span>
                            <div className="w-16 h-1.5 bg-paper-200 dark:bg-stone-700 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  backgroundColor: info.color,
                                  width: `${Math.min(100, Math.round((drawn / total) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-paper-200/50 dark:bg-stone-800/80 border border-paper-border dark:border-stone-700 text-xs text-ink-600 dark:text-stone-300 font-sans space-y-1">
                    <p className="font-medium text-ink-800 dark:text-stone-100">隱私保護原則</p>
                    <p className="leading-relaxed">
                      本遊戲嚴格保護隱私：不記錄任何人的回答、不錄音、不進行分析。此處僅顯示抽過的題目順序。
                    </p>
                  </div>

                  {historyCardIds.length === 0 ? (
                    <div className="text-center py-8 text-sm text-ink-400 dark:text-stone-500 font-serif">
                      尚未翻開任何卡片
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {historyCardIds.map((cardId, index) => {
                        const card = getCardById(cardId);
                        if (!card) return null;
                        const levelInfo = LEVEL_NAMES[card.level];

                        return (
                          <div
                            key={`${cardId}-${index}`}
                            className="p-3 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700 flex items-start gap-3"
                          >
                            <span className="text-xs font-mono font-medium text-ink-400 dark:text-stone-500 shrink-0 mt-0.5">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: levelInfo.color }}
                                />
                                <span className="text-[11px] font-sans text-ink-500 dark:text-stone-400">
                                  {levelInfo.zh}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-serif text-ink-900 dark:text-stone-100 leading-snug">
                                {card.zh}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Preferences */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                      {t('settings.title')}
                    </h3>

                    {/* Language Switcher */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700">
                      <span className="text-sm font-medium text-ink-900 dark:text-stone-100">{t('settings.language')}</span>
                      <div className="flex rounded-lg bg-paper-200/60 dark:bg-stone-700/60 p-0.5 border border-paper-border dark:border-stone-600">
                        <button
                          type="button"
                          onClick={() => setLanguage('zh-TW')}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                            language === 'zh-TW'
                              ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                              : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
                          }`}
                        >
                          繁中
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                            language === 'en'
                              ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                              : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
                          }`}
                        >
                          EN
                        </button>
                      </div>
                    </div>

                    {/* Theme Switcher */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700">
                      <span className="text-sm font-medium text-ink-900 dark:text-stone-100">{t('settings.theme')}</span>
                      <div className="flex rounded-lg bg-paper-200/60 dark:bg-stone-700/60 p-0.5 border border-paper-border dark:border-stone-600">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                            theme === 'light'
                              ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                              : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
                          }`}
                        >
                          {t('settings.theme_light')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                            theme === 'dark'
                              ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                              : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
                          }`}
                        >
                          {t('settings.theme_dark')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('system')}
                          className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                            theme === 'system'
                              ? 'bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 shadow-xs'
                              : 'text-ink-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-stone-200'
                          }`}
                        >
                          {t('settings.theme_auto')}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700 cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-ink-900 dark:text-stone-100 block">{t('settings.bilingual')}</span>
                        <span className="text-[11px] text-ink-500 dark:text-stone-400 block">{t('settings.bilingual_desc')}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={bilingual}
                        onChange={(e) => setBilingual(e.target.checked)}
                        className="w-4 h-4 rounded text-ink-900 focus:ring-ink-500 accent-ink-900 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700 cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-ink-900 dark:text-stone-100 block">{t('settings.sound')}</span>
                        <span className="text-[11px] text-ink-500 dark:text-stone-400 block">{t('settings.sound_desc')}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-ink-900 focus:ring-ink-500 accent-ink-900 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700 cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-ink-900 dark:text-stone-100 block">{t('settings.haptics')}</span>
                        <span className="text-[11px] text-ink-500 dark:text-stone-400 block">{t('settings.haptics_desc')}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hapticsEnabled}
                        onChange={(e) => setHapticsEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-ink-900 focus:ring-ink-500 accent-ink-900 cursor-pointer"
                      />
                    </label>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/70 dark:bg-stone-800/70 border border-paper-border dark:border-stone-700">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-ink-900 dark:text-stone-100 block">螢幕常亮保護</span>
                        <span className="text-[11px] text-ink-500 dark:text-stone-400 block">對話期間自動防止手機休眠</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        自動啟用
                      </span>
                    </div>
                  </div>

                  {/* Players list */}
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider">
                      參與玩家 ({gameState.players.length} 人)
                    </h3>
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-paper-100/50 dark:bg-stone-800/50 border border-paper-border dark:border-stone-700">
                      {gameState.players.map((p, idx) => (
                        <span
                          key={p.id}
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            idx === gameState.drawerIndex
                              ? 'bg-ink-900 text-paper-50 border-ink-900 dark:bg-stone-100 dark:text-stone-900 font-medium'
                              : 'bg-paper-50 dark:bg-stone-900 text-ink-700 dark:text-stone-300 border-paper-border dark:border-stone-700'
                          }`}
                        >
                          {p.name} {idx === gameState.drawerIndex ? ' (當前抽牌)' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2.5 pt-4 border-t border-paper-border dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEndGame();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-ink-900 dark:border-stone-500 text-ink-900 dark:text-stone-100 font-serif text-sm hover:bg-paper-200 dark:hover:bg-stone-800 transition-colors"
                    >
                      {t('settings.leave_game')}
                    </button>

                    {!showConfirmReset ? (
                      <button
                        type="button"
                        onClick={() => setShowConfirmReset(true)}
                        className="w-full py-2.5 px-4 rounded-xl text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 text-xs font-sans hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        {t('settings.reset_game')}
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-center space-y-2">
                        <p className="text-xs text-rose-900 dark:text-rose-200 font-medium">確定要重置並清空本局進度嗎？</p>
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => setShowConfirmReset(false)}
                            className="px-3 py-1 text-xs rounded bg-paper-50 dark:bg-stone-800 border border-paper-border dark:border-stone-700 text-ink-700 dark:text-stone-300"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowConfirmReset(false);
                              onResetGame();
                            }}
                            className="px-3 py-1 text-xs rounded bg-rose-600 text-white font-medium"
                          >
                            確定重置
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="p-4 border-t border-paper-border dark:border-stone-800 bg-paper-100/40 dark:bg-stone-900/60">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-ink-900 text-paper-50 dark:bg-stone-100 dark:text-stone-900 text-sm font-medium hover:bg-ink-800 dark:hover:bg-stone-200 transition-colors"
              >
                返回遊戲
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
