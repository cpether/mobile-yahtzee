export interface Player {
  id: string;
  name: string;
  color?: string;
}

export interface DiceState {
  value: number;
  isHeld: boolean;
  isRolling: boolean;
}

export type ScoreCategory = 
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeOfAKind' | 'fourOfAKind' | 'fullHouse' 
  | 'smallStraight' | 'largeStraight' | 'yahtzee' | 'chance';

export interface Scorecard {
  playerId: string;
  scores: Record<ScoreCategory, number | null>;
  upperSectionTotal: number;
  upperSectionBonus: number;
  lowerSectionTotal: number;
  grandTotal: number;
  yahtzeeCount: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  currentTurn: number;
  gamePhase: 'setup' | 'playing' | 'finished';
  dice: DiceState[];
  rollsRemaining: number;
  scorecards: Record<string, Scorecard>;
}

export type GameAction = 
  | { type: 'START_GAME'; players: Player[] }
  | { type: 'ROLL_DICE' }
  | { type: 'CLEAR_DICE_ROLLING' }
  | { type: 'TOGGLE_DIE_HOLD'; dieIndex: number }
  | { type: 'SCORE_CATEGORY'; category: ScoreCategory; playerId: string }
  | { type: 'NEXT_TURN' }
  | { type: 'END_GAME' }
  | { type: 'UPDATE_DICE_VALUES'; dice: DiceState[] };

export interface GameSettings {
  playerCount: number;
  enableAnimations: boolean;
  soundEnabled: boolean;
  hapticFeedback: boolean;
} 