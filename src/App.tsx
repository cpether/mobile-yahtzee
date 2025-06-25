import { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContextProvider';
import { Game } from './components/game/Game/Game';
import { GameModeSelector } from './components/online/GameModeSelector/GameModeSelector';
import { OnlineLobby } from './components/online/OnlineLobby/OnlineLobby';
import { OnlineGameSetup } from './components/online/OnlineGameSetup/OnlineGameSetup';
import { OnlineGame } from './components/online/OnlineGame/OnlineGame';
import { socketService } from './services/socketService';
import type { 
  GameMode, 
  GameRoom, 
  RoomCreatedData, 
  RoomJoinedData, 
  PlayerReadyChangedData, 
  PlayerJoinedData, 
  PlayerLeftData, 
  GameStartedData, 
  RoomErrorData, 
  ConnectionState 
} from './types/online';
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
      socketService.on('room-created', (data?: unknown) => {
        console.log('room-created event received:', data);
        const typedData = data as RoomCreatedData;
        setCurrentRoom(typedData.room);
        setCurrentPlayerId(typedData.playerId);
        setCurrentView('online-lobby');
        setError(null);
      });

      socketService.on('room-joined', (data?: unknown) => {
        console.log('room-joined event received:', data);
        const typedData = data as RoomJoinedData;
        setCurrentRoom(typedData.room);
        setCurrentPlayerId(typedData.playerId);
        setCurrentView('online-lobby');
        setError(null);
      });

      socketService.on('player-ready-changed', (data?: unknown) => {
        const typedData = data as PlayerReadyChangedData;
        setCurrentRoom(prevRoom => {
          if (!prevRoom) return prevRoom;
          
          const updatedPlayers = prevRoom.players.map(player => 
            player.id === typedData.playerId 
              ? { ...player, isReady: typedData.isReady }
              : player
          );
          
          return {
            ...prevRoom,
            players: updatedPlayers,
            status: typedData.roomStatus
          };
        });
      });

      socketService.on('player-joined', (data?: unknown) => {
        const typedData = data as PlayerJoinedData;
        setCurrentRoom(prevRoom => {
          if (!prevRoom) return prevRoom;
          
          // Check if player already exists to prevent duplicates
          const playerExists = prevRoom.players.some(p => p.id === typedData.player.id);
          if (playerExists) {
            return prevRoom;
          }
          
          return {
            ...prevRoom,
            players: [...prevRoom.players, typedData.player]
          };
        });
      });

      socketService.on('player-left', (data?: unknown) => {
        const typedData = data as PlayerLeftData;
        setCurrentRoom(prevRoom => {
          if (!prevRoom) return prevRoom;
          
          return {
            ...prevRoom,
            players: prevRoom.players.filter(p => p.id !== typedData.playerId)
          };
        });
      });

      socketService.on('game-started', (data?: unknown) => {
        const typedData = data as GameStartedData;
        setCurrentRoom(prevRoom => {
          if (!prevRoom) return prevRoom;
          return {
            ...prevRoom,
            gameState: typedData.gameState,
            status: 'playing'
          };
        });
        setCurrentView('online-game');
      });

      socketService.on('room-error', (data?: unknown) => {
        console.log('room-error event received:', data);
        const typedData = data as RoomErrorData;
        setError(typedData.message);
      });

      socketService.on('connection-changed', (data?: unknown) => {
        const connectionState = data as ConnectionState;
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
      } catch {
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

  const handleGameEnd = () => {
    setCurrentView('online-lobby');
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
        return currentRoom && currentPlayerId ? (
          <OnlineGame
            room={currentRoom}
            currentPlayerId={currentPlayerId}
            onGameEnd={handleGameEnd}
          />
        ) : (
          <div>Loading...</div>
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
