import React from 'react';
import { ThreeStarIntro } from './ThreeStarIntro';
import { TimeReminderModal } from './TimeReminderModal';
import { SettingsDrawer } from './SettingsDrawer';

interface GameModalsManagerProps {
  showThreeStarConsent: boolean;
  onConfirmThreeStarConsent: () => void;
  onCancelThreeStarConsent: () => void;

  showTimeReminder: boolean;
  onContinueTimeReminder: () => void;
  onEndGame: () => void;

  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  onResetGame: () => void;
}

export const GameModalsManager: React.FC<GameModalsManagerProps> = ({
  showThreeStarConsent,
  onConfirmThreeStarConsent,
  onCancelThreeStarConsent,
  showTimeReminder,
  onContinueTimeReminder,
  onEndGame,
  isSettingsOpen,
  onCloseSettings,
  onResetGame,
}) => {
  return (
    <>
      <ThreeStarIntro
        isOpen={showThreeStarConsent}
        onConfirm={onConfirmThreeStarConsent}
        onCancel={onCancelThreeStarConsent}
      />

      <TimeReminderModal
        isOpen={showTimeReminder}
        onContinue={onContinueTimeReminder}
        onEndGame={onEndGame}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
        onEndGame={onEndGame}
        onResetGame={onResetGame}
      />
    </>
  );
};
