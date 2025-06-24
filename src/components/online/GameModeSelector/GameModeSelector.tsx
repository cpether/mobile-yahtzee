import React from 'react';
import type { GameMode } from '../../../types/online';
import './GameModeSelector.css';

interface GameModeSelectorProps {
  onModeSelect: (mode: GameMode) => void;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onModeSelect }) => {
  return (
    <div className="game-mode-selector">
      <h1 className="title">Choose Game Mode</h1>
      <p className="subtitle">How would you like to play?</p>
      
      <div className="mode-options">
        <button 
          className="mode-option local-mode"
          onClick={() => onModeSelect('local')}
        >
          <div className="mode-icon">📱</div>
          <h3>Local Play</h3>
          <p>Pass device around to play with friends</p>
          <div className="mode-features">
            <span>• Share one device</span>
            <span>• 2-6 players</span>
            <span>• Instant setup</span>
          </div>
        </button>

        <button 
          className="mode-option online-host-mode"
          onClick={() => onModeSelect('online-host')}
        >
          <div className="mode-icon">🎮</div>
          <h3>Host Online Game</h3>
          <p>Create a game and invite friends</p>
          <div className="mode-features">
            <span>• Each player uses own device</span>
            <span>• Share game code to invite</span>
            <span>• Real-time multiplayer</span>
          </div>
        </button>

        <button 
          className="mode-option online-join-mode"
          onClick={() => onModeSelect('online-join')}
        >
          <div className="mode-icon">🔗</div>
          <h3>Join Online Game</h3>
          <p>Join a friend's game with code</p>
          <div className="mode-features">
            <span>• Use your own device</span>
            <span>• Enter 6-character code</span>
            <span>• Join existing game</span>
          </div>
        </button>
      </div>

      <div className="help-text">
        <p>
          <strong>New to online play?</strong> Choose "Host Online Game" to create a room, 
          then share the game code with friends so they can join using "Join Online Game".
        </p>
      </div>
    </div>
  );
}; 