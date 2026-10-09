import React from 'react';
import { Player } from '../../types/player';

interface PlayerSetupProps {
  players: Player[];
  onChangePlayers: (players: Player[]) => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({
  players,
  onChangePlayers,
}) => {
  const count = players.length;

  const handleSetCount = (targetCount: number) => {
    if (targetCount === count) return;
    if (targetCount > count) {
      const added: Player[] = [];
      for (let i = count + 1; i <= targetCount; i++) {
        added.push({ id: `p_${Date.now()}_${i}`, name: '' });
      }
      onChangePlayers([...players, ...added]);
    } else {
      onChangePlayers(players.slice(0, targetCount));
    }
  };

  const handleUpdateName = (index: number, newName: string) => {
    const updated = [...players];
    updated[index] = { ...updated[index], name: newName };
    onChangePlayers(updated);
  };

  return (
    <div className="space-y-4">
      {/* Quick Player Count Chips */}
      <div>
        <label className="block text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider mb-2">
          玩家人數 (2～8 人)
        </label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleSetCount(num)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-all ${
                count === num
                  ? 'bg-ink-900 text-paper-50 border-ink-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 shadow-xs'
                  : 'bg-paper-100 hover:bg-paper-200/80 text-ink-700 border-paper-border dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Player Names Input */}
      <div>
        <label className="block text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider mb-2">
          玩家暱稱（可留空自動預設）
        </label>
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div key={player.id || idx} className="flex items-center gap-2">
              <span className="w-6 text-xs text-ink-400 dark:text-stone-500 font-mono text-center">
                #{idx + 1}
              </span>
              <input
                type="text"
                value={player.name}
                onChange={(e) => handleUpdateName(idx, e.target.value)}
                placeholder={`玩家 ${idx + 1}`}
                maxLength={20}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-stone-700 bg-paper-50 dark:bg-stone-900/90 focus:bg-white dark:focus:bg-stone-900 text-sm text-ink-900 dark:text-stone-100 placeholder:text-ink-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-ink-900 dark:focus:ring-stone-400 focus:border-ink-900 dark:focus:border-stone-400 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
