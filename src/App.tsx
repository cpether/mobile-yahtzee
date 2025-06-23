import React from 'react';
import { GameProvider, useGameState } from './contexts/GameContext';
import { Die } from './components/dice/Die/Die';
import { createPlayer } from './utils/gameLogic';
import './styles/globals.css';

// Inner component that uses the game context
function GameContent() {
  const { 
    gameState, 
    startNewGame, 
    rollDice, 
    toggleDieHold, 
    canRoll,
    currentPlayer 
  } = useGameState();

  // Initialize game with a test player if not started
  React.useEffect(() => {
    if (gameState.gamePhase === 'setup') {
      const testPlayer = createPlayer('Player 1');
      startNewGame([testPlayer]);
    }
  }, [gameState.gamePhase, startNewGame]);

  const handleRollDice = () => {
    if (canRoll) {
      rollDice();
    }
  };

  const handleDieClick = (dieIndex: number) => {
    toggleDieHold(dieIndex);
  };

  return (
    <div className="game-container">
      <div className="container">
        <header className="text-center py-4">
          <h1>Mobile Yahtzee</h1>
          <p className="text-muted">Pass-and-play dice game</p>
          {currentPlayer && (
            <p className="text-primary font-medium">
              Current Player: {currentPlayer.name}
            </p>
          )}
        </header>
        
        <main>
          <div className="flex flex-col items-center gap-6">
            <div className="dice-container">
              {gameState.dice.map((die, index) => (
                <Die 
                  key={index}
                  value={die.value} 
                  isHeld={die.isHeld} 
                  isRolling={die.isRolling} 
                  onToggleHold={() => handleDieClick(index)}
                  disabled={gameState.rollsRemaining === 3} // Can't hold before first roll
                />
              ))}
            </div>
            
            <div className="flex gap-4">
              <button 
                className={`btn btn-primary btn-large ${!canRoll ? 'btn-disabled' : ''}`}
                onClick={handleRollDice}
                disabled={!canRoll}
              >
                Roll Dice ({gameState.rollsRemaining} left)
              </button>
              <button 
                className={`btn btn-outline ${gameState.rollsRemaining === 3 ? 'btn-disabled' : ''}`}
                disabled={gameState.rollsRemaining === 3}
                onClick={() => console.log('Score button clicked - scorecard not implemented yet')}
              >
                Score
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted">
                {gameState.rollsRemaining === 3 
                  ? "Click 'Roll Dice' to start your turn!"
                  : gameState.rollsRemaining > 0 
                    ? "Tap dice to hold them, then roll again!"
                    : "Choose a category to score your dice!"
                }
              </p>
              <p className="text-xs text-muted mt-4">
                Turn: {gameState.currentTurn} | Phase: {gameState.gamePhase}
              </p>
            </div>

            {/* Debug info - remove in production */}
            <div className="text-xs text-muted text-center">
              <p>Dice values: [{gameState.dice.map(d => d.value).join(', ')}]</p>
              <p>Held dice: [{gameState.dice.map((d, i) => d.isHeld ? i+1 : '').filter(Boolean).join(', ') || 'none'}]</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

export default App;
