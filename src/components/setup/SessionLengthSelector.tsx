import React from 'react';
import { SessionGoalMinutes } from '../../types/game';

interface SessionLengthSelectorProps {
  sessionGoal: SessionGoalMinutes;
  onChangeSessionGoal: (val: SessionGoalMinutes) => void;
}

export const SessionLengthSelector: React.FC<SessionLengthSelectorProps> = ({
  sessionGoal,
  onChangeSessionGoal,
}) => {
  const options: { label: string; value: SessionGoalMinutes; sub?: string }[] = [
    { label: '不限時間', value: null, sub: '推薦（隨性深入）' },
    { label: '15 分鐘', value: 15, sub: '快速破冰' },
    { label: '30 分鐘', value: 30, sub: '咖啡時光' },
    { label: '60 分鐘', value: 60, sub: '深度交流' },
    { label: '90 分鐘', value: 90, sub: '完整長談' },
  ];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider mb-1">
          預計遊戲時間
        </label>
        <p className="text-[11px] text-ink-500 dark:text-stone-400 font-sans">
          時間僅用於接近時的溫馨提醒，不會硬性倒數中斷對話。
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChangeSessionGoal(opt.value)}
            className={`p-3 rounded-xl border text-left transition-all ${
              sessionGoal === opt.value
                ? 'bg-ink-900 text-paper-50 border-ink-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 shadow-xs'
                : 'bg-paper-100 hover:bg-paper-200/80 text-ink-800 border-paper-border dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700 dark:hover:bg-stone-700'
            }`}
          >
            <div className="text-sm font-medium">{opt.label}</div>
            {opt.sub && (
              <div
                className={`text-[10px] mt-0.5 ${
                  sessionGoal === opt.value
                    ? 'text-paper-200 dark:text-stone-600'
                    : 'text-ink-500 dark:text-stone-400'
                }`}
              >
                {opt.sub}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
