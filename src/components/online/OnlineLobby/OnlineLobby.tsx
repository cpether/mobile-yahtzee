import React, { useState, useEffect } from 'react';
import type { GameRoom, OnlinePlayer } from '../../../types/online';
import { socketService } from '../../../services/socketService';
import './OnlineLobby.css';

interface OnlineLobbyProps {
  room: GameRoom;
  currentPlayerId: string;
  onGameStart: () => void;
  onLeaveRoom: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  room,
  currentPlayerId,
  onGameStart,
  onLeaveRoom
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const canStartGame = room.status === 'ready' && isHost;
  const allPlayersReady = room.players.length >= 2 && room.players.every(p => p.isReady);
  const isReady = currentPlayer?.isReady || false;

  useEffect(() => {
    const handlePlayerReadyChanged = () => {
      // Force re-render when player ready states change
    };

    const handleGameStarted = () => {
      onGameStart();
    };

    socketService.on('player-ready-changed', handlePlayerReadyChanged);
    socketService.on('game-started', handleGameStarted);

    return () => {
      socketService.off('player-ready-changed', handlePlayerReadyChanged);
      socketService.off('game-started', handleGameStarted);
    };
  }, [onGameStart]);

  const handleReadyToggle = () => {
    const newReadyState = !isReady;
    socketService.setPlayerReady(newReadyState);
  };

  const handleStartGame = () => {
    if (canStartGame) {
      socketService.startGame();
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleLeaveRoom = () => {
    socketService.leaveRoom();
    onLeaveRoom();
  };

  return (
    <div className="online-lobby">
      <div className="lobby-header">
        <h1>Game Lobby</h1>
        <button className="leave-button" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="room-info">
        <div className="game-code-section">
          <h2>Game Code</h2>
          <div className="game-code-display">
            <span className="game-code">{room.code}</span>
            <button 
              className={`copy-button ${copiedCode ? 'copied' : ''}`}
              onClick={handleCopyCode}
            >
              {copiedCode ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p className="code-hint">Share this code with friends to join the game</p>
        </div>

        <div className="room-status">
          <div className="status-indicator">
            <span className={`status-dot ${room.status}`}></span>
            <span className="status-text">
              {room.status === 'waiting' && 'Waiting for players'}
              {room.status === 'ready' && 'Ready to start!'}
              {room.status === 'playing' && 'Game in progress'}
            </span>
          </div>
          <div className="player-count">
            {room.players.length}/{room.settings.maxPlayers} players
          </div>
        </div>
      </div>

      <div className="players-section">
        <h3>Players ({room.players.length})</h3>
        <div className="players-list">
          {room.players.map((player: OnlinePlayer) => (
            <div 
              key={player.id} 
              className={`player-card ${player.id === currentPlayerId ? 'current-player' : ''}`}
            >
              <div className="player-avatar" style={{ backgroundColor: player.color }}>
                {player.avatar}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player.name}
                  {player.isHost && <span className="host-badge">Host</span>}
                  {player.id === currentPlayerId && <span className="you-badge">You</span>}
                </div>
                <div className="player-status">
                  <span className={`ready-indicator ${player.isReady ? 'ready' : 'not-ready'}`}>
                    {player.isReady ? '✓ Ready' : '⏳ Not Ready'}
                  </span>
                  {!player.isConnected && (
                    <span className="disconnected-indicator">🔌 Disconnected</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-actions">
        {!isHost && (
          <button 
            className={`ready-button ${isReady ? 'ready' : 'not-ready'}`}
            onClick={handleReadyToggle}
          >
            {isReady ? '✓ Ready' : 'Mark Ready'}
          </button>
        )}

        {isHost && (
          <div className="host-actions">
            <button 
              className={`ready-button ${isReady ? 'ready' : 'not-ready'}`}
              onClick={handleReadyToggle}
            >
              {isReady ? '✓ Ready' : 'Mark Ready'}
            </button>
            <button 
              className={`start-game-button ${canStartGame ? 'enabled' : 'disabled'}`}
              onClick={handleStartGame}
              disabled={!canStartGame}
            >
              {allPlayersReady ? '🎮 Start Game' : 'Waiting for players...'}
            </button>
          </div>
        )}
      </div>

      <div className="lobby-info">
        <div className="game-rules">
          <h4>Game Rules</h4>
          <ul>
            <li>Each player needs their own device</li>
            <li>Take turns rolling dice and scoring</li>
            <li>Complete 13 rounds to finish the game</li>
            <li>Highest total score wins!</li>
          </ul>
        </div>
        
        <div className="room-settings">
          <h4>Room Settings</h4>
          <ul>
            <li>Max Players: {room.settings.maxPlayers}</li>
            <li>Turn Timer: {room.settings.turnTimeLimit ? `${room.settings.turnTimeLimit}s` : 'None'}</li>
            <li>Reconnection: {room.settings.allowReconnection ? 'Allowed' : 'Disabled'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 