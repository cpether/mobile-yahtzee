import React, { useState } from 'react';
import type { GameMode } from '../../../types/online';
import './OnlineGameSetup.css';

interface OnlineGameSetupProps {
  mode: GameMode;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  onBack: () => void;
  error?: string | null;
}

export const OnlineGameSetup: React.FC<OnlineGameSetupProps> = ({
  mode,
  onCreateRoom,
  onJoinRoom,
  onBack,
  error
}) => {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isHost = mode === 'online-host';
  const isJoin = mode === 'online-join';

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🎮 OnlineGameSetup: Form submitted');
    console.log('📝 Player name:', playerName);
    console.log('🏠 Is host:', isHost);
    console.log('🔗 Is join:', isJoin);
    
    e.preventDefault();
    
    if (!playerName.trim()) {
      console.log('❌ No player name provided');
      return;
    }

    console.log('⏳ Setting loading state...');
    setIsLoading(true);

    try {
      if (isHost) {
        console.log('🎯 Calling onCreateRoom...');
        onCreateRoom(playerName.trim());
      } else if (isJoin) {
        if (!gameCode.trim()) {
          console.log('❌ No game code provided');
          return;
        }
        console.log('🔗 Calling onJoinRoom...');
        onJoinRoom(gameCode.trim().toUpperCase(), playerName.trim());
      }
    } finally {
      console.log('✅ Resetting loading state...');
      setIsLoading(false);
    }
  };

  const canSubmit = playerName.trim().length > 0 && (!isJoin || gameCode.trim().length > 0);

  return (
    <div className="online-game-setup">
      <div className="setup-header">
        <button className="back-button" onClick={onBack} disabled={isLoading}>
          ← Back
        </button>
        <h1>
          {isHost ? 'Create Online Game' : 'Join Online Game'}
        </h1>
      </div>

      <div className="setup-content">
        <div className="setup-card">
          <div className="mode-info">
            <div className="mode-icon">
              {isHost ? '🎮' : '🔗'}
            </div>
            <h2>
              {isHost ? 'Host a New Game' : 'Join Existing Game'}
            </h2>
            <p>
              {isHost 
                ? 'Create a game room and get a code to share with friends'
                : 'Enter the game code shared by your friend to join their game'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="form-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                disabled={isLoading}
                autoFocus
              />
              <small>This is how other players will see you</small>
            </div>

            {isJoin && (
              <div className="form-group">
                <label htmlFor="gameCode">Game Code</label>
                <input
                  id="gameCode"
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  disabled={isLoading}
                  style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '0.1em' }}
                />
                <small>Ask your friend for the game code</small>
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className={`submit-button ${canSubmit ? 'enabled' : 'disabled'}`}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <span className="loading">
                  <span className="loading-spinner"></span>
                  {isHost ? 'Creating Room...' : 'Joining Game...'}
                </span>
              ) : (
                isHost ? '🎮 Create Game Room' : '🔗 Join Game'
              )}
            </button>
          </form>

          <div className="setup-help">
            <h4>How it works:</h4>
            <ol>
              {isHost ? (
                <>
                  <li>You'll get a unique 6-character game code</li>
                  <li>Share this code with friends</li>
                  <li>Wait for players to join your room</li>
                  <li>Start the game when everyone is ready!</li>
                </>
              ) : (
                <>
                  <li>Get the game code from your friend</li>
                  <li>Enter the code and your name</li>
                  <li>You'll join their game room</li>
                  <li>Mark yourself ready to start playing!</li>
                </>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}; 