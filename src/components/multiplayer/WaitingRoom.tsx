import React, { useState } from 'react';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { Button } from '../ui/Button';
import { QRCodeModal } from './QRCodeModal';
import { QUESTION_SETS, QuestionSetId, getQuestionSetTotalCount } from '../../domain/questions/questionSets';

interface WaitingRoomProps {
  questionSetId?: QuestionSetId;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  questionSetId = 'full',
  onStartGame,
  onLeaveRoom,
}) => {
  const role = useMultiplayerStore((s) => s.role);
  const roomCode = useMultiplayerStore((s) => s.roomCode);
  const myPlayerId = useMultiplayerStore((s) => s.myPlayerId);
  const players = useMultiplayerStore((s) => s.players);
  const roomConfig = useMultiplayerStore((s) => s.roomConfig);
  const sendAction = useMultiplayerStore((s) => s.sendAction);

  const connectionStatus = useMultiplayerStore((s) => s.connectionStatus);

  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isHost = role === 'host';
  const canStart = isHost && players.length >= 2;
  const activeQuestionSetId = roomConfig?.questionSetId || questionSetId || 'full';

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper-50 dark:bg-stone-900 flex flex-col justify-between px-4 py-6 sm:py-10 safe-top safe-bottom max-w-md mx-auto w-full transition-colors">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-3 border-b border-paper-border/60 dark:border-stone-800">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="text-xs sm:text-sm font-medium text-ink-600 dark:text-stone-300 hover:text-ink-900 dark:hover:text-stone-100 py-1 px-2 rounded-lg hover:bg-paper-200/50 dark:hover:bg-stone-800/60 transition-colors"
        >
          離開房間
        </button>
        <span
          className={`text-xs font-sans px-2.5 py-0.5 rounded-full border ${
            connectionStatus === 'connected'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse'
          }`}
        >
          {connectionStatus === 'connected' ? '● 房間已連線' : '⠋ 房間連線中...'}
        </span>
        <div className="w-16" />
      </header>

      {/* Main Room Lobby Info */}
      <main className="flex-1 py-6 space-y-6 flex flex-col justify-center">
        {/* Room Code Card */}
        <div className="bg-paper-100/80 dark:bg-stone-800/80 p-5 rounded-2xl border border-paper-border dark:border-stone-700 text-center space-y-3 shadow-xs">
          <span className="text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider block">
            房間邀請碼
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-ink-900 dark:text-stone-100">
            {roomCode}
          </div>

          <div className="flex gap-2 justify-center pt-1">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-paper-50 dark:bg-stone-900 hover:bg-paper-200 dark:hover:bg-stone-800 border border-paper-border dark:border-stone-700 text-ink-700 dark:text-stone-200 transition-colors flex items-center gap-1.5"
            >
              <span>{copiedCode ? '已複製！' : '複製代碼'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-paper-50 dark:bg-stone-900 hover:bg-paper-200 dark:hover:bg-stone-800 border border-paper-border dark:border-stone-700 text-ink-700 dark:text-stone-200 transition-colors flex items-center gap-1.5"
            >
              <span>📱 QR Code 掃描</span>
            </button>
          </div>
        </div>

        {/* Selected Question Set info */}
        <div className="flex flex-wrap items-center justify-center gap-2 -mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-100/90 dark:bg-stone-800/90 border border-paper-border dark:border-stone-700 text-xs font-serif text-ink-700 dark:text-stone-300 shadow-2xs">
            <span>🎴</span>
            <span>
              題庫：{QUESTION_SETS[activeQuestionSetId]?.nameZh || '完整版'}（
              {getQuestionSetTotalCount(activeQuestionSetId)} 題）
            </span>
          </span>
          {roomConfig?.mode && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-paper-100/90 dark:bg-stone-800/90 border border-paper-border dark:border-stone-700 text-[11px] font-sans text-ink-600 dark:text-stone-400">
              {roomConfig.mode === 'guided' ? '深度旅程' : '自由抽牌'}
            </span>
          )}
        </div>

        {/* Players Waiting List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-ink-500 dark:text-stone-400 uppercase tracking-wider">
              已加入玩家 ({players.length} 人)
            </span>
            <span className="text-xs text-ink-400 dark:text-stone-500 font-sans">最多 8 人</span>
          </div>

          <div className="space-y-2">
            {players.map((p, idx) => {
              const isMe = p.id === myPlayerId;
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-paper-50 dark:bg-stone-850 border border-paper-border dark:border-stone-700 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-paper-200 dark:bg-stone-700 text-ink-700 dark:text-stone-300 text-xs font-mono font-medium flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-serif font-medium text-sm text-ink-900 dark:text-stone-100">
                      {p.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {p.isHost && (
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-ink-900 text-paper-50 dark:bg-stone-100 dark:text-stone-900">
                        房主
                      </span>
                    )}
                    {isMe && (
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-paper-200 dark:bg-stone-700 text-ink-700 dark:text-stone-300">
                        你
                      </span>
                    )}
                    {isHost && !p.isHost && (
                      <button
                        type="button"
                        onClick={() => sendAction({ action: 'REMOVE_PLAYER', playerId: p.id })}
                        className="text-[11px] font-sans px-2 py-0.5 rounded-md text-rose-700 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-950/70 border border-rose-200/50 dark:border-rose-900/50 transition-colors ml-1"
                        title="移出房間"
                      >
                        移除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="space-y-3 pt-3 border-t border-paper-border/60 dark:border-stone-800">
        {isHost ? (
          <div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canStart}
              onClick={onStartGame}
              className="shadow-md"
            >
              {players.length < 2 ? '等待其他玩家加入 (至少2人)...' : '開始對話'}
            </Button>
            {players.length < 2 && (
              <p className="text-[11px] text-ink-500 dark:text-stone-400 font-sans text-center mt-2">
                請朋友輸入上方房間代碼或掃描 QR Code 即可加入。
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-3 bg-paper-100/60 dark:bg-stone-800/60 rounded-2xl border border-paper-border dark:border-stone-700">
            <div className="inline-block animate-pulse w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <span className="text-xs sm:text-sm font-serif text-ink-700 dark:text-stone-300">
              已連線！等待房主開始對話...
            </span>
          </div>
        )}
      </footer>

      {/* QR Code Modal */}
      {roomCode && (
        <QRCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          roomCode={roomCode}
        />
      )}
    </div>
  );
};
