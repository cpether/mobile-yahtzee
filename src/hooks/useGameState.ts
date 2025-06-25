import { useGameContext } from '../contexts/GameContext';

// Custom hook to use game context
export const useGameState = () => {
  return useGameContext();
}; 