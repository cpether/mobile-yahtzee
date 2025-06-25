import React, { createContext } from 'react';
import type { GameState, GameAction, Player, ScoreCategory, Scorecard } from '../types/game';

// Define the context type
interface GameContextType {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience methods
  startNewGame: (players: Player[]) => void;
  rollDice: () => void;
  toggleDieHold: (dieIndex: number) => void;
  scoreCategory: (category: ScoreCategory) => void;
  nextTurn: () => void;
  // Selectors
  currentPlayer: Player | null;
  currentPlayerScorecard: Scorecard | null;
  availableCategories: ScoreCategory[];
  canRoll: boolean;
  mustScore: boolean;
}

// Create the context with a default empty value
export const GameContext = createContext<GameContextType>({} as GameContextType);

// Hook to use the game context (moving the hook here to keep this file related to context definition only)
export const useGameContext = () => {
  const context = React.useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

 