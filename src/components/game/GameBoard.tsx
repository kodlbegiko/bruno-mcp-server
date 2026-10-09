import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getCardById, totalDeckCounts } from '../../data/decks';
import { resolveInteraction } from '../../game/interaction';
import { LEVEL_NAMES, getNextLevel } from '../../game/progression';
import { playSlideSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';
import { GameCard } from '../card/GameCard';
import { DrawerIndicator } from './DrawerIndicator';
import { InteractionInstruction } from './InteractionInstruction';
import { PlayerSelector } from './PlayerSelector';
import { DeepenPrompt } from './StageTransition';
import { GameModalsManager } from './GameModalsManager';
import { Button } from '../ui/Button';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useWakeLock } from '../../hooks/useWakeLock';
import { prefetchCardAssets } from '../../utils/prefetch';

interface GameBoardProps {
  onBackToHome: () => void;
  onGameEnd: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  onBackToHome,
  onGameEnd,
}) => {
  const gameState = useGameStore((s) => s.gameState);
  const isCardFlipped = useGameStore((s) => s.isCardFlipped);
  const showThreeStarConsent = useGameStore((s) => s.showThreeStarConsent);
  const showTimeReminder = useGameStore((s) => s.showTimeReminder);
  const selectedPlayerIds = useGameStore((s) => s.selectedPlayerIds);

  const flipCard = useGameStore((s) => s.flipCard);
  const drawNextCard = useGameStore((s) => s.drawNextCard);
  const skipCard = useGameStore((s) => s.skipCard);
  const changeLevel = useGameStore((s) => s.changeLevel);
  const confirmThreeStarConsent = useGameStore((s) => s.confirmThreeStarConsent);
  const cancelThreeStarConsent = useGameStore((s) => s.cancelThreeStarConsent);
  const selectPlayer = useGameStore((s) => s.selectPlayer);
  const dismissTimeReminder = useGameStore((s) => s.dismissTimeReminder);
  const endGame = useGameStore((s) => s.endGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  // Multiplayer online state
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const myPlayerId = useMultiplayerStore((s) => s.myPlayerId);
  const roomCode = useMultiplayerStore((s) => s.roomCode);
  const sendAction = useMultiplayerStore((s) => s.sendAction);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deepenPromptDismissedForLevel, setDeepenPromptDismissedForLevel] = useState<string | null>(null);

  // Screen Wake Lock: Automatically keeps screen awake during face-to-face dialogue
  useWakeLock(true);

  // Time reminder timer check
  useEffect(() => {
    if (!gameState || !gameState.sessionGoalMinutes) return;

    const goalMs = gameState.sessionGoalMinutes * 60 * 1000;
    // Check when session is ~5-8 minutes before end (or at 80% mark, or at least elapsed)
    const reminderThresholdMs = Math.max(goalMs - 5 * 60 * 1000, goalMs * 0.8);

    const checkTimer = setInterval(() => {
      const elapsed = Date.now() - gameState.startedAt;
      if (elapsed >= reminderThresholdMs && !useGameStore.getState().showTimeReminder) {
        useGameStore.setState({ showTimeReminder: true });
        clearInterval(checkTimer);
      }
    }, 15000);

    return () => clearInterval(checkTimer);
  }, [gameState?.startedAt, gameState?.sessionGoalMinutes]);

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <p className="text-ink-600 font-serif mb-4">目前沒有進行中的遊戲</p>
        <Button variant="primary" onClick={onBackToHome}>
          返回首頁
        </Button>
      </div>
    );
  }

  const currentLevel = gameState.currentLevel;
  const currentLevelInfo = LEVEL_NAMES[currentLevel];
  const currentCard = gameState.currentCardId ? getCardById(gameState.currentCardId) : null;
  const drawer = gameState.players[gameState.drawerIndex] || gameState.players[0];

  const currentDeck = gameState.decks[currentLevel];
  const isDeckEmpty = !currentCard;
  const cardsDrawnInLevel = currentDeck.cursor;

  // Zero-latency prefetching: Warm up card back assets in background
  useEffect(() => {
    prefetchCardAssets();
  }, []);

  const interactionInfo = currentCard
    ? resolveInteraction(currentCard, drawer, gameState.players, selectedPlayerIds)
    : null;

  const isMyTurn = !isOnlineMode || !drawer || drawer.id === myPlayerId;

  // Accessible live speech content for screen readers
  const ariaAnnouncement = isCardFlipped && currentCard
    ? `卡牌已翻開。深度：${currentLevelInfo.zh}。題目：${currentCard.zh}。${currentCard.en ? `英文：${currentCard.en}。` : ''}${interactionInfo?.instruction ? `回答規則：${interactionInfo.instruction}` : ''}`
    : `現在輪到【${drawer?.name || '抽牌者'}】抽牌。點擊卡牌翻開。`;

  const handleNextCard = () => {
    playSlideSound(soundEnabled);
    triggerHaptic('light', hapticsEnabled);
    if (isOnlineMode) {
      sendAction({ action: 'DRAW_NEXT_CARD' });
    } else {
      drawNextCard();
    }
  };

  const handleSkipCard = () => {
    playSlideSound(soundEnabled);
    triggerHaptic('medium', hapticsEnabled);
    if (isOnlineMode) {
      sendAction({ action: 'SKIP_CARD' });
    } else {
      skipCard();
    }
  };

  const handleFlipCard = () => {
    if (isOnlineMode) {
      sendAction({ action: 'FLIP_CARD' });
    } else {
      flipCard();
    }
  };

  const handleSelectPlayer = (id: string) => {
    if (isOnlineMode) {
      sendAction({ action: 'SELECT_PLAYER', playerId: id });
    } else {
      selectPlayer(id);
    }
  };

  const handleNextStage = () => {
    const next = getNextLevel(currentLevel);
    if (next) {
      if (isOnlineMode) {
        sendAction({ action: 'CHANGE_LEVEL', level: next });
      } else {
        changeLevel(next);
      }
      setDeepenPromptDismissedForLevel(null);
    }
  };

  const handleConfirmThreeStarConsent = () => {
    if (isOnlineMode) {
      sendAction({ action: 'CONFIRM_THREE_STAR' });
    } else {
      confirmThreeStarConsent();
    }
  };

  const handleCancelThreeStarConsent = () => {
    if (isOnlineMode) {
      sendAction({ action: 'CANCEL_THREE_STAR' });
    } else {
      cancelThreeStarConsent();
    }
  };

  const handleEndGameConfirm = () => {
    if (isOnlineMode) {
      sendAction({ action: 'END_GAME' });
    } else {
      endGame();
    }
    onGameEnd();
  };

  const handleResetGameConfirm = () => {
    if (isOnlineMode) {
      sendAction({ action: 'RESET_GAME' });
    } else {
      resetGame();
    }
    onBackToHome();
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper-50 dark:bg-stone-900 safe-top safe-bottom select-none transition-colors">
      {/* Top Header */}
      <header className="px-4 py-3 sm:py-4 flex items-center justify-between border-b border-paper-border/60 dark:border-stone-800 bg-paper-50/90 dark:bg-stone-900/90 backdrop-blur-sm sticky top-0 z-30">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-ink-600 dark:text-stone-300 hover:text-ink-900 dark:hover:text-stone-100 active:scale-95 transition-all text-xs sm:text-sm font-medium py-1 px-2 rounded-lg hover:bg-paper-200/50 dark:hover:bg-stone-800/60"
          aria-label="回首頁"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-serif">回首頁</span>
        </button>

        {/* Level badge / Deck Status & Online indicator */}
        <div className="flex items-center gap-2">
          {isOnlineMode && roomCode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>房號 {roomCode}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-100 dark:bg-stone-800 hover:bg-paper-200/70 dark:hover:bg-stone-700/70 border border-paper-border dark:border-stone-700 transition-colors active:scale-95"
            aria-label="查看牌組資訊"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentLevelInfo.color }}
            />
            <span className="text-xs sm:text-sm font-serif font-medium text-ink-900 dark:text-stone-100">
              {currentLevelInfo.zh}
            </span>
            <span className="text-[11px] font-mono text-ink-500 dark:text-stone-400">
              {currentDeck.cursor}/{totalDeckCounts[currentLevel]}
            </span>
          </button>
        </div>

        {/* Menu button */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-ink-600 dark:text-stone-300 hover:text-ink-900 dark:hover:text-stone-100 hover:bg-paper-200/50 dark:hover:bg-stone-800/60 transition-colors"
          aria-label="開啟選單"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Main Playing Area */}
      <main className="flex-1 flex flex-col items-center justify-between px-4 py-3 sm:py-6 max-w-lg mx-auto w-full">
        {/* Drawer turn banner */}
        <div className="w-full flex flex-col items-center mb-2 sm:mb-3 gap-1">
          {isOnlineMode && isMyTurn && (
            <span className="text-[11px] font-medium text-amber-800 bg-amber-100/90 px-3 py-0.5 rounded-full border border-amber-200 shadow-2xs">
              ✨ 輪到你抽牌與主持！
            </span>
          )}
          <DrawerIndicator drawer={drawer} />
        </div>

        {/* Card and Role Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[380px] sm:min-h-[460px] my-auto">
          {currentCard ? (
            <div className="flex flex-col items-center w-full">
              <GameCard
                card={currentCard}
                isFlipped={isCardFlipped}
                onFlip={isMyTurn ? handleFlipCard : () => {}}
                canSwipe={isMyTurn}
                onSwipeRight={handleNextCard}
                onSwipeLeft={handleSkipCard}
              />

              {/* Interaction Details (Shown when flipped) */}
              {isCardFlipped && interactionInfo && (
                <div className="w-full max-w-[340px] sm:max-w-[380px] mt-3 space-y-2">
                  <InteractionInstruction instruction={interactionInfo.instruction} />

                  {interactionInfo.needsPlayerSelection && (
                    <PlayerSelector
                      drawer={drawer}
                      players={gameState.players}
                      selectedPlayerIds={selectedPlayerIds}
                      onSelectPlayer={isMyTurn ? handleSelectPlayer : () => {}}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Empty deck state */
            <div className="text-center p-8 rounded-3xl bg-paper-100 dark:bg-stone-800 border border-paper-border dark:border-stone-700 max-w-sm">
              <span className="text-3xl mb-3 block">🎴</span>
              <h3 className="font-serif text-lg font-medium text-ink-900 dark:text-stone-100 mb-2">
                本階段牌組已全部抽完
              </h3>
              <p className="text-xs text-ink-500 dark:text-stone-400 mb-6 leading-relaxed">
                您可以繼續前往下一個對話深度，或是結束本場對話進行溫暖收尾。
              </p>
              {getNextLevel(currentLevel) && isMyTurn && (
                <Button variant="primary" fullWidth onClick={handleNextStage}>
                  前往下一階段：{LEVEL_NAMES[getNextLevel(currentLevel)!].zh}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Guided Journey Non-intrusive Stage Progression Prompt */}
        {gameState.mode === 'guided' &&
          getNextLevel(currentLevel) &&
          deepenPromptDismissedForLevel !== currentLevel && (
            <DeepenPrompt
              currentLevel={currentLevel}
              cardsDrawnInLevel={cardsDrawnInLevel}
              isDeckEmpty={isDeckEmpty}
              onEnterNextLevel={handleNextStage}
              onDismiss={() => setDeepenPromptDismissedForLevel(currentLevel)}
            />
          )}

        {/* Bottom Control Buttons */}
        <div className="w-full max-w-[340px] sm:max-w-[380px] pt-3 pb-2 sm:pb-4 flex flex-col gap-2.5">
          {isOnlineMode && !isMyTurn ? (
            <div className="w-full text-center py-3.5 px-4 rounded-2xl bg-paper-100/90 dark:bg-stone-800/90 border border-paper-border dark:border-stone-700 shadow-xs">
              <span className="text-xs sm:text-sm font-serif text-ink-700 dark:text-stone-300 block">
                等待抽牌者【{drawer.name}】{isCardFlipped ? '抽下一張卡牌' : '翻開卡牌'}...
              </span>
            </div>
          ) : !isCardFlipped ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleFlipCard}
              disabled={!currentCard}
              className="shadow-md"
            >
              翻開卡牌
            </Button>
          ) : (
            <div className="flex gap-2.5 w-full">
              <Button
                variant="ghost"
                size="md"
                onClick={handleSkipCard}
                className="flex-1 text-ink-600 border border-paper-border hover:bg-paper-200/50"
                aria-label="換一題（免理由跳過此卡牌）"
              >
                換一題
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextCard}
                className="flex-[2] shadow-md"
                aria-label="抽下一張卡牌"
              >
                下一張
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Accessible Live Region for Screen Readers (a11y) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </div>

      {/* Centralized Modals & Slide-overs */}
      <GameModalsManager
        showThreeStarConsent={showThreeStarConsent}
        onConfirmThreeStarConsent={handleConfirmThreeStarConsent}
        onCancelThreeStarConsent={handleCancelThreeStarConsent}
        showTimeReminder={showTimeReminder}
        onContinueTimeReminder={dismissTimeReminder}
        onEndGame={handleEndGameConfirm}
        isSettingsOpen={isSettingsOpen}
        onCloseSettings={() => setIsSettingsOpen(false)}
        onResetGame={handleResetGameConfirm}
      />
    </div>
  );
};
