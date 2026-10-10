import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { GameMode, SessionGoalMinutes } from '../types/game';
import { CardLevel } from '../types/card';
import { ModeSelector } from '../components/setup/ModeSelector';
import { SessionLengthSelector } from '../components/setup/SessionLengthSelector';
import { QuestionSetSelector } from '../components/setup/QuestionSetSelector';
import { QuestionSetId } from '../domain/questions/questionSets';
import { Button } from '../components/ui/Button';
import { Camera } from 'lucide-react';

const QrScannerModal = lazy(() =>
  import('../components/multiplayer/QrScannerModal').then((m) => ({ default: m.QrScannerModal }))
);

interface OnlineLobbyProps {
  initialRoomCode?: string | null;
  onBackToHome: () => void;
  onRoomReady: (
    mode: GameMode,
    sessionGoal: SessionGoalMinutes,
    startingLevel?: CardLevel,
    questionSetId?: QuestionSetId
  ) => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  initialRoomCode,
  onBackToHome,
  onRoomReady,
}) => {
  const createRoom = useMultiplayerStore((s) => s.createRoom);
  const joinRoom = useMultiplayerStore((s) => s.joinRoom);
  const connectionStatus = useMultiplayerStore((s) => s.connectionStatus);
  const errorMessage = useMultiplayerStore((s) => s.errorMessage);
  const clearError = useMultiplayerStore((s) => s.clearError);

  const [activeTab, setActiveTab] = useState<'create' | 'join'>(
    initialRoomCode ? 'join' : 'create'
  );

  // Host options
  const [hostName, setHostName] = useState('');
  const [mode, setMode] = useState<GameMode>('guided');
  const [startingLevel, setStartingLevel] = useState<CardLevel>('icebreaker');
  const [sessionGoal, setSessionGoal] = useState<SessionGoalMinutes>(null);
  const [questionSetId, setQuestionSetId] = useState<QuestionSetId>('full');

  // Guest options
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [guestName, setGuestName] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode.toUpperCase());
      setActiveTab('join');
    }
  }, [initialRoomCode]);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    clearError();
    try {
      await createRoom(hostName || '房主');
      onRoomReady(mode, sessionGoal, mode === 'free' ? startingLevel : 'icebreaker', questionSetId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) return;
    setIsLoading(true);
    clearError();
    try {
      await joinRoom(roomCodeInput.trim(), guestName || '旅人');
      onRoomReady('guided', null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper-50 dark:bg-stone-900 flex flex-col justify-between px-4 py-5 sm:py-8 safe-top safe-bottom max-w-md mx-auto w-full transition-colors">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-3 border-b border-paper-border/60 dark:border-stone-800">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-ink-600 dark:text-stone-400 hover:text-ink-900 dark:hover:text-stone-100 py-1 px-2 rounded-lg hover:bg-paper-200/50 dark:hover:bg-stone-800/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-serif">回首頁</span>
        </button>
        <h2 className="font-serif font-medium text-ink-900 dark:text-stone-100 text-base">多人連線大廳</h2>
        <div className="w-12" />
      </header>

      {/* Mode Tabs */}
      <div className="flex bg-paper-200/60 dark:bg-stone-800/60 p-1 rounded-2xl my-4 border border-paper-border dark:border-stone-700">
        <button
          type="button"
          onClick={() => {
            clearError();
            setActiveTab('create');
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all ${
            activeTab === 'create'
              ? 'bg-paper-50 dark:bg-stone-700 text-ink-900 dark:text-stone-100 shadow-xs'
              : 'text-ink-600 dark:text-stone-400 hover:text-ink-900 dark:hover:text-stone-100'
          }`}
        >
          建立房間 (房主)
        </button>
        <button
          type="button"
          onClick={() => {
            clearError();
            setActiveTab('join');
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all ${
            activeTab === 'join'
              ? 'bg-paper-50 dark:bg-stone-700 text-ink-900 dark:text-stone-100 shadow-xs'
              : 'text-ink-600 dark:text-stone-400 hover:text-ink-900 dark:hover:text-stone-100'
          }`}
        >
          加入房間
        </button>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3.5 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-rose-500 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto space-y-5 pr-0.5">
        {activeTab === 'create' ? (
          <div className="space-y-5">
            {/* Host Name */}
            <div className="bg-paper-100/60 dark:bg-stone-850 p-4 rounded-2xl border border-paper-border dark:border-stone-800">
              <label className="block text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                你的暱稱
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="房主"
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-stone-700 bg-paper-50 dark:bg-stone-800 focus:bg-white dark:focus:bg-stone-750 text-sm text-ink-900 dark:text-stone-100 placeholder:text-ink-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-ink-900 dark:focus:ring-stone-400 focus:border-ink-900 dark:focus:border-stone-400 transition-colors"
              />
            </div>

            {/* Mode selection */}
            <div className="bg-paper-100/60 dark:bg-stone-850 p-4 rounded-2xl border border-paper-border dark:border-stone-800">
              <ModeSelector
                mode={mode}
                onChangeMode={setMode}
                startingLevel={startingLevel}
                onChangeStartingLevel={setStartingLevel}
              />
            </div>

            {/* Question Set selection */}
            <div className="bg-paper-100/60 dark:bg-stone-850 p-4 rounded-2xl border border-paper-border dark:border-stone-800">
              <QuestionSetSelector
                questionSetId={questionSetId}
                onChangeQuestionSetId={setQuestionSetId}
              />
            </div>

            {/* Session goal */}
            <div className="bg-paper-100/60 dark:bg-stone-850 p-4 rounded-2xl border border-paper-border dark:border-stone-800">
              <SessionLengthSelector
                sessionGoal={sessionGoal}
                onChangeSessionGoal={setSessionGoal}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Room Code input */}
            <div className="bg-paper-100/60 dark:bg-stone-850 p-5 rounded-2xl border border-paper-border dark:border-stone-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  輸入 6 碼房間代碼
                </label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="例如：B8K2X9"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-xl border border-paper-border dark:border-stone-700 bg-paper-50 dark:bg-stone-800 focus:bg-white dark:focus:bg-stone-750 text-lg font-mono font-bold tracking-widest text-ink-900 dark:text-stone-100 placeholder:text-ink-300 dark:placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-ink-900 dark:focus:ring-stone-400 focus:border-ink-900 dark:focus:border-stone-400 transition-colors text-center uppercase"
                />

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setShowScanner(true)}
                  className="flex items-center justify-center gap-2 mt-2"
                >
                  <Camera className="w-4 h-4 text-ink-700 dark:text-stone-300" />
                  <span>掃描朋友的 QR Code</span>
                </Button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  你的暱稱
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="旅人"
                  maxLength={20}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-stone-700 bg-paper-50 dark:bg-stone-800 focus:bg-white dark:focus:bg-stone-750 text-sm text-ink-900 dark:text-stone-100 placeholder:text-ink-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-ink-900 dark:focus:ring-stone-400 focus:border-ink-900 dark:focus:border-stone-400 transition-colors"
                />
              </div>
            </div>

            <p className="text-xs text-ink-500 dark:text-stone-400 font-serif leading-relaxed text-center px-4">
              如果你收到朋友傳送的專屬連結，點擊即可自動填入代碼並進入房間。
            </p>
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="pt-3 border-t border-paper-border/60 dark:border-stone-800">
        {activeTab === 'create' ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading || connectionStatus === 'connecting'}
            onClick={handleCreateRoom}
            className="shadow-md"
          >
            {isLoading ? '建立連線房間中...' : '確認建立房間'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={
              !roomCodeInput.trim() || isLoading || connectionStatus === 'connecting'
            }
            onClick={handleJoinRoom}
            className="shadow-md"
          >
            {isLoading ? '連線房間中...' : '加入房間'}
          </Button>
        )}
      </footer>

      {showScanner && (
        <Suspense fallback={null}>
          <QrScannerModal
            isOpen={showScanner}
            onClose={() => setShowScanner(false)}
            onScanSuccess={(code) => setRoomCodeInput(code)}
          />
        </Suspense>
      )}
    </div>
  );
};
