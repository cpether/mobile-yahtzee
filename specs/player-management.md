# Player Management Specification

## Overview

The player management system handles multi-player pass-and-play functionality, turn management, player registration, and game flow coordination. This specification covers the complete player lifecycle from game setup to final scoring.

## Player Data Model

```typescript
interface Player {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Display name (max 20 characters)
  avatar?: string;               // Optional avatar emoji or initials
  color: string;                 // Primary color for UI theming
  scoreCard: ScoreCard;          // Individual scorecard
  totalScore: number;            // Calculated from scorecard
  turnOrder: number;             // Position in turn sequence (0-based)
  isCurrentPlayer: boolean;      // Whether it's their turn
  gameStats: PlayerStats;        // Game performance metrics
}

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  averageScore: number;
  highestScore: number;
  yahtzeesRolled: number;
  perfectGames: number;
}

interface PlayerTurn {
  playerId: string;
  turnNumber: number;            // 1-13 (13 rounds total)
  rollsUsed: number;            // 0-3 rolls per turn
  rollsRemaining: number;       // 3-0 rolls remaining
  diceState: DiceState;         // Current dice configuration
  scoreSelected: boolean;       // Whether player has scored this turn
  turnStartTime: Date;          // For turn timer
  turnDuration?: number;        // Time taken for turn (ms)
}

interface GamePlayerState {
  players: Player[];
  currentPlayerIndex: number;
  maxPlayers: number;           // 2-6 players supported
  minPlayers: number;           // Minimum 2 players required
  gamePhase: GamePhase;
  currentTurn: PlayerTurn | null;
  turnHistory: PlayerTurn[];    // Complete turn history
  roundNumber: number;          // 1-13 rounds
}

enum GamePhase {
  SETUP = 'setup',              // Adding players
  PLAYING = 'playing',          // Game in progress
  SCORING = 'scoring',          // Player must score
  TURN_COMPLETE = 'turn_complete', // Turn finished, can advance
  GAME_COMPLETE = 'game_complete', // All rounds finished
  PAUSED = 'paused'             // Game temporarily paused
}
```

## Player Registration & Setup

### Player Setup Component

```tsx
interface PlayerSetupProps {
  onPlayersReady: (players: Player[]) => void;
  minPlayers: number;
  maxPlayers: number;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({
  onPlayersReady,
  minPlayers,
  maxPlayers
}) => {
  const [players, setPlayers] = useState<Partial<Player>[]>([]);
  const [playerCount, setPlayerCount] = useState(2);
  
  const colorPalette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  
  const handleAddPlayer = (playerData: Partial<Player>) => {
    const newPlayer: Player = {
      id: generateUUID(),
      name: playerData.name || '',
      color: colorPalette[players.length % colorPalette.length],
      avatar: playerData.avatar,
      scoreCard: createEmptyScoreCard(),
      totalScore: 0,
      turnOrder: players.length,
      isCurrentPlayer: players.length === 0,
      gameStats: createEmptyStats()
    };
    
    setPlayers(prev => [...prev, newPlayer]);
  };
  
  const canStartGame = players.length >= minPlayers && 
                      players.every(p => p.name && p.name.trim().length > 0);
  
  return (
    <div className="player-setup">
      <h2>Set Up Players</h2>
      
      <PlayerCountSelector
        count={playerCount}
        min={minPlayers}
        max={maxPlayers}
        onChange={setPlayerCount}
      />
      
      <div className="player-list">
        {Array.from({ length: playerCount }, (_, index) => (
          <PlayerForm
            key={index}
            playerNumber={index + 1}
            suggestedColor={colorPalette[index % colorPalette.length]}
            onPlayerChange={(data) => handlePlayerChange(index, data)}
            existingNames={players.map(p => p.name).filter(Boolean)}
          />
        ))}
      </div>
      
      <button
        className="start-game-button"
        onClick={() => onPlayersReady(players as Player[])}
        disabled={!canStartGame}
      >
        Start Game
      </button>
    </div>
  );
};
```

## Turn Management System

### Turn Flow Logic

```typescript
function startPlayerTurn(
  gameState: GamePlayerState,
  playerId: string
): GamePlayerState {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');
  
  const newTurn: PlayerTurn = {
    playerId,
    turnNumber: gameState.roundNumber,
    rollsUsed: 0,
    rollsRemaining: 3,
    diceState: initializeDice(),
    scoreSelected: false,
    turnStartTime: new Date()
  };
  
  return {
    ...gameState,
    currentTurn: newTurn,
    gamePhase: GamePhase.PLAYING,
    players: gameState.players.map(p => ({
      ...p,
      isCurrentPlayer: p.id === playerId
    }))
  };
}

function advanceToNextPlayer(gameState: GamePlayerState): GamePlayerState {
  const currentIndex = gameState.currentPlayerIndex;
  const nextIndex = (currentIndex + 1) % gameState.players.length;
  const isNewRound = nextIndex === 0;
  
  const newRoundNumber = isNewRound ? 
    gameState.roundNumber + 1 : 
    gameState.roundNumber;
  
  // Check if game is complete (13 rounds finished)
  if (newRoundNumber > 13) {
    return {
      ...gameState,
      gamePhase: GamePhase.GAME_COMPLETE,
      currentTurn: null
    };
  }
  
  return {
    ...gameState,
    currentPlayerIndex: nextIndex,
    roundNumber: newRoundNumber,
    gamePhase: GamePhase.TURN_COMPLETE
  };
}

function completeTurn(
  gameState: GamePlayerState,
  scoreCategory: ScoreCategory
): GamePlayerState {
  if (!gameState.currentTurn) {
    throw new Error('No active turn to complete');
  }
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const updatedScoreCard = scoreInCategory(
    currentPlayer.scoreCard,
    gameState.currentTurn.diceState.dice.map(d => d.value),
    scoreCategory
  );
  
  const completedTurn: PlayerTurn = {
    ...gameState.currentTurn,
    scoreSelected: true,
    turnDuration: Date.now() - gameState.currentTurn.turnStartTime.getTime()
  };
  
  const updatedPlayer: Player = {
    ...currentPlayer,
    scoreCard: updatedScoreCard,
    totalScore: calculateTotalScore(updatedScoreCard)
  };
  
  return {
    ...gameState,
    players: gameState.players.map(p => 
      p.id === currentPlayer.id ? updatedPlayer : p
    ),
    turnHistory: [...gameState.turnHistory, completedTurn],
    currentTurn: null,
    gamePhase: GamePhase.TURN_COMPLETE
  };
}
```

## Player Interface Components

### Current Player Display

```tsx
interface CurrentPlayerProps {
  player: Player;
  turn: PlayerTurn;
  gamePhase: GamePhase;
}

export const CurrentPlayerDisplay: React.FC<CurrentPlayerProps> = ({
  player,
  turn,
  gamePhase
}) => {
  return (
    <div 
      className="current-player-display"
      style={{ backgroundColor: `${player.color}20`, borderColor: player.color }}
    >
      <div className="player-info">
        <div className="player-avatar">
          {player.avatar || player.name.charAt(0).toUpperCase()}
        </div>
        <div className="player-details">
          <h3>{player.name}'s Turn</h3>
          <div className="turn-info">
            <span>Round {turn.turnNumber}/13</span>
            <span>Rolls: {turn.rollsRemaining}/3</span>
            <span>Score: {player.totalScore}</span>
          </div>
        </div>
      </div>
      
      <div className="turn-status">
        {gamePhase === GamePhase.PLAYING && (
          <span className="status-rolling">Rolling Dice</span>
        )}
        {gamePhase === GamePhase.SCORING && (
          <span className="status-scoring">Choose Score</span>
        )}
      </div>
    </div>
  );
};
```

### Player Transition Screen

```tsx
export const PlayerTransition: React.FC<{
  currentPlayer: Player;
  nextPlayer: Player;
  onContinue: () => void;
}> = ({ currentPlayer, nextPlayer, onContinue }) => {
  return (
    <div className="player-transition">
      <div className="transition-message">
        <h2>Great turn, {currentPlayer.name}!</h2>
        <p>You scored {currentPlayer.totalScore} points</p>
      </div>
      
      <div className="handoff-section">
        <div className="pass-device">
          📱 Pass device to {nextPlayer.name}
        </div>
        
        <button
          className="start-turn-button"
          onClick={onContinue}
          style={{ backgroundColor: nextPlayer.color }}
        >
          👋 {nextPlayer.name}, Tap to Start Your Turn
        </button>
      </div>
    </div>
  );
};
```

## Mobile Considerations

### Pass-and-Play Flow

- **Clear Turn Indicators**: Visual cues for whose turn it is
- **Device Handoff**: Smooth transitions between players
- **Privacy**: Option to hide scores during transitions
- **Screen Timeout**: Prevent device sleep during gameplay

```typescript
// Prevent screen timeout during gameplay
function preventScreenTimeout(): void {
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen');
  }
}

// Turn notifications
function showTurnNotification(player: Player): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(200);
  }
  
  // Show toast notification
  const notification = `${player.name}, it's your turn!`;
  // Implementation depends on notification system
}
```

## Testing Strategy

```typescript
describe('Player Management', () => {
  test('creates valid player with required fields', () => {
    const player = createPlayer('Alice', '#FF6B6B');
    expect(player.name).toBe('Alice');
    expect(player.color).toBe('#FF6B6B');
    expect(player.scoreCard).toBeDefined();
  });
  
  test('advances turns correctly', () => {
    const gameState = createGameState(['Alice', 'Bob']);
    const nextState = advanceToNextPlayer(gameState);
    expect(nextState.currentPlayerIndex).toBe(1);
  });
  
  test('handles game completion', () => {
    const gameState = createGameState(['Alice', 'Bob']);
    gameState.roundNumber = 13;
    const nextState = advanceToNextPlayer(gameState);
    expect(nextState.gamePhase).toBe(GamePhase.GAME_COMPLETE);
  });
});
```

This player management system ensures smooth multiplayer gameplay with clear turn management and engaging player interactions optimized for mobile pass-and-play scenarios. 