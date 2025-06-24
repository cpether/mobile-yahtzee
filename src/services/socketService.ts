import { io, Socket } from 'socket.io-client';
import type {
  GameRoom,
  ConnectionState,
  CreateRoomData,
  JoinRoomData,
  RoomCreatedData,
  RoomJoinedData,
  PlayerJoinedData,
  PlayerLeftData,
  PlayerReadyData,
  PlayerReadyChangedData,
  StartGameData,
  GameStartedData,
  RollDiceData,
  DiceRolledData,
  HoldDieData,
  DieHeldData,
  SelectScoreData,
  ScoreSelectedData,
  TurnEndedData,
  GameEndedData,
  RoomErrorData,
  GameErrorData
} from '../types/online';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private connectionState: ConnectionState = {
    status: 'disconnected'
  };
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    // Environment-aware server URL configuration
    const isDevelopment = import.meta.env.DEV;
    const productionUrl = import.meta.env.VITE_API_URL;
    const developmentUrl = 'http://localhost:3001';
    
    this.serverUrl = isDevelopment ? developmentUrl : (productionUrl || developmentUrl);
    
    console.log(`SocketService connecting to: ${this.serverUrl} (environment: ${import.meta.env.VITE_APP_ENVIRONMENT || 'development'})`);
  }

  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.connectionState.status = 'connecting';
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.connectionState.status = 'connected';
        this.emit('connection-changed', this.connectionState);
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        this.connectionState.status = 'disconnected';
        this.connectionState.error = reason;
        this.emit('connection-changed', this.connectionState);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.connectionState.status = 'error';
        this.connectionState.error = error.message;
        this.emit('connection-changed', this.connectionState);
        reject(error);
      });

      // Set up game event listeners
      this.setupGameEventListeners();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = { status: 'disconnected' };
    this.eventListeners.clear();
  }

  // Event management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Room management
  async createRoom(playerName: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Room creation timed out'));
      }, 10000);

      this.socket!.emit('create-room', { playerName } as CreateRoomData);

      // Wait for room creation response
      const onRoomCreated = (data: RoomCreatedData) => {
        clearTimeout(timeout);
        this.connectionState.room = data.room;
        this.connectionState.playerId = data.playerId;
        this.emit('room-created', data);
        resolve();
      };

      const onRoomError = (data: RoomErrorData) => {
        clearTimeout(timeout);
        reject(new Error(data.message));
      };

      this.socket!.once('room-created', onRoomCreated);
      this.socket!.once('room-error', onRoomError);
    });
  }

  async joinRoom(code: string, playerName: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Room join timed out'));
      }, 10000);

      this.socket!.emit('join-room', { code, playerName } as JoinRoomData);

      const onRoomJoined = (data: RoomJoinedData) => {
        clearTimeout(timeout);
        this.connectionState.room = data.room;
        this.connectionState.playerId = data.playerId;
        this.emit('room-joined', data);
        resolve();
      };

      const onRoomError = (data: RoomErrorData) => {
        clearTimeout(timeout);
        reject(new Error(data.message));
      };

      this.socket!.once('room-joined', onRoomJoined);
      this.socket!.once('room-error', onRoomError);
    });
  }

  leaveRoom() {
    if (this.socket?.connected && this.connectionState.room) {
      this.socket.emit('leave-room', { roomCode: this.connectionState.room.code });
      this.connectionState.room = undefined;
      this.connectionState.playerId = undefined;
    }
  }

  setPlayerReady(isReady: boolean) {
    if (this.socket?.connected && this.connectionState.room) {
      this.socket.emit('player-ready', {
        roomCode: this.connectionState.room.code,
        isReady
      } as PlayerReadyData);
    }
  }

  startGame() {
    if (this.socket?.connected && this.connectionState.room) {
      this.socket.emit('start-game', {
        roomCode: this.connectionState.room.code
      } as StartGameData);
    }
  }

  // Game actions
  rollDice() {
    if (this.socket?.connected && this.connectionState.room) {
      this.socket.emit('roll-dice', {
        roomCode: this.connectionState.room.code
      } as RollDiceData);
    }
  }

  holdDie(dieIndex: number) {
    if (this.socket?.connected && this.connectionState.room) {
      this.socket.emit('hold-die', {
        roomCode: this.connectionState.room.code,
        dieIndex
      } as HoldDieData);
    }
  }

  selectScore(category: string) {
    if (this.socket?.connected && this.connectionState.room) {
      this.socket.emit('select-score', {
        roomCode: this.connectionState.room.code,
        category
      } as SelectScoreData);
    }
  }

  // Getters
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getCurrentRoom(): GameRoom | undefined {
    return this.connectionState.room;
  }

  getCurrentPlayerId(): string | undefined {
    return this.connectionState.playerId;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Private methods
  private setupGameEventListeners() {
    if (!this.socket) return;

    // Room events
    this.socket.on('player-joined', (data: PlayerJoinedData) => {
      if (this.connectionState.room) {
        this.connectionState.room.players.push(data.player);
      }
      this.emit('player-joined', data);
    });

    this.socket.on('player-left', (data: PlayerLeftData) => {
      if (this.connectionState.room) {
        this.connectionState.room.players = this.connectionState.room.players.filter(
          p => p.id !== data.playerId
        );
      }
      this.emit('player-left', data);
    });

    this.socket.on('player-ready-changed', (data: PlayerReadyChangedData) => {
      if (this.connectionState.room) {
        const player = this.connectionState.room.players.find(p => p.id === data.playerId);
        if (player) {
          player.isReady = data.isReady;
        }
        this.connectionState.room.status = data.roomStatus;
      }
      this.emit('player-ready-changed', data);
    });

    this.socket.on('game-started', (data: GameStartedData) => {
      if (this.connectionState.room) {
        this.connectionState.room.gameState = data.gameState;
        this.connectionState.room.status = 'playing';
      }
      this.emit('game-started', data);
    });

    // Game events
    this.socket.on('dice-rolling-started', (data: any) => {
      if (this.connectionState.room) {
        this.connectionState.room.gameState.dice = data.dice;
      }
      this.emit('dice-rolling-started', data);
    });

    this.socket.on('dice-rolled', (data: DiceRolledData) => {
      if (this.connectionState.room) {
        this.connectionState.room.gameState.dice = data.dice;
        this.connectionState.room.gameState.rollsRemaining = data.rollsRemaining;
      }
      this.emit('dice-rolled', data);
    });

    this.socket.on('die-held', (data: DieHeldData) => {
      if (this.connectionState.room) {
        this.connectionState.room.gameState.dice[data.dieIndex].isHeld = data.isHeld;
      }
      this.emit('die-held', data);
    });

    this.socket.on('score-selected', (data: ScoreSelectedData) => {
      this.emit('score-selected', data);
    });

    this.socket.on('turn-ended', (data: TurnEndedData) => {
      if (this.connectionState.room) {
        this.connectionState.room.gameState = data.gameState;
      }
      this.emit('turn-ended', data);
    });

    this.socket.on('game-ended', (data: GameEndedData) => {
      if (this.connectionState.room) {
        this.connectionState.room.status = 'finished';
      }
      this.emit('game-ended', data);
    });

    // Error events
    this.socket.on('room-error', (data: RoomErrorData) => {
      this.emit('room-error', data);
    });

    this.socket.on('game-error', (data: GameErrorData) => {
      this.emit('game-error', data);
    });
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService; 