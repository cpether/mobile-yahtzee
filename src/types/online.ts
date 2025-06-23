import type { Player, GameState } from './game';

export type GameMode = 'local' | 'online-host' | 'online-join';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished' | 'abandoned';

export interface OnlinePlayer extends Player {
  socketId: string;
  isConnected: boolean;
  isReady: boolean;
  lastSeen: Date;
  isHost: boolean;
  avatar?: string;
}

export interface RoomSettings {
  maxPlayers: number;
  isPrivate: boolean;
  allowReconnection: boolean;
  turnTimeLimit: number;
  autoStart: boolean;
}

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  players: OnlinePlayer[];
  gameState: GameState;
  settings: RoomSettings;
  status: RoomStatus;
  createdAt: Date;
  lastActivity: Date;
}

export interface ConnectionState {
  status: ConnectionStatus;
  playerId?: string;
  room?: GameRoom;
  error?: string;
}

// Socket event data types
export interface CreateRoomData {
  playerName: string;
}

export interface JoinRoomData {
  code: string;
  playerName: string;
}

export interface RoomCreatedData {
  room: GameRoom;
  playerId: string;
}

export interface RoomJoinedData {
  room: GameRoom;
  playerId: string;
}

export interface PlayerJoinedData {
  player: OnlinePlayer;
}

export interface PlayerLeftData {
  playerId: string;
}

export interface PlayerReadyData {
  roomCode: string;
  isReady: boolean;
}

export interface PlayerReadyChangedData {
  playerId: string;
  isReady: boolean;
  roomStatus: RoomStatus;
}

export interface StartGameData {
  roomCode: string;
}

export interface GameStartedData {
  gameState: GameState;
}

export interface RollDiceData {
  roomCode: string;
}

export interface DiceRolledData {
  dice: Array<{ value: number; isHeld: boolean; isRolling: boolean; }>;
  rollsRemaining: number;
}

export interface HoldDieData {
  roomCode: string;
  dieIndex: number;
}

export interface DieHeldData {
  dieIndex: number;
  isHeld: boolean;
}

export interface SelectScoreData {
  roomCode: string;
  category: string;
}

export interface ScoreSelectedData {
  playerId: string;
  category: string;
  score: number;
}

export interface TurnEndedData {
  nextPlayerId: string;
  gameState: GameState;
}

export interface GameEndedData {
  winner: OnlinePlayer;
  finalScores: Array<{ playerId: string; score: number; }>;
}

export interface RoomErrorData {
  message: string;
}

export interface GameErrorData {
  message: string;
} 