import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { LEVEL_NAMES } from '../../game/progression';

export const LiveAnnouncer: React.FC = () => {
  const [announcement, setAnnouncement] = useState('');
  const gameState = useGameStore((s) => s.gameState);
  const players = useMultiplayerStore((s) => s.players);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);

  // Announce drawer turns and level transitions
  useEffect(() => {
    if (!gameState) return;
    const currentDrawer = gameState.players[gameState.drawerIndex]?.name || '抽牌者';
    const levelName = LEVEL_NAMES[gameState.currentLevel]?.zh || '';
    setAnnouncement(`語音提示：目前輪到 ${currentDrawer} 主持對話。當前階段：${levelName}`);
  }, [gameState?.drawerIndex, gameState?.currentLevel]);

  // Announce new multiplayer players joining
  useEffect(() => {
    if (!isOnlineMode || players.length === 0) return;
    const latestPlayer = players[players.length - 1];
    if (players.length > 1) {
      setAnnouncement(`玩家 ${latestPlayer.name} 已加入房間`);
    }
  }, [players.length, isOnlineMode]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only pointer-events-none"
    >
      {announcement}
    </div>
  );
};
