import type { Player, Scorecard, GameState, ScoreCategory } from '../types/game';
import { createInitialDice } from './diceUtils';
import { calculateGrandTotal, canScoreCategory } from './scoring';

/**
 * Create initial scorecard for a player
 */
export const createInitialScorecard = (playerId: string): Scorecard => {
  const scores: Record<ScoreCategory, number | null> = {
    ones: null,
    twos: null,
    threes: null,
    fours: null,
    fives: null,
    sixes: null,
    threeOfAKind: null,
    fourOfAKind: null,
    fullHouse: null,
    smallStraight: null,
    largeStraight: null,
    yahtzee: null,
    chance: null
  };

  return {
    playerId,
    scores,
    upperSectionTotal: 0,
    upperSectionBonus: 0,
    lowerSectionTotal: 0,
    grandTotal: 0,
    yahtzeeCount: 0
  };
};

/**
 * Create initial game state
 */
export const createInitialGameState = (): GameState => {
  return {
    players: [],
    currentPlayerIndex: 0,
    currentTurn: 1,
    gamePhase: 'setup',
    dice: createInitialDice(),
    rollsRemaining: 3,
    scorecards: {}
  };
};

/**
 * Start a new game with players
 */
export const startGame = (players: Player[]): GameState => {
  const scorecards: Record<string, Scorecard> = {};
  
  players.forEach(player => {
    scorecards[player.id] = createInitialScorecard(player.id);
  });

  return {
    players,
    currentPlayerIndex: 0,
    currentTurn: 1,
    gamePhase: 'playing',
    dice: createInitialDice(),
    rollsRemaining: 3,
    scorecards
  };
};

/**
 * Get the current player
 */
export const getCurrentPlayer = (gameState: GameState): Player | null => {
  if (gameState.players.length === 0) return null;
  return gameState.players[gameState.currentPlayerIndex] || null;
};

/**
 * Get the current player's scorecard
 */
export const getCurrentPlayerScorecard = (gameState: GameState): Scorecard | null => {
  const currentPlayer = getCurrentPlayer(gameState);
  if (!currentPlayer) return null;
  return gameState.scorecards[currentPlayer.id] || null;
};

/**
 * Check if current turn is complete (no rolls remaining)
 */
export const isTurnComplete = (gameState: GameState): boolean => {
  return gameState.rollsRemaining === 0;
};

/**
 * Check if player must score (no rolls remaining and haven't scored yet)
 */
export const mustScore = (gameState: GameState): boolean => {
  return gameState.rollsRemaining === 0;
};

/**
 * Advance to next player/turn
 */
export const advanceToNextTurn = (gameState: GameState): GameState => {
  const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  const isNewRound = nextPlayerIndex === 0;
  
  return {
    ...gameState,
    currentPlayerIndex: nextPlayerIndex,
    currentTurn: isNewRound ? gameState.currentTurn + 1 : gameState.currentTurn,
    rollsRemaining: 3,
    dice: createInitialDice()
  };
};

/**
 * Check if game is complete (all categories filled for all players)
 */
export const isGameComplete = (gameState: GameState): boolean => {
  const totalCategories = 13; // 6 upper + 7 lower categories
  
  return gameState.players.every(player => {
    const scorecard = gameState.scorecards[player.id];
    if (!scorecard) return false;
    
    const filledCategories = Object.values(scorecard.scores).filter(score => score !== null).length;
    return filledCategories === totalCategories;
  });
};

/**
 * Get available scoring categories for current player
 */
export const getAvailableCategories = (gameState: GameState): ScoreCategory[] => {
  const currentPlayerScorecard = getCurrentPlayerScorecard(gameState);
  if (!currentPlayerScorecard) return [];
  
  const allCategories: ScoreCategory[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight',
    'largeStraight', 'yahtzee', 'chance'
  ];
  
  return allCategories.filter(category => canScoreCategory(currentPlayerScorecard, category));
};

/**
 * Score a category for current player
 */
export const scoreCategory = (
  gameState: GameState, 
  category: ScoreCategory, 
  score: number
): GameState => {
  const currentPlayer = getCurrentPlayer(gameState);
  if (!currentPlayer) return gameState;
  
  const currentScorecard = gameState.scorecards[currentPlayer.id];
  if (!currentScorecard || !canScoreCategory(currentScorecard, category)) {
    return gameState;
  }
  
  // Update scorecard with new score
  const updatedScorecard: Scorecard = {
    ...currentScorecard,
    scores: {
      ...currentScorecard.scores,
      [category]: score
    }
  };
  
  // Update Yahtzee count if scoring a Yahtzee
  if (category === 'yahtzee' && score > 0) {
    updatedScorecard.yahtzeeCount = currentScorecard.yahtzeeCount + 1;
  }
  
  // Recalculate totals
  updatedScorecard.grandTotal = calculateGrandTotal(updatedScorecard);
  
  const updatedGameState = {
    ...gameState,
    scorecards: {
      ...gameState.scorecards,
      [currentPlayer.id]: updatedScorecard
    }
  };
  
  // Check if game is complete
  if (isGameComplete(updatedGameState)) {
    return {
      ...updatedGameState,
      gamePhase: 'finished' as const
    };
  }
  
  return updatedGameState;
};

/**
 * Get game winner(s) - can be a tie
 */
export const getGameWinners = (gameState: GameState): Player[] => {
  if (gameState.gamePhase !== 'finished') return [];
  
  let highestScore = -1;
  const winners: Player[] = [];
  
  gameState.players.forEach(player => {
    const scorecard = gameState.scorecards[player.id];
    if (scorecard) {
      if (scorecard.grandTotal > highestScore) {
        winners.length = 0; // Clear previous winners
        winners.push(player);
        highestScore = scorecard.grandTotal;
      } else if (scorecard.grandTotal === highestScore) {
        winners.push(player);
      }
    }
  });
  
  return winners;
};

/**
 * Get player rankings sorted by score (highest first)
 */
export const getPlayerRankings = (gameState: GameState): Array<{ player: Player; scorecard: Scorecard; rank: number }> => {
  const rankings = gameState.players
    .map(player => ({
      player,
      scorecard: gameState.scorecards[player.id]
    }))
    .filter(({ scorecard }) => scorecard !== undefined)
    .sort((a, b) => b.scorecard.grandTotal - a.scorecard.grandTotal);
  
  // Assign ranks (handling ties)
  let currentRank = 1;
  return rankings.map((item, index) => {
    if (index > 0 && item.scorecard.grandTotal < rankings[index - 1].scorecard.grandTotal) {
      currentRank = index + 1;
    }
    return {
      ...item,
      rank: currentRank
    };
  });
};

/**
 * Validate player configuration
 */
export const validatePlayers = (players: Player[]): string[] => {
  const errors: string[] = [];
  
  if (players.length < 1) {
    errors.push('At least 1 player is required');
  }
  
  if (players.length > 6) {
    errors.push('Maximum 6 players allowed');
  }
  
  // Check for duplicate names
  const names = players.map(p => p.name.toLowerCase().trim());
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    errors.push('Player names must be unique');
  }
  
  // Validate individual players
  players.forEach((player, index) => {
    if (!player.id || player.id.trim() === '') {
      errors.push(`Player ${index + 1}: ID is required`);
    }
    
    if (!player.name || player.name.trim() === '') {
      errors.push(`Player ${index + 1}: Name is required`);
    } else if (player.name.trim().length < 2) {
      errors.push(`Player ${index + 1}: Name must be at least 2 characters`);
    } else if (player.name.trim().length > 20) {
      errors.push(`Player ${index + 1}: Name must be 20 characters or less`);
    } else if (!/^[a-zA-Z0-9\s]+$/.test(player.name.trim())) {
      errors.push(`Player ${index + 1}: Name can only contain letters, numbers, and spaces`);
    }
  });
  
  return errors;
};

/**
 * Generate unique player ID
 */
export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new player
 */
export const createPlayer = (name: string, color?: string): Player => {
  return {
    id: generatePlayerId(),
    name: name.trim(),
    color
  };
};

/**
 * Calculate turns remaining in game
 */
export const getTurnsRemaining = (gameState: GameState): number => {
  const totalTurns = 13; // 13 categories to fill
  return Math.max(0, totalTurns - gameState.currentTurn + 1);
};

/**
 * Get game progress percentage
 */
export const getGameProgress = (gameState: GameState): number => {
  if (gameState.gamePhase === 'setup') return 0;
  if (gameState.gamePhase === 'finished') return 100;
  
  const totalSlots = gameState.players.length * 13; // 13 categories per player
  let filledSlots = 0;
  
  gameState.players.forEach(player => {
    const scorecard = gameState.scorecards[player.id];
    if (scorecard) {
      filledSlots += Object.values(scorecard.scores).filter(score => score !== null).length;
    }
  });
  
  return Math.round((filledSlots / totalSlots) * 100);
}; 