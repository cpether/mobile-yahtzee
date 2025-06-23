import React, { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import { Game } from './components/game/Game/Game';
import { GameModeSelector } from './components/online/GameModeSelector/GameModeSelector';
import { OnlineLobby } from './components/online/OnlineLobby/OnlineLobby';
import { OnlineGameSetup } from './components/online/OnlineGameSetup/OnlineGameSetup';
import { socketService } from './services/socketService';
import type { GameMode, GameRoom } from './types/online';
import './App.css';

type AppView = 'mode-select' | 'online-setup' | 'online-lobby' | 'local-game' | 'online-game';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('mode-select');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection and event listeners
  useEffect(() => {
    const setupSocketListeners = () => {
      socketService.on('room-created', (data: any) => {
        setCurrentRoom(data.room);
        setCurrentPlayerId(data.playerId);
        setCurrentView('online-lobby');
        setError(null);
      });

      socketService.on('room-joined', (data: any) => {
        setCurrentRoom(data.room);
        setCurrentPlayerId(data.playerId);
        setCurrentView('online-lobby');
        setError(null);
      });

      socketService.on('game-started', () => {
        setCurrentView('online-game');
      });

      socketService.on('room-error', (data: any) => {
        setError(data.message);
      });

      socketService.on('connection-changed', (connectionState: any) => {
        if (connectionState.status === 'error') {
          setError('Connection failed. Please check if the server is running.');
        }
      });
    };

    setupSocketListeners();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleModeSelect = async (mode: GameMode) => {
    setGameMode(mode);
    setError(null);

    if (mode === 'local') {
      setCurrentView('local-game');
    } else {
      // For online modes, connect to server first
      try {
        await socketService.connect();
        setCurrentView('online-setup');
      } catch (err) {
        setError('Failed to connect to server. Please make sure the server is running on port 3001.');
      }
    }
  };

  const handleCreateRoom = async (playerName: string) => {
    try {
      await socketService.createRoom(playerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  const handleJoinRoom = async (code: string, playerName: string) => {
    try {
      await socketService.joinRoom(code, playerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  const handleBackToModeSelect = () => {
    socketService.disconnect();
    setCurrentView('mode-select');
    setGameMode(null);
    setCurrentRoom(null);
    setCurrentPlayerId(null);
    setError(null);
  };

  const handleGameStart = () => {
    setCurrentView('online-game');
  };

  const handleLeaveRoom = () => {
    setCurrentView('online-setup');
    setCurrentRoom(null);
    setCurrentPlayerId(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'mode-select':
        return <GameModeSelector onModeSelect={handleModeSelect} />;

      case 'online-setup':
        return (
          <OnlineGameSetup
            mode={gameMode!}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBack={handleBackToModeSelect}
            error={error}
          />
        );

      case 'online-lobby':
        return currentRoom && currentPlayerId ? (
          <OnlineLobby
            room={currentRoom}
            currentPlayerId={currentPlayerId}
            onGameStart={handleGameStart}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : (
          <div>Loading...</div>
        );

      case 'local-game':
        return (
          <GameProvider>
            <Game />
          </GameProvider>
        );

             case 'online-game':
         return (
           <GameProvider>
             <Game />
           </GameProvider>
         );

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="App">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {renderCurrentView()}
    </div>
  );
}

export default App;
