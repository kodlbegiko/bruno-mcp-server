import React from 'react';
import { GameBoard } from '../components/game/GameBoard';

interface GameProps {
  onBackToHome: () => void;
  onGameEnd: () => void;
}

export const Game: React.FC<GameProps> = ({ onBackToHome, onGameEnd }) => {
  return <GameBoard onBackToHome={onBackToHome} onGameEnd={onGameEnd} />;
};
