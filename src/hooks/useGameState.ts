import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';

// Custom hook to use game context
export const useGameState = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}; 