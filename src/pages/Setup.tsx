import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Player } from '../types/player';
import { GameMode, SessionGoalMinutes } from '../types/game';
import { CardLevel } from '../types/card';
import { PlayerSetup } from '../components/setup/PlayerSetup';
import { ModeSelector } from '../components/setup/ModeSelector';
import { SessionLengthSelector } from '../components/setup/SessionLengthSelector';
import { Button } from '../components/ui/Button';

interface SetupProps {
  onBackToHome: () => void;
  onStartGame: () => void;
}

export const Setup: React.FC<SetupProps> = ({ onBackToHome, onStartGame }) => {
  const initGame = useGameStore((s) => s.initGame);

  const [players, setPlayers] = useState<Player[]>([
    { id: 'p_1', name: '' },
    { id: 'p_2', name: '' },
  ]);
  const [mode, setMode] = useState<GameMode>('guided');
  const [startingLevel, setStartingLevel] = useState<CardLevel>('icebreaker');
  const [sessionGoal, setSessionGoal] = useState<SessionGoalMinutes>(null);

  const handleStart = () => {
    // Fill in default names if empty
    const sanitizedPlayers = players.map((p, idx) => ({
      id: p.id || `player_${idx + 1}`,
      name: p.name.trim() || `玩家 ${idx + 1}`,
    }));

    initGame(sanitizedPlayers, mode, sessionGoal, mode === 'free' ? startingLevel : 'icebreaker');
    onStartGame();
  };

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-stone-900 flex flex-col justify-between px-4 py-5 sm:py-8 safe-top safe-bottom max-w-md mx-auto w-full transition-colors">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-3 border-b border-paper-border/60 dark:border-stone-800">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-ink-600 dark:text-stone-300 hover:text-ink-900 dark:hover:text-stone-100 py-1 px-2 rounded-lg hover:bg-paper-200/50 dark:hover:bg-stone-800/60 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-serif">返回</span>
        </button>
        <h2 className="font-serif font-medium text-ink-900 dark:text-stone-100 text-base">建立新對話</h2>
        <div className="w-12" /> {/* Spacer */}
      </header>

      {/* Main Settings Sections */}
      <main className="flex-1 py-5 space-y-6 overflow-y-auto pr-0.5">
        {/* Section 1: Players */}
        <section className="bg-paper-100/60 dark:bg-stone-800/60 p-4 rounded-2xl border border-paper-border dark:border-stone-700">
          <PlayerSetup players={players} onChangePlayers={setPlayers} />
        </section>

        {/* Section 2: Mode */}
        <section className="bg-paper-100/60 dark:bg-stone-800/60 p-4 rounded-2xl border border-paper-border dark:border-stone-700">
          <ModeSelector
            mode={mode}
            onChangeMode={setMode}
            startingLevel={startingLevel}
            onChangeStartingLevel={setStartingLevel}
          />
        </section>

        {/* Section 3: Session Duration */}
        <section className="bg-paper-100/60 dark:bg-stone-800/60 p-4 rounded-2xl border border-paper-border dark:border-stone-700">
          <SessionLengthSelector
            sessionGoal={sessionGoal}
            onChangeSessionGoal={setSessionGoal}
          />
        </section>
      </main>

      {/* Bottom CTA */}
      <footer className="pt-3 border-t border-paper-border/60 dark:border-stone-800">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleStart}
          className="shadow-lg"
        >
          開始對話
        </Button>
      </footer>
    </div>
  );
};
