import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { Die } from './components/dice/Die/Die';
import './styles/globals.css';

function App() {
  return (
    <GameProvider>
      <div className="game-container">
        <div className="container">
          <header className="text-center py-4">
            <h1>Mobile Yahtzee</h1>
            <p className="text-muted">Pass-and-play dice game</p>
          </header>
          
          <main>
            <div className="flex flex-col items-center gap-6">
              <div className="dice-container">
                <Die 
                  value={1} 
                  isHeld={false} 
                  isRolling={false} 
                  onToggleHold={() => console.log('Die clicked')}
                />
                <Die 
                  value={2} 
                  isHeld={true} 
                  isRolling={false} 
                  onToggleHold={() => console.log('Die clicked')}
                />
                <Die 
                  value={3} 
                  isHeld={false} 
                  isRolling={false} 
                  onToggleHold={() => console.log('Die clicked')}
                />
                <Die 
                  value={4} 
                  isHeld={false} 
                  isRolling={false} 
                  onToggleHold={() => console.log('Die clicked')}
                />
                <Die 
                  value={5} 
                  isHeld={false} 
                  isRolling={false} 
                  onToggleHold={() => console.log('Die clicked')}
                />
              </div>
              
              <div className="flex gap-4">
                <button className="btn btn-primary btn-large">
                  Roll Dice
                </button>
                <button className="btn btn-outline">
                  Score
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted">
                  Tap dice to hold them, then roll again!
                </p>
                <p className="text-xs text-muted mt-4">
                  Rolls remaining: 3
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </GameProvider>
  );
}

export default App;
