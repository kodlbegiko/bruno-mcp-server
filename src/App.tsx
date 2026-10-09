import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useGameStore } from './store/gameStore';
import { useMultiplayerStore } from './store/multiplayerStore';
import { GameMode, SessionGoalMinutes } from './types/game';
import { CardLevel } from './types/card';
import { Home } from './pages/Home';
import { Setup } from './pages/Setup';
import { Game } from './pages/Game';
import { Ending } from './pages/Ending';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { LiveAnnouncer } from './components/ui/LiveAnnouncer';

// Code-split multiplayer modules to reduce initial main bundle
const OnlineLobby = lazy(() =>
  import('./pages/OnlineLobby').then((m) => ({ default: m.OnlineLobby }))
);
const WaitingRoom = lazy(() =>
  import('./components/multiplayer/WaitingRoom').then((m) => ({ default: m.WaitingRoom }))
);

type AppRoute = 'home' | 'setup' | 'game' | 'ending' | 'online-lobby' | 'online-waiting';

export const App: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const initGame = useGameStore((s) => s.initGame);

  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const onlinePlayers = useMultiplayerStore((s) => s.players);
  const connectionStatus = useMultiplayerStore((s) => s.connectionStatus);
  const errorMessage = useMultiplayerStore((s) => s.errorMessage);
  const broadcastState = useMultiplayerStore((s) => s.broadcastState);
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom);
  const isReconnecting = useMultiplayerStore((s) => s.isReconnecting);
  const reconnect = useMultiplayerStore((s) => s.reconnect);
  const multiplayerRole = useMultiplayerStore((s) => s.role);

  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);

  // Stored mode, goal & level for host to trigger game start
  const [hostGameMode, setHostGameMode] = useState<GameMode>('guided');
  const [hostStartingLevel, setHostStartingLevel] = useState<CardLevel>('icebreaker');
  const [hostSessionGoal, setHostSessionGoal] = useState<SessionGoalMinutes>(null);

  // Check URL query for direct room invite (?room=ABC123)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialRoomCode(roomParam.trim().toUpperCase());
        setCurrentRoute('online-lobby');
      }
    }
  }, []);

  // For Guest players: Auto-transition between waiting room, game board, and ending screen
  useEffect(() => {
    if (isOnlineMode && gameState) {
      if (gameState.status === 'playing' && currentRoute === 'online-waiting') {
        setCurrentRoute('game');
      } else if (gameState.status === 'ended' && currentRoute === 'game') {
        setCurrentRoute('ending');
      }
    }
  }, [isOnlineMode, gameState, currentRoute]);

  const handleResumeGame = () => {
    const success = resumeGame();
    if (success) {
      setCurrentRoute('game');
    }
  };

  const handleStartNewGame = () => {
    setCurrentRoute('setup');
  };

  const handleStartGameFromSetup = () => {
    setCurrentRoute('game');
  };

  const handleStartOnlineGame = () => {
    setCurrentRoute('online-lobby');
  };

  const handleRoomReady = (
    mode: GameMode,
    sessionGoal: SessionGoalMinutes,
    startingLevel?: CardLevel
  ) => {
    setHostGameMode(mode);
    setHostSessionGoal(sessionGoal);
    if (startingLevel) setHostStartingLevel(startingLevel);
    setCurrentRoute('online-waiting');
  };

  const handleHostStartOnlineGame = () => {
    // Convert onlinePlayers to Player[]
    const gamePlayers = onlinePlayers.map((p, idx) => ({
      id: p.id,
      name: p.name.trim() || `玩家 ${idx + 1}`,
    }));

    useMultiplayerStore.setState({ isGameStarted: true });
    initGame(
      gamePlayers,
      hostGameMode,
      hostSessionGoal,
      hostGameMode === 'free' ? hostStartingLevel : 'icebreaker'
    );
    // Broadcast newly initiated game state to all connected peers
    broadcastState();
    setCurrentRoute('game');
  };

  const handleLeaveOnlineRoom = () => {
    leaveRoom();
    setCurrentRoute('home');
  };

  const handleBackToHome = () => {
    if (isOnlineMode) {
      leaveRoom();
    }
    setCurrentRoute('home');
  };

  const handleGameEnd = () => {
    setCurrentRoute('ending');
  };

  const handlePlayAgain = () => {
    if (isOnlineMode) {
      setCurrentRoute('online-lobby');
    } else {
      setCurrentRoute('setup');
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-paper-50 dark:bg-stone-900 text-ink-900 dark:text-stone-100 font-sans transition-colors">
      <OfflineBanner />
      <LiveAnnouncer />
      {currentRoute === 'home' && (
        <Home
          onStartNewGame={handleStartNewGame}
          onResumeGame={handleResumeGame}
          onStartOnlineGame={handleStartOnlineGame}
        />
      )}

      {currentRoute === 'setup' && (
        <Setup
          onBackToHome={handleBackToHome}
          onStartGame={handleStartGameFromSetup}
        />
      )}

      {currentRoute === 'online-lobby' && (
        <Suspense
          fallback={
            <div className="min-h-[100dvh] bg-paper-50 flex items-center justify-center font-serif text-ink-600">
              載入連線大廳...
            </div>
          }
        >
          <OnlineLobby
            initialRoomCode={initialRoomCode}
            onBackToHome={handleBackToHome}
            onRoomReady={handleRoomReady}
          />
        </Suspense>
      )}

      {currentRoute === 'online-waiting' && (
        <Suspense
          fallback={
            <div className="min-h-[100dvh] bg-paper-50 flex items-center justify-center font-serif text-ink-600">
              載入候車室...
            </div>
          }
        >
          <WaitingRoom
            onStartGame={handleHostStartOnlineGame}
            onLeaveRoom={handleLeaveOnlineRoom}
          />
        </Suspense>
      )}

      {currentRoute === 'game' && (
        <Game
          onBackToHome={handleBackToHome}
          onGameEnd={handleGameEnd}
        />
      )}

      {currentRoute === 'ending' && (
        <Ending
          onPlayAgain={handlePlayAgain}
          onBackToHome={handleBackToHome}
        />
      )}

      {/* Disconnect & Reconnect Alert Modal for Multiplayer */}
      {isOnlineMode &&
        (connectionStatus === 'disconnected' || isReconnecting) &&
        errorMessage &&
        currentRoute !== 'home' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-ink-900/40 backdrop-blur-xs">
            <div className="bg-paper-50 p-6 rounded-2xl border border-paper-border max-w-sm w-full text-center space-y-4 shadow-xl">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl ${
                  isReconnecting
                    ? 'bg-amber-100 text-amber-700 animate-pulse'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {isReconnecting ? '🔄' : '⚠️'}
              </div>
              <h3 className="font-serif text-lg font-medium text-ink-900">
                {isReconnecting ? '正在重新連線...' : '連線已中斷'}
              </h3>
              <p className="text-xs text-ink-600 font-sans leading-relaxed">
                {errorMessage}
              </p>

              <div className="flex flex-col gap-2 pt-1">
                {!isReconnecting && multiplayerRole === 'guest' && (
                  <button
                    type="button"
                    onClick={() => reconnect()}
                    className="w-full py-2.5 px-4 rounded-xl bg-ink-900 text-paper-50 text-sm font-medium hover:bg-ink-800 transition-colors shadow-sm"
                  >
                    手動重新連線
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLeaveOnlineRoom}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    !isReconnecting && multiplayerRole === 'guest'
                      ? 'bg-paper-200/70 text-ink-700 hover:bg-paper-200'
                      : 'bg-ink-900 text-paper-50 hover:bg-ink-800'
                  }`}
                >
                  返回首頁
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default App;
