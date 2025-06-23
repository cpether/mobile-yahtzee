# State Management Specification

## Overview

This document defines the state management architecture for the mobile Yahtzee game. The state management follows React patterns using Context API with useReducer for global state and local useState for component-specific state.

## State Architecture

### Global State Structure

```typescript
interface AppState {
  // Game configuration
  gameSettings: GameSettings;
  
  // Current game state
  currentGame: GameState | null;
  
  // UI state
  uiState: UIState;
  
  // Persistent data
  gameHistory: GameHistory[];
  playerProfiles: PlayerProfile[];
}

interface GameState {
  // Game metadata
  gameId: string;
  createdAt: Date;
  status: GameStatus;
  
  // Players and turns
  players: Player[];
  currentPlayerIndex: number;
  currentTurn: number;
  maxTurns: number;
  
  // Dice state
  dice: DiceState[];
  rollsRemaining: number;
  currentRoll: number;
  
  // Scoring
  scorecards: Record<string, Scorecard>;
  availableCategories: Record<string, ScoreCategory[]>;
  
  // Game flow
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  
  // Special states
  yahtzeeBonus: Record<string, number>;
  pendingScore: PendingScore | null;
}

interface UIState {
  // Screen management
  currentScreen: Screen;
  previousScreen: Screen;
  
  // Modal and overlay state
  activeModal: Modal | null;
  showScorecard: boolean;
  showGameMenu: boolean;
  
  // Animation states
  diceRolling: boolean;
  scoreAnimating: boolean;
  
  // User preferences
  animationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  
  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  
  // Error states
  error: GameError | null;
}
```

### Type Definitions

```typescript
// Core game types
export type GameStatus = 'setup' | 'playing' | 'paused' | 'finished' | 'abandoned';
export type GamePhase = 'setup' | 'playing' | 'scoring' | 'finished';
export type TurnPhase = 'rolling' | 'keeping' | 'scoring' | 'complete';
export type Screen = 'home' | 'setup' | 'game' | 'scorecard' | 'summary' | 'settings';
export type Modal = 'rules' | 'quit' | 'settings' | 'score-help' | 'error';

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isActive: boolean;
}

export interface DiceState {
  id: number;
  value: number;
  isHeld: boolean;
  isRolling: boolean;
  lastRollTime: number;
}

export interface Scorecard {
  playerId: string;
  
  // Upper section scores
  ones: number | null;
  twos: number | null;
  threes: number | null;
  fours: number | null;
  fives: number | null;
  sixes: number | null;
  
  // Lower section scores
  threeOfAKind: number | null;
  fourOfAKind: number | null;
  fullHouse: number | null;
  smallStraight: number | null;
  largeStraight: number | null;
  yahtzee: number | null;
  chance: number | null;
  
  // Calculated totals
  upperSectionTotal: number;
  upperSectionBonus: number;
  lowerSectionTotal: number;
  yahtzeeBonus: number;
  grandTotal: number;
  
  // Metadata
  completedCategories: ScoreCategory[];
  isComplete: boolean;
}

export interface PendingScore {
  category: ScoreCategory;
  value: number;
  playerId: string;
  timestamp: number;
}

export interface GameError {
  type: 'validation' | 'network' | 'storage' | 'unknown';
  message: string;
  details?: any;
  timestamp: number;
}
```

## State Actions

### Game Actions

```typescript
export type GameAction = 
  // Game lifecycle
  | { type: 'INITIALIZE_GAME'; players: Player[] }
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'END_GAME' }
  | { type: 'RESTART_GAME' }
  | { type: 'ABANDON_GAME' }
  
  // Turn management
  | { type: 'START_TURN' }
  | { type: 'END_TURN' }
  | { type: 'NEXT_PLAYER' }
  | { type: 'SKIP_TURN'; playerId: string }
  
  // Dice actions
  | { type: 'ROLL_DICE' }
  | { type: 'TOGGLE_DIE_HOLD'; dieIndex: number }
  | { type: 'HOLD_DICE'; indices: number[] }
  | { type: 'RELEASE_DICE'; indices: number[] }
  | { type: 'CLEAR_DICE_HOLDS' }
  
  // Scoring actions
  | { type: 'SELECT_SCORE_CATEGORY'; category: ScoreCategory; playerId: string }
  | { type: 'CONFIRM_SCORE'; category: ScoreCategory; value: number; playerId: string }
  | { type: 'CANCEL_SCORE' }
  | { type: 'FORCE_ZERO_SCORE'; category: ScoreCategory; playerId: string }
  
  // Special scoring
  | { type: 'APPLY_YAHTZEE_BONUS'; playerId: string }
  | { type: 'APPLY_UPPER_SECTION_BONUS'; playerId: string }
  
  // Error handling
  | { type: 'SET_ERROR'; error: GameError }
  | { type: 'CLEAR_ERROR' }
  
  // State synchronization
  | { type: 'HYDRATE_STATE'; state: GameState }
  | { type: 'SAVE_GAME_STATE' };

export type UIAction = 
  // Navigation
  | { type: 'NAVIGATE_TO'; screen: Screen }
  | { type: 'GO_BACK' }
  | { type: 'SHOW_MODAL'; modal: Modal }
  | { type: 'HIDE_MODAL' }
  
  // UI toggles
  | { type: 'TOGGLE_SCORECARD' }
  | { type: 'TOGGLE_GAME_MENU' }
  | { type: 'TOGGLE_ANIMATIONS' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_HAPTIC' }
  
  // Loading states
  | { type: 'SET_LOADING'; isLoading: boolean; message?: string }
  
  // Animation states
  | { type: 'START_DICE_ANIMATION' }
  | { type: 'END_DICE_ANIMATION' }
  | { type: 'START_SCORE_ANIMATION' }
  | { type: 'END_SCORE_ANIMATION' };
```

## State Reducers

### Game State Reducer

```typescript
export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return {
        ...initialGameState,
        gameId: generateGameId(),
        players: action.players,
        scorecards: initializeScoreCards(action.players),
        availableCategories: initializeAvailableCategories(action.players),
        maxTurns: 13,
        createdAt: new Date(),
      };

    case 'START_GAME':
      return {
        ...state,
        status: 'playing',
        gamePhase: 'playing',
        turnPhase: 'rolling',
        currentTurn: 1,
      };

    case 'ROLL_DICE':
      if (state.rollsRemaining <= 0 || state.turnPhase !== 'rolling') {
        return state;
      }
      
      return {
        ...state,
        dice: rollDice(state.dice),
        rollsRemaining: state.rollsRemaining - 1,
        currentRoll: state.currentRoll + 1,
        turnPhase: state.rollsRemaining === 1 ? 'scoring' : 'keeping',
      };

    case 'TOGGLE_DIE_HOLD':
      return {
        ...state,
        dice: state.dice.map((die, index) =>
          index === action.dieIndex
            ? { ...die, isHeld: !die.isHeld }
            : die
        ),
      };

    case 'CONFIRM_SCORE':
      const updatedScorecard = updateScorecard(
        state.scorecards[action.playerId],
        action.category,
        action.value
      );
      
      const newScoreCards = {
        ...state.scorecards,
        [action.playerId]: updatedScorecard,
      };
      
      const isGameComplete = checkGameComplete(newScoreCards, state.players);
      
      return {
        ...state,
        scorecards: newScoreCards,
        availableCategories: {
          ...state.availableCategories,
          [action.playerId]: state.availableCategories[action.playerId].filter(
            cat => cat !== action.category
          ),
        },
        gamePhase: isGameComplete ? 'finished' : 'playing',
        turnPhase: 'complete',
        pendingScore: null,
      };

    case 'NEXT_PLAYER':
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      const isNewRound = nextPlayerIndex === 0;
      
      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        currentTurn: isNewRound ? state.currentTurn + 1 : state.currentTurn,
        rollsRemaining: 3,
        currentRoll: 0,
        turnPhase: 'rolling',
        dice: resetDice(state.dice),
      };

    default:
      return state;
  }
};
```

### UI State Reducer

```typescript
export const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'NAVIGATE_TO':
      return {
        ...state,
        previousScreen: state.currentScreen,
        currentScreen: action.screen,
        activeModal: null, // Close any open modals when navigating
      };

    case 'GO_BACK':
      return {
        ...state,
        currentScreen: state.previousScreen,
        previousScreen: state.currentScreen,
      };

    case 'SHOW_MODAL':
      return {
        ...state,
        activeModal: action.modal,
      };

    case 'HIDE_MODAL':
      return {
        ...state,
        activeModal: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
        loadingMessage: action.message || '',
      };

    case 'START_DICE_ANIMATION':
      return {
        ...state,
        diceRolling: true,
      };

    case 'END_DICE_ANIMATION':
      return {
        ...state,
        diceRolling: false,
      };

    default:
      return state;
  }
};
```

## State Selectors

### Game State Selectors

```typescript
// Player selectors
export const getCurrentPlayer = (state: GameState): Player => 
  state.players[state.currentPlayerIndex];

export const getPlayerById = (state: GameState, playerId: string): Player | undefined =>
  state.players.find(player => player.id === playerId);

export const getActivePlayer = (state: GameState): Player | null =>
  state.players.find(player => player.isActive) || null;

// Dice selectors
export const getHeldDice = (state: GameState): DiceState[] =>
  state.dice.filter(die => die.isHeld);

export const getUnheldDice = (state: GameState): DiceState[] =>
  state.dice.filter(die => !die.isHeld);

export const canRollDice = (state: GameState): boolean =>
  state.rollsRemaining > 0 && 
  state.turnPhase === 'rolling' && 
  state.gamePhase === 'playing';

// Scoring selectors
export const getCurrentPlayerScorecard = (state: GameState): Scorecard =>
  state.scorecards[getCurrentPlayer(state).id];

export const getAvailableCategories = (state: GameState, playerId?: string): ScoreCategory[] => {
  const targetPlayerId = playerId || getCurrentPlayer(state).id;
  return state.availableCategories[targetPlayerId] || [];
};

export const getPossibleScores = (state: GameState): Record<ScoreCategory, number> => {
  const currentPlayer = getCurrentPlayer(state);
  const availableCategories = getAvailableCategories(state, currentPlayer.id);
  
  return availableCategories.reduce((scores, category) => {
    scores[category] = calculateCategoryScore(state.dice, category);
    return scores;
  }, {} as Record<ScoreCategory, number>);
};

export const getPlayerRanking = (state: GameState): PlayerRanking[] => {
  return state.players
    .map(player => ({
      player,
      score: state.scorecards[player.id].grandTotal,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
};

// Game progress selectors
export const isGameComplete = (state: GameState): boolean =>
  state.gamePhase === 'finished';

export const getTurnProgress = (state: GameState): number =>
  state.currentTurn / state.maxTurns;

export const getPlayerProgress = (state: GameState, playerId: string): number => {
  const scorecard = state.scorecards[playerId];
  return scorecard.completedCategories.length / 13;
};
```

## Context Providers

### Game Context Provider

```typescript
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  
  // Convenience methods
  rollDice: () => void;
  toggleDieHold: (index: number) => void;
  scoreCategory: (category: ScoreCategory, value: number) => void;
  nextTurn: () => void;
  
  // Computed values
  currentPlayer: Player;
  possibleScores: Record<ScoreCategory, number>;
  canRoll: boolean;
  isGameComplete: boolean;
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  
  const rollDice = useCallback(() => {
    dispatch({ type: 'ROLL_DICE' });
  }, []);
  
  const toggleDieHold = useCallback((index: number) => {
    dispatch({ type: 'TOGGLE_DIE_HOLD', dieIndex: index });
  }, []);
  
  const scoreCategory = useCallback((category: ScoreCategory, value: number) => {
    const currentPlayer = getCurrentPlayer(state);
    dispatch({ 
      type: 'CONFIRM_SCORE', 
      category, 
      value, 
      playerId: currentPlayer.id 
    });
  }, [state]);
  
  const nextTurn = useCallback(() => {
    dispatch({ type: 'NEXT_PLAYER' });
  }, []);
  
  // Computed values
  const currentPlayer = useMemo(() => getCurrentPlayer(state), [state]);
  const possibleScores = useMemo(() => getPossibleScores(state), [state]);
  const canRoll = useMemo(() => canRollDice(state), [state]);
  const isGameComplete = useMemo(() => isGameComplete(state), [state]);
  
  const value: GameContextValue = {
    state,
    dispatch,
    rollDice,
    toggleDieHold,
    scoreCategory,
    nextTurn,
    currentPlayer,
    possibleScores,
    canRoll,
    isGameComplete,
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
```

## Persistence Strategy

### Local Storage Integration

```typescript
// Storage keys
const STORAGE_KEYS = {
  CURRENT_GAME: 'yahtzee_current_game',
  GAME_HISTORY: 'yahtzee_game_history',
  PLAYER_PROFILES: 'yahtzee_player_profiles',
  SETTINGS: 'yahtzee_settings',
} as const;

// Save current game state
export const saveGameState = (state: GameState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEYS.CURRENT_GAME, serializedState);
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};

// Load current game state
export const loadGameState = (): GameState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
    if (serializedState) {
      return JSON.parse(serializedState);
    }
  } catch (error) {
    console.error('Failed to load game state:', error);
  }
  return null;
};

// Auto-save hook
export const useAutoSave = () => {
  const { state } = useGameState();
  
  useEffect(() => {
    if (state.status !== 'setup') {
      saveGameState(state);
    }
  }, [state]);
};
```

### State Hydration

```typescript
export const useStateHydration = () => {
  const { dispatch } = useGameState();
  
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      dispatch({ type: 'HYDRATE_STATE', state: savedState });
    }
  }, [dispatch]);
};
```

## State Validation

### State Integrity Checks

```typescript
export const validateGameState = (state: GameState): boolean => {
  // Check player count
  if (state.players.length < 2 || state.players.length > 4) {
    return false;
  }
  
  // Check current player index
  if (state.currentPlayerIndex >= state.players.length) {
    return false;
  }
  
  // Check dice values
  if (state.dice.some(die => die.value < 1 || die.value > 6)) {
    return false;
  }
  
  // Check rolls remaining
  if (state.rollsRemaining < 0 || state.rollsRemaining > 3) {
    return false;
  }
  
  // Check scorecard integrity
  for (const scorecard of Object.values(state.scorecards)) {
    if (!validateScorecard(scorecard)) {
      return false;
    }
  }
  
  return true;
};

export const validateScorecard = (scorecard: Scorecard): boolean => {
  // Check that scores are within valid ranges
  const upperSectionScores = [
    scorecard.ones, scorecard.twos, scorecard.threes,
    scorecard.fours, scorecard.fives, scorecard.sixes
  ];
  
  for (const score of upperSectionScores) {
    if (score !== null && (score < 0 || score > 30)) {
      return false;
    }
  }
  
  // Check lower section fixed scores
  if (scorecard.fullHouse !== null && scorecard.fullHouse !== 0 && scorecard.fullHouse !== 25) {
    return false;
  }
  
  if (scorecard.smallStraight !== null && scorecard.smallStraight !== 0 && scorecard.smallStraight !== 30) {
    return false;
  }
  
  if (scorecard.largeStraight !== null && scorecard.largeStraight !== 0 && scorecard.largeStraight !== 40) {
    return false;
  }
  
  if (scorecard.yahtzee !== null && scorecard.yahtzee !== 0 && scorecard.yahtzee !== 50) {
    return false;
  }
  
  return true;
};
```

## State Migration

### Version Management

```typescript
interface VersionedState {
  version: string;
  data: any;
}

const CURRENT_STATE_VERSION = '1.0.0';

export const migrateState = (versionedState: VersionedState): GameState => {
  switch (versionedState.version) {
    case '1.0.0':
      return versionedState.data;
    
    default:
      // Handle unknown versions by falling back to initial state
      console.warn(`Unknown state version: ${versionedState.version}`);
      return initialGameState;
  }
};

export const versionState = (state: GameState): VersionedState => ({
  version: CURRENT_STATE_VERSION,
  data: state,
});
```

## Performance Optimizations

### State Updates

```typescript
// Batch multiple state updates
export const useBatchedGameActions = () => {
  const { dispatch } = useGameState();
  
  const batchActions = useCallback((actions: GameAction[]) => {
    unstable_batchedUpdates(() => {
      actions.forEach(action => dispatch(action));
    });
  }, [dispatch]);
  
  return batchActions;
};

// Debounced state persistence
export const useDebouncedSave = (delay: number = 1000) => {
  const { state } = useGameState();
  
  const debouncedSave = useMemo(
    () => debounce((gameState: GameState) => {
      saveGameState(gameState);
    }, delay),
    [delay]
  );
  
  useEffect(() => {
    debouncedSave(state);
  }, [state, debouncedSave]);
};
``` 