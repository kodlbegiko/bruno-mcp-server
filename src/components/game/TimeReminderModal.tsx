import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface TimeReminderModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onEndGame: () => void;
}

export const TimeReminderModal: React.FC<TimeReminderModalProps> = ({
  isOpen,
  onContinue,
  onEndGame,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onContinue} showCloseButton={false}>
      <div className="text-center space-y-4 py-2">
        <div className="w-10 h-10 rounded-full bg-paper-200 dark:bg-stone-800 text-ink-700 dark:text-stone-300 flex items-center justify-center mx-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-serif font-medium text-ink-900 dark:text-stone-100">
          今晚差不多要收尾了嗎？
        </h3>
        <p className="text-xs sm:text-sm text-ink-500 dark:text-stone-400 leading-relaxed font-serif">
          距離預計時間差不多了。您可以依照大家的節奏，隨時選擇結束或繼續聊聊。
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-3">
          <Button variant="secondary" fullWidth onClick={onContinue}>
            再聊幾張
          </Button>
          <Button variant="primary" fullWidth onClick={onEndGame}>
            準備結束
          </Button>
        </div>
      </div>
    </Modal>
  );
};
