import React from 'react';
import { QUESTION_SETS, QuestionSetId } from '../../domain/questions/questionSets';

interface QuestionSetSelectorProps {
  questionSetId: QuestionSetId;
  onChangeQuestionSetId: (id: QuestionSetId) => void;
}

export const QuestionSetSelector: React.FC<QuestionSetSelectorProps> = ({
  questionSetId,
  onChangeQuestionSetId,
}) => {
  const options: QuestionSetId[] = ['full', 'classic', 'expansion-only'];

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium font-serif text-ink-900 dark:text-stone-100 block">
          題庫選擇
        </label>
        <span className="text-[11px] text-ink-500 dark:text-stone-400">
          依聚會氛圍挑選題庫組合
        </span>
      </div>

      <div className="space-y-2">
        {options.map((id) => {
          const option = QUESTION_SETS[id];
          const isSelected = questionSetId === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeQuestionSetId(id)}
              className={`w-full p-3 sm:p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                isSelected
                  ? 'border-indigo-600/70 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-xs'
                  : 'border-paper-border dark:border-stone-700 bg-paper-50 dark:bg-stone-850 hover:bg-paper-200/50 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      isSelected
                        ? 'text-indigo-900 dark:text-indigo-200 font-serif'
                        : 'text-ink-800 dark:text-stone-200'
                    }`}
                  >
                    {option.nameZh}
                  </span>
                  {option.recommended && (
                    <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-indigo-600 text-white dark:bg-indigo-500">
                      推薦 · 130 題
                    </span>
                  )}
                  {id === 'classic' && (
                    <span className="text-[10px] font-sans font-normal px-2 py-0.5 rounded-full bg-paper-200 dark:bg-stone-700 text-ink-600 dark:text-stone-300">
                      70 題
                    </span>
                  )}
                  {id === 'expansion-only' && (
                    <span className="text-[10px] font-sans font-normal px-2 py-0.5 rounded-full bg-paper-200 dark:bg-stone-700 text-ink-600 dark:text-stone-300">
                      60 題
                    </span>
                  )}
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500'
                      : 'border-ink-300 dark:border-stone-600'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              <p className="text-xs text-ink-500 dark:text-stone-400 font-sans leading-relaxed">
                {option.descriptionZh}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
