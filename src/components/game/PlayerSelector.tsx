import React from 'react';
import { Player } from '../../types/player';

interface PlayerSelectorProps {
  drawer: Player;
  players: Player[];
  selectedPlayerIds: string[];
  onSelectPlayer: (id: string) => void;
  maxSelection?: number;
  className?: string;
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  drawer,
  players,
  selectedPlayerIds,
  onSelectPlayer,
  className = '',
}) => {
  // Candidate players are everyone except drawer
  const candidates = players.filter((p) => p.id !== drawer.id);

  if (candidates.length === 0) return null;

  return (
    <div className={`flex flex-col items-center gap-2 mt-2 select-none ${className}`}>
      <span className="text-xs text-ink-500 dark:text-stone-400 font-medium tracking-wide">
        請點選互動對象：
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        {candidates.map((player) => {
          const isSelected = selectedPlayerIds.includes(player.id);
          return (
            <button
              key={player.id}
              onClick={() => onSelectPlayer(player.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 border ${
                isSelected
                  ? 'bg-ink-900 text-paper-50 border-ink-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 shadow-sm'
                  : 'bg-paper-100 text-ink-700 border-paper-border hover:bg-paper-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700'
              }`}
            >
              {player.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
