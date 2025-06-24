import React, { useState } from 'react';
import type { Player } from '../../../types/game';
import { createPlayer, validatePlayers } from '../../../utils/gameLogic';
import './GameSetup.css';

interface GameSetupProps {
  onStartGame: (players: Player[]) => void;
}

interface PlayerInput {
  name: string;
  color: string;
}

const PLAYER_COLORS = [
  '#1a73e8', // Blue
  '#34a853', // Green  
  '#ea4335', // Red
  '#fbbc04', // Yellow
  '#9c27b0', // Purple
  '#ff9800'  // Orange
];

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerInputs, setPlayerInputs] = useState<PlayerInput[]>([
    { name: '', color: PLAYER_COLORS[0] },
    { name: '', color: PLAYER_COLORS[1] }
  ]);
  const [errors, setErrors] = useState<string[]>([]);

  // Update player inputs when count changes
  React.useEffect(() => {
    setPlayerInputs(prevInputs => {
      const newInputs = Array.from({ length: playerCount }, (_, index) => {
        const existing = prevInputs[index];
        return existing || {
          name: '',
          color: PLAYER_COLORS[index % PLAYER_COLORS.length]
        };
      });
      return newInputs;
    });
  }, [playerCount]);

  const handlePlayerNameChange = (index: number, name: string) => {
    const newInputs = [...playerInputs];
    newInputs[index] = { ...newInputs[index], name };
    setPlayerInputs(newInputs);
    setErrors([]); // Clear errors when user types
  };

  const handlePlayerColorChange = (index: number, color: string) => {
    const newInputs = [...playerInputs];
    newInputs[index] = { ...newInputs[index], color };
    setPlayerInputs(newInputs);
  };

  const handleStartGame = () => {
    // Create players from inputs
    const players: Player[] = playerInputs.map(input => 
      createPlayer(input.name.trim(), input.color)
    );

    // Validate players
    const validationErrors = validatePlayers(players);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Start the game
    onStartGame(players);
  };

  const canStartGame = playerInputs.every(input => input.name.trim().length >= 2);

  return (
    <div className="game-setup">
      <div className="game-setup__header">
        <h1 className="game-setup__title">🎲 Mobile Yahtzee</h1>
        <p className="game-setup__subtitle">Pass-and-play dice game</p>
      </div>

      <div className="game-setup__content">
        <div className="game-setup__section">
          <h2 className="game-setup__section-title">Number of Players</h2>
          <div className="player-count-selector">
            {[2, 3, 4, 5, 6].map(count => (
              <button
                key={count}
                className={`player-count-button ${playerCount === count ? 'active' : ''}`}
                onClick={() => setPlayerCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="game-setup__section">
          <h2 className="game-setup__section-title">Player Names</h2>
          <div className="player-inputs">
            {playerInputs.map((input, index) => (
              <div key={index} className="player-input">
                <div 
                  className="player-color-indicator"
                  style={{ backgroundColor: input.color }}
                />
                <input
                  type="text"
                  className="player-name-input"
                  placeholder={`Player ${index + 1}`}
                  value={input.name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  maxLength={20}
                />
                <select
                  className="player-color-select"
                  value={input.color}
                  onChange={(e) => handlePlayerColorChange(index, e.target.value)}
                >
                  {PLAYER_COLORS.map(color => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {errors.length > 0 && (
          <div className="game-setup__errors">
            {errors.map((error, index) => (
              <p key={index} className="error-message">{error}</p>
            ))}
          </div>
        )}

        <div className="game-setup__actions">
          <button
            className={`btn btn-primary btn-large game-setup__start-button ${!canStartGame ? 'btn-disabled' : ''}`}
            onClick={handleStartGame}
            disabled={!canStartGame}
          >
            Start Game
          </button>
          <p className="game-setup__hint">
            Enter at least 2 characters for each player name
          </p>
        </div>
      </div>
    </div>
  );
}; 