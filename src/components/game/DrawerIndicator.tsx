import React from 'react';
import { Player } from '../../types/player';

interface DrawerIndicatorProps {
  drawer: Player;
  className?: string;
}

export const DrawerIndicator: React.FC<DrawerIndicatorProps> = ({ drawer, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-200/80 dark:bg-stone-800/80 border border-paper-border dark:border-stone-700 text-xs text-ink-700 dark:text-stone-300 font-medium ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 dark:bg-stone-400" />
      <span>{drawer.name} 抽牌</span>
    </div>
  );
};
