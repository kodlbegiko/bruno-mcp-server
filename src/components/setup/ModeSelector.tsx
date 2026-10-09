import React from 'react';
import { GameMode } from '../../types/game';
import { CardLevel } from '../../types/card';
import { LEVEL_ORDER, LEVEL_NAMES } from '../../game/progression';

interface ModeSelectorProps {
  mode: GameMode;
  onChangeMode: (mode: GameMode) => void;
  startingLevel?: CardLevel;
  onChangeStartingLevel?: (level: CardLevel) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onChangeMode,
  startingLevel = 'icebreaker',
  onChangeStartingLevel,
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider">
        選擇遊戲模式
      </label>

      {/* Guided Journey */}
      <button
        type="button"
        onClick={() => onChangeMode('guided')}
        className={`w-full text-left p-4 rounded-2xl border transition-all ${
          mode === 'guided'
            ? 'bg-paper-100 dark:bg-stone-800 border-ink-900 dark:border-stone-400 ring-1 ring-ink-900/10 shadow-xs'
            : 'bg-paper-50 dark:bg-stone-900/80 hover:bg-paper-100/60 dark:hover:bg-stone-800/60 border-paper-border dark:border-stone-700'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-serif font-medium text-base text-ink-900 dark:text-stone-100">
            深度旅程 Guided Journey
          </span>
          <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-paper-200 dark:bg-stone-700 text-ink-700 dark:text-stone-300">
            推薦預設
          </span>
        </div>
        <p className="text-xs text-ink-600 dark:text-stone-300 font-serif leading-relaxed">
          從暖身破冰開始，循序漸進至一星、二星與三星。節奏由你們決定，不強迫進入下一階段。
        </p>
      </button>

      {/* Free Play */}
      <div
        className={`rounded-2xl border transition-all ${
          mode === 'free'
            ? 'bg-paper-100 dark:bg-stone-800 border-ink-900 dark:border-stone-400 ring-1 ring-ink-900/10 shadow-xs p-4'
            : 'bg-paper-50 dark:bg-stone-900/80 hover:bg-paper-100/60 dark:hover:bg-stone-800/60 border-paper-border dark:border-stone-700 p-4'
        }`}
      >
        <button
          type="button"
          onClick={() => onChangeMode('free')}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-serif font-medium text-base text-ink-900 dark:text-stone-100">
              自由抽牌 Free Play
            </span>
            <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-paper-200 dark:bg-stone-700 text-ink-700 dark:text-stone-300">
              自由自選
            </span>
          </div>
          <p className="text-xs text-ink-600 dark:text-stone-300 font-serif leading-relaxed">
            直接自選欲對話的星級深度牌組。適合情侶、多年好友，或想直接切入特定主題。
          </p>
        </button>

        {/* Sub-selector for starting deck level when Free Play is selected */}
        {mode === 'free' && onChangeStartingLevel && (
          <div className="mt-3 pt-3 border-t border-paper-border/80 dark:border-stone-700 space-y-2">
            <span className="block text-[11px] font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider">
              選擇起始牌組
            </span>
            <div className="grid grid-cols-2 gap-2">
              {LEVEL_ORDER.map((level) => {
                const info = LEVEL_NAMES[level];
                const isSelected = startingLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeStartingLevel(level)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-paper-50 dark:bg-stone-900 border-ink-900 dark:border-stone-400 shadow-2xs ring-1 ring-ink-900/20'
                        : 'bg-paper-100/50 dark:bg-stone-800/50 hover:bg-paper-200/50 dark:hover:bg-stone-700/60 border-paper-border/80 dark:border-stone-700'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: info.color }}
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-serif font-medium text-ink-900 dark:text-stone-100 truncate">
                        {info.zh}
                      </span>
                      <span className="block text-[10px] text-ink-400 dark:text-stone-500 font-sans truncate">
                        {info.en}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
