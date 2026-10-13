import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from './store/gameStore';
import { useMultiplayerStore } from './store/multiplayerStore';
import { GameMode, SessionGoalMinutes } from './types/game';
import { CardLevel } from './types/card';
import { RelationshipTag } from './data/cards/types';
import { QuestionSetId } from './domain/questions/questionSets';
import { Home } from './pages/Home';
import { Setup } from './pages/Setup';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { LiveAnnouncer } from './components/ui/LiveAnnouncer';

// Code-split heavy routes to minimize initial bundle size
const Game = lazy(() => import('./pages/Game').then((m) => ({ default: m.Game })));
const Ending = lazy(() => import('./pages/Ending').then((m) => ({ default: m.Ending })));
const OnlineLobby = lazy(() =>
  import('./pages/OnlineLobby').then((m) => ({ default: m.OnlineLobby }))
);
const WaitingRoom = lazy(() =>
  import('./components/multiplayer/WaitingRoom').then((m) => ({ default: m.WaitingRoom }))
);

const RouteLoadingFallback: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[100dvh] bg-paper-50 dark:bg-stone-900 flex items-center justify-center font-serif text-ink-600 dark:text-stone-300 transition-colors">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-stone-300 dark:border-stone-700 border-t-ink-800 dark:border-t-stone-200 rounded-full animate-spin" />
        <span className="text-sm tracking-wider opacity-80">{t('app.loading')}</span>
      </div>
    </div>
  );
};

type AppRoute = 'home' | 'setup' | 'game' | 'ending' | 'online-lobby' | 'online-waiting';

export const App: React.FC = () => {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const initGame = useGameStore((s) => s.initGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const onlinePlayers = useMultiplayerStore((s) => s.players);
  const connectionStatus = useMultiplayerStore((s) => s.connectionStatus);
  const errorMessage = useMultiplayerStore((s) => s.errorMessage);
  const broadcastState = useMultiplayerStore((s) => s.broadcastState);
  const sendAction = useMultiplayerStore((s) => s.sendAction);
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom);
  const isReconnecting = useMultiplayerStore((s) => s.isReconnecting);
  const reconnect = useMultiplayerStore((s) => s.reconnect);
  const multiplayerRole = useMultiplayerStore((s) => s.role);
  const isGameStarted = useMultiplayerStore((s) => s.isGameStarted);

  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);

  // Stored mode, goal & level for host to trigger game start
  const [hostGameMode, setHostGameMode] = useState<GameMode>('guided');
  const [hostStartingLevel, setHostStartingLevel] = useState<CardLevel>('icebreaker');
  const [hostSessionGoal, setHostSessionGoal] = useState<SessionGoalMinutes>(null);
  const [hostQuestionSetId, setHostQuestionSetId] = useState<QuestionSetId>('full');
  const [hostTargetRelationship, setHostTargetRelationship] = useState<RelationshipTag | undefined>(undefined);

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
    if (isOnlineMode) {
      if (gameState) {
        if (gameState.status === 'playing' && currentRoute === 'online-waiting') {
          setCurrentRoute('game');
        } else if (gameState.status === 'ended' && currentRoute === 'game') {
          setCurrentRoute('ending');
        }
      } else if (!isGameStarted && (currentRoute === 'game' || currentRoute === 'ending')) {
        // Game state was reset or cleared while in game or ending: return to waiting room if connected, else home
        setCurrentRoute(connectionStatus === 'connected' ? 'online-waiting' : 'home');
      }
    }
  }, [isOnlineMode, gameState, currentRoute, isGameStarted, connectionStatus]);

  const handleResumeGame = () => {
    const success = resumeGame();
    if (success) {
      setCurrentRoute('game');
    }
  };

  const handleStartNewGame = () => {
    setCurrentRoute('setup');
  };

  const handleQuickStart = () => {
    const defaultPlayers = [
      { id: 'player_1', name: '玩家 1' },
      { id: 'player_2', name: '玩家 2' },
    ];
    initGame(defaultPlayers, 'guided', null, 'icebreaker', 'full');
    setCurrentRoute('game');
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
    startingLevel?: CardLevel,
    questionSetId: QuestionSetId = 'full',
    targetRelationship?: RelationshipTag
  ) => {
    setHostGameMode(mode);
    setHostSessionGoal(sessionGoal);
    if (startingLevel) setHostStartingLevel(startingLevel);
    setHostQuestionSetId(questionSetId);
    setHostTargetRelationship(targetRelationship);
    useMultiplayerStore.getState().setRoomConfig({
      questionSetId,
      mode,
      startingLevel,
      sessionGoal,
      targetRelationship,
    });
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
      hostGameMode === 'free' ? hostStartingLevel : 'icebreaker',
      hostQuestionSetId,
      hostTargetRelationship
    );

    const isDirectThreeStar = hostGameMode === 'free' && hostStartingLevel === 'three-star';
    if (isDirectThreeStar) {
      useMultiplayerStore.setState({
        threeStarConsent: {
          status: 'pending',
          requiredPlayerIds: onlinePlayers.map((p) => p.id),
          acceptedPlayerIds: [],
          declinedPlayerIds: [],
        },
      });
    }

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
    resetGame();
    setCurrentRoute('home');
  };

  const handleGameEnd = () => {
    setCurrentRoute('ending');
  };

  const handlePlayAgain = () => {
    if (!isOnlineMode) {
      resetGame();
      setCurrentRoute('setup');
      return;
    }

    if (multiplayerRole === 'host') {
      sendAction({ action: 'RESET_GAME' });
      setCurrentRoute('online-waiting');
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
          onQuickStart={handleQuickStart}
        />
      )}

      {currentRoute === 'setup' && (
        <Setup
          onBackToHome={handleBackToHome}
          onStartGame={handleStartGameFromSetup}
        />
      )}

      {currentRoute === 'online-lobby' && (
        <Suspense fallback={<RouteLoadingFallback />}>
          <OnlineLobby
            initialRoomCode={initialRoomCode}
            onBackToHome={handleBackToHome}
            onRoomReady={handleRoomReady}
          />
        </Suspense>
      )}

      {currentRoute === 'online-waiting' && (
        <Suspense fallback={<RouteLoadingFallback />}>
          <WaitingRoom
            questionSetId={hostQuestionSetId}
            onStartGame={handleHostStartOnlineGame}
            onLeaveRoom={handleLeaveOnlineRoom}
          />
        </Suspense>
      )}

      {currentRoute === 'game' && (
        <Suspense fallback={<RouteLoadingFallback />}>
          <Game
            onBackToHome={handleBackToHome}
            onGameEnd={handleGameEnd}
          />
        </Suspense>
      )}

      {currentRoute === 'ending' && (
        <Suspense fallback={<RouteLoadingFallback />}>
          <Ending
            onPlayAgain={handlePlayAgain}
            onBackToHome={handleBackToHome}
          />
        </Suspense>
      )}

      {/* Disconnect & Reconnect Alert Modal for Multiplayer */}
      {isOnlineMode &&
        (connectionStatus === 'disconnected' || isReconnecting) &&
        errorMessage &&
        currentRoute !== 'home' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-ink-900/50 dark:bg-black/60 backdrop-blur-xs">
            <div className="bg-paper-50 dark:bg-stone-850 p-6 rounded-2xl border border-paper-border dark:border-stone-700 max-w-sm w-full text-center space-y-4 shadow-xl">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl ${
                  isReconnecting
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 animate-pulse'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                }`}
              >
                {isReconnecting ? '🔄' : '⚠️'}
              </div>
              <h3 className="font-serif text-lg font-medium text-ink-900 dark:text-stone-100">
                {isReconnecting ? t('multiplayer.reconnecting') : t('multiplayer.connection_lost')}
              </h3>
              <p className="text-xs text-ink-600 dark:text-stone-300 font-sans leading-relaxed">
                {errorMessage}
              </p>

              <div className="flex flex-col gap-2 pt-1">
                {!isReconnecting && multiplayerRole === 'guest' && (
                  <button
                    type="button"
                    onClick={() => reconnect()}
                    className="w-full py-2.5 px-4 rounded-xl bg-ink-900 dark:bg-stone-100 text-paper-50 dark:text-stone-900 text-sm font-medium hover:bg-ink-800 dark:hover:bg-stone-200 transition-colors shadow-sm"
                  >
                    {t('multiplayer.retry')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLeaveOnlineRoom}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    !isReconnecting && multiplayerRole === 'guest'
                      ? 'bg-paper-200/70 dark:bg-stone-750 text-ink-700 dark:text-stone-200 hover:bg-paper-200 dark:hover:bg-stone-700'
                      : 'bg-ink-900 dark:bg-stone-100 text-paper-50 dark:text-stone-900 hover:bg-ink-800 dark:hover:bg-stone-200'
                  }`}
                >
                  {t('multiplayer.back_to_home')}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default App;
