import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LEVEL_ORDER, LEVEL_NAMES } from '../../game/progression';
import { useGameStore } from '../../store/gameStore';
import { getQuestionSetLevelCounts, getQuestionSetTotalCount } from '../../domain/questions/questionSets';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const currentSetId = useGameStore((s) => s.gameState?.questionSetId) || 'full';
  const levelCounts = getQuestionSetLevelCounts(currentSetId);
  const totalCount = getQuestionSetTotalCount(currentSetId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="遊戲說明與核心理念">
      <div className="space-y-5 text-sm text-ink-800 dark:text-stone-200 font-serif leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
        {/* Core Philosophy */}
        <section className="space-y-1.5 p-3.5 rounded-xl bg-paper-100/80 dark:bg-stone-800/80 border border-paper-border dark:border-stone-700">
          <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-900 dark:text-stone-100">
            核心精神
          </h4>
          <p className="text-ink-700 dark:text-stone-300">
            這不是測驗、不是 Truth or Dare，也沒有勝負計分。這是一副協助兩人或多人放下防備、在彼此聆聽中逐漸深刻認識對方的對話卡牌。
          </p>
        </section>

        {/* 4 Levels */}
        <section className="space-y-3">
          <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-stone-400">
            四個對話深度 (共 {totalCount} 張)
          </h4>
          <div className="space-y-2.5">
            {LEVEL_ORDER.map((lvl) => {
              const info = LEVEL_NAMES[lvl];
              const count = levelCounts[lvl];
              return (
                <div
                  key={lvl}
                  className="p-3 rounded-xl border border-paper-border dark:border-stone-700 bg-paper-50 dark:bg-stone-850 flex items-start gap-3"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: info.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink-900 dark:text-stone-100">{info.zh}</span>
                      <span className="text-xs font-mono text-ink-500 dark:text-stone-400">{count} 張</span>
                    </div>
                    <span className="text-xs text-ink-500 dark:text-stone-400 font-sans block">{info.en}</span>
                    <p className="text-xs text-ink-600 dark:text-stone-300 mt-1 font-sans">
                      {lvl === 'icebreaker' && '破冰行動、有趣分享、降低尷尬，輕鬆打開話匣子。'}
                      {lvl === 'one-star' && '習慣、喜好、生活經驗、個性，開始認識彼此日常。'}
                      {lvl === 'two-star' && '情緒、家庭、價值觀、感情、害怕，進入真實個人內在。'}
                      {lvl === 'three-star' && '脆弱、遺憾、挑戰、人生重大選擇，觸碰最深刻的生命經驗。'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Important Rules */}
        <section className="space-y-2">
          <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-stone-400">
            遊戲基本守則
          </h4>
          <ul className="space-y-1.5 text-xs sm:text-sm text-ink-700 dark:text-stone-300 list-disc list-inside">
            <li>
              <strong>手機是牌盒，不是主角：</strong>抽完牌請把目光回到彼此身上，手機放在桌面上即可。
            </li>
            <li>
              <strong>任何人都可以隨時換一題：</strong>即使是暖身題，感到不自在一律可以點選「換一題」，無須解釋原因。
            </li>
            <li>
              <strong>真誠聆聽，不批判：</strong>每個人分享時，其他人專注聆聽，不需要急著給建議或評價。
            </li>
          </ul>
        </section>

        {/* Privacy Note */}
        <section className="p-3 rounded-xl bg-paper-200/50 dark:bg-stone-800/60 border border-paper-border dark:border-stone-700 text-xs text-ink-600 dark:text-stone-300 font-sans leading-relaxed">
          <strong>隱私承諾：</strong>
          不錄音，也不儲存任何人的回答內容。單機模式的遊戲進度只保存在目前裝置，多人模式只同步遊戲狀態，不傳送對話內容。對話只屬於當下的你們。
        </section>

        <Button variant="primary" fullWidth onClick={onClose}>
          我瞭解了
        </Button>
      </div>
    </Modal>
  );
};
