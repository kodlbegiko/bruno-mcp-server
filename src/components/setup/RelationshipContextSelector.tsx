import React from 'react';
import { RelationshipTag } from '../../data/cards/types';

export type RelationshipContextValue = 'all' | RelationshipTag;

interface RelationshipContextSelectorProps {
  value: RelationshipContextValue;
  onChange: (value: RelationshipContextValue) => void;
  className?: string;
}

const CONTEXT_OPTIONS: Array<{
  value: RelationshipContextValue;
  labelZh: string;
  emoji: string;
  descZh: string;
}> = [
  {
    value: 'all',
    labelZh: '不限定',
    emoji: '✨',
    descZh: '通用題庫推薦，適配所有情境',
  },
  {
    value: 'new-friends',
    labelZh: '初識／新朋友',
    emoji: '👋',
    descZh: '輕鬆破冰、日常性格，避免初期尷尬與過度壓力',
  },
  {
    value: 'friends',
    labelZh: '朋友／同儕',
    emoji: '☕',
    descZh: '著重日常、價值觀與趣味共鳴',
  },
  {
    value: 'group',
    labelZh: '多人聚會',
    emoji: '🎉',
    descZh: '著重全場參與、趣味互動與群體共鳴',
  },
  {
    value: 'dating',
    labelZh: '約會／曖昧',
    emoji: '🍷',
    descZh: '探索好感、邊界與深層心靈連結',
  },
  {
    value: 'couples',
    labelZh: '伴侶／情侶',
    emoji: '💍',
    descZh: '走進脆弱、依附感與長久關係承諾',
  },
  {
    value: 'family',
    labelZh: '家人／長輩',
    emoji: '🏡',
    descZh: '撫平世代感受、探索家庭角色與成長',
  },
];

export const RelationshipContextSelector: React.FC<RelationshipContextSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider block">
          對象關係情境 (智慧節奏引導)
        </label>
        <span className="text-[11px] text-ink-400 dark:text-stone-500 font-sans">
          可選
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CONTEXT_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 active:scale-[0.99] ${
                isSelected
                  ? 'border-ink-900 bg-paper-200/90 dark:border-stone-200 dark:bg-stone-750 shadow-xs'
                  : 'border-paper-border dark:border-stone-700 bg-paper-50 dark:bg-stone-850 hover:bg-paper-100 dark:hover:bg-stone-800'
              }`}
            >
              <span className="text-lg leading-none mt-0.5 shrink-0">{opt.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-serif font-medium text-ink-900 dark:text-stone-100">
                    {opt.labelZh}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-ink-900 dark:bg-stone-100 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-ink-500 dark:text-stone-400 font-sans leading-normal mt-0.5 line-clamp-1">
                  {opt.descZh}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
