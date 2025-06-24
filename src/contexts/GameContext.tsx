import React, { createContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { GameState, GameAction, Player, ScoreCategory, Scorecard } from '../types/game';
import { 
  createInitialGameState, 
  startGame, 
  advanceToNextTurn, 
  scoreCategory as scoreCategoryUtil,
  getCurrentPlayer,
  getCurrentPlayerScorecard,
  getAvailableCategories
} from '../utils/gameLogic';
import { 
  rollUnheldDice, 
  toggleDieHold as toggleDieHoldUtil, 
  resetDiceHolds, 
  triggerDiceRollHaptic,
  triggerDieHoldHaptic,
  setDiceRolling
} from '../utils/diceUtils';
import { calculateScore } from '../utils/scoring';
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

export const GameContext = createContext<GameContextType | null>(null);

// Game state reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return startGame(action.players);
    
    case 'ROLL_DICE': {
      if (state.rollsRemaining <= 0) return state;
      
      // Just set dice to rolling state, without changing values yet
      return {
        ...state,
        dice: setDiceRolling(state.dice, true),
        rollsRemaining: state.rollsRemaining - 1
      };
    }
    
    case 'UPDATE_DICE_VALUES': {
      // This action updates the dice values after animation
      return {
        ...state,
        dice: action.dice
      };
    }
    
    case 'CLEAR_DICE_ROLLING': {
      return {
        ...state,
        dice: state.dice.map(die => ({ ...die, isRolling: false }))
      };
    }
    
    case 'TOGGLE_DIE_HOLD': {
      // Can only hold dice after at least one roll has been made
      if (state.rollsRemaining === 3 || state.gamePhase !== 'playing') {
        return state;
      }
      
      return {
        ...state,
        dice: toggleDieHoldUtil(state.dice, action.dieIndex)
      };
    }
    
    case 'SCORE_CATEGORY': {
      const score = calculateScore(state.dice, action.category);
      const newState = scoreCategoryUtil(state, action.category, score);
      
      if (newState.gamePhase === 'finished') {
        return newState;
      }
      
      // Advance to next turn
      return {
        ...advanceToNextTurn(newState),
        dice: resetDiceHolds(newState.dice)
      };
    }
    
    case 'NEXT_TURN':
      return {
        ...advanceToNextTurn(state),
        dice: resetDiceHolds(state.dice)
      };
    
    case 'END_GAME':
      return {
        ...state,
        gamePhase: 'finished'
      };
    
    default:
      return state;
  }
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialGameState());
  
  // Convenience methods
  const startNewGame = useCallback((players: Player[]) => {
    dispatch({ type: 'START_GAME', players });
  }, []);
  
  const rollDice = useCallback(() => {
    if (gameState.rollsRemaining > 0) {
      triggerDiceRollHaptic();
      
      // First, set dice to rolling state without changing values
      dispatch({ type: 'ROLL_DICE' });
      
      // Get animation duration
      const animationDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 200 : 800;
      
      // Generate new dice values but wait until animation is almost complete
      setTimeout(() => {
        // Generate new dice values
        const newDice = rollUnheldDice(gameState.dice);
        
        // Update dice values
        dispatch({ type: 'UPDATE_DICE_VALUES', dice: newDice });
        
        // Clear rolling state shortly after
        setTimeout(() => {
          dispatch({ type: 'CLEAR_DICE_ROLLING' });
        }, 100); // Short delay after values update
      }, animationDuration * 0.8); // Update values at 80% through the animation
    }
  }, [gameState.rollsRemaining, gameState.dice]);
  
  const toggleDieHoldAction = useCallback((dieIndex: number) => {
    // Only allow holding dice after at least one roll has been made
    if (gameState.rollsRemaining < 3 && gameState.gamePhase === 'playing') {
      triggerDieHoldHaptic();
      dispatch({ type: 'TOGGLE_DIE_HOLD', dieIndex });
    }
  }, [gameState.rollsRemaining, gameState.gamePhase]);
  
  const scoreCategory = useCallback((category: ScoreCategory) => {
    dispatch({ type: 'SCORE_CATEGORY', category, playerId: getCurrentPlayer(gameState)?.id || '' });
  }, [gameState]);
  
  const nextTurn = useCallback(() => {
    dispatch({ type: 'NEXT_TURN' });
  }, []);
  
  // Selectors
  const currentPlayer = getCurrentPlayer(gameState);
  const currentPlayerScorecard = getCurrentPlayerScorecard(gameState);
  const availableCategories = getAvailableCategories(gameState);
  const canRoll = gameState.rollsRemaining > 0 && gameState.gamePhase === 'playing';
  const mustScore = gameState.rollsRemaining === 0 && gameState.gamePhase === 'playing';
  
  const contextValue: GameContextType = {
    gameState,
    dispatch,
    startNewGame,
    rollDice,
    toggleDieHold: toggleDieHoldAction,
    scoreCategory,
    nextTurn,
    currentPlayer,
    currentPlayerScorecard,
    availableCategories,
    canRoll,
    mustScore
  };
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

 