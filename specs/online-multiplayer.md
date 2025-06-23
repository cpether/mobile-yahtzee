# Online Multiplayer Specification

## Overview

Transform the mobile Yahtzee game from a pass-and-play local multiplayer experience to an online multiplayer game where players use their own devices and connect through unique game codes. This enables real-time multiplayer gameplay with synchronized game state across all connected devices.

## Core Features

### 1. Game Room Creation
- **Host Creation**: Any player can create a new game room
- **Unique Game Codes**: 6-character alphanumeric codes for easy sharing
- **Room Settings**: Host can configure max players, private/public rooms
- **Room Persistence**: Games persist for 24 hours or until completion

### 2. Player Joining
- **Join by Code**: Players enter game code to join existing rooms
- **Player Validation**: Check for duplicate names, room capacity
- **Real-time Updates**: All players see new joiners immediately
- **Ready State**: Players must mark ready before game can start

### 3. Real-time Gameplay
- **Turn Synchronization**: All players see current player's actions live
- **Dice Rolling**: Animated dice visible to all players
- **Score Selection**: Real-time scorecard updates for all players
- **Game State Sync**: Complete game state synchronized across devices

### 4. Connection Management
- **Reconnection**: Players can rejoin if disconnected
- **Offline Handling**: Graceful handling of network issues
- **Player Timeout**: Auto-skip turns after timeout period
- **Host Migration**: Transfer host privileges if host disconnects

## Technology Stack

### Backend Architecture

**Real-time Communication**
- **Socket.io**: WebSocket library for real-time bidirectional communication
- **Node.js + Express**: Lightweight server for game room management
- **In-memory Storage**: Redis for fast game state storage and session management

**Infrastructure**
- **Railway/Render**: Easy deployment for Node.js applications
- **Environment Scaling**: Auto-scaling based on active game rooms
- **CORS Configuration**: Secure cross-origin resource sharing

### Frontend Integration

**Real-time Client**
- **Socket.io Client**: React integration for WebSocket communication
- **Connection States**: Handle connecting, connected, disconnected states
- **Event Handling**: Structured event system for game actions

**State Management Updates**
- **Hybrid State**: Local optimistic updates + server authoritative state
- **Conflict Resolution**: Server state takes precedence on conflicts
- **Error Handling**: Rollback local changes on server rejection

## Game Room Data Model

```typescript
interface GameRoom {
  id: string;                    // Unique room identifier
  code: string;                  // 6-character join code
  hostId: string;                // Host player ID
  players: OnlinePlayer[];       // Connected players
  gameState: GameState;          // Current game state
  settings: RoomSettings;        // Room configuration
  status: RoomStatus;            // Current room status
  createdAt: Date;              // Room creation time
  lastActivity: Date;           // Last activity timestamp
}

interface OnlinePlayer extends Player {
  socketId: string;             // Socket connection ID
  isConnected: boolean;         // Connection status
  isReady: boolean;             // Ready to start game
  lastSeen: Date;               // Last activity timestamp
  isHost: boolean;              // Host privileges
}

interface RoomSettings {
  maxPlayers: number;           // 2-6 players
  isPrivate: boolean;           // Private rooms not listed
  allowReconnection: boolean;   // Allow players to rejoin
  turnTimeLimit: number;        // Turn timeout in seconds (0 = no limit)
  autoStart: boolean;           // Start when all players ready
}

enum RoomStatus {
  WAITING = 'waiting',          // Waiting for players
  READY = 'ready',              // All players ready
  PLAYING = 'playing',          // Game in progress
  FINISHED = 'finished',        // Game completed
  ABANDONED = 'abandoned'       // No active players
}
```

## Real-time Events

### Connection Events
```typescript
// Client to Server
'join-room': { code: string; playerName: string; }
'leave-room': { roomId: string; playerId: string; }
'player-ready': { roomId: string; playerId: string; }
'start-game': { roomId: string; }

// Server to Client
'room-joined': { room: GameRoom; playerId: string; }
'player-joined': { player: OnlinePlayer; }
'player-left': { playerId: string; }
'player-ready-changed': { playerId: string; isReady: boolean; }
'game-started': { gameState: GameState; }
'room-error': { message: string; }
```

### Gameplay Events
```typescript
// Client to Server
'roll-dice': { roomId: string; playerId: string; }
'hold-die': { roomId: string; playerId: string; dieIndex: number; }
'select-score': { roomId: string; playerId: string; category: string; }
'end-turn': { roomId: string; playerId: string; }

// Server to Client
'dice-rolled': { dice: Die[]; rollsRemaining: number; }
'die-held': { dieIndex: number; isHeld: boolean; }
'score-selected': { playerId: string; category: string; score: number; }
'turn-ended': { nextPlayerId: string; gameState: GameState; }
'game-ended': { winner: OnlinePlayer; finalScores: PlayerScore[]; }
```

## Implementation Plan

### Phase 1: Server Setup (Week 1)
1. **Server Bootstrap**
   - Initialize Node.js + Express + Socket.io server
   - Set up Redis for session storage
   - Create basic room management API

2. **Room Management**
   - Implement room creation with unique codes
   - Add player joining/leaving functionality
   - Create room listing and cleanup

3. **Basic Real-time**
   - Socket connection handling
   - Player state synchronization
   - Connection/disconnection events

### Phase 2: Game Integration (Week 2)
1. **Frontend Integration**
   - Add Socket.io client to React app
   - Create online game mode selection
   - Implement room joining UI

2. **Game State Sync**
   - Synchronize dice rolling across clients
   - Real-time scorecard updates
   - Turn management synchronization

3. **Player Management**
   - Online player ready states
   - Host controls and permissions
   - Player timeout handling

### Phase 3: Polish & Reliability (Week 3)
1. **Reconnection Logic**
   - Handle network disconnections
   - Player rejoin functionality
   - Game state recovery

2. **Error Handling**
   - Network error recovery
   - Invalid move rejection
   - Server conflict resolution

3. **Performance Optimization**
   - Minimize data transfer
   - Efficient state updates
   - Memory leak prevention

## User Interface Changes

### Game Mode Selection
```tsx
interface GameModeSelector {
  modes: ['local', 'online-host', 'online-join'];
  onModeSelect: (mode: GameMode) => void;
}
```

### Online Lobby
```tsx
interface OnlineLobby {
  room: GameRoom;
  players: OnlinePlayer[];
  isHost: boolean;
  gameCode: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}
```

### Connection Status
```tsx
interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  playersOnline: number;
  lastSync: Date;
}
```

## Security Considerations

### Input Validation
- **Server-side Validation**: All moves validated on server
- **Rate Limiting**: Prevent spam/abuse of real-time events
- **Player Authentication**: Simple session-based auth

### Data Protection
- **No Personal Data**: Only game usernames stored
- **Temporary Storage**: Game data deleted after 24h
- **HTTPS/WSS**: Encrypted connections in production

### Anti-cheat Measures
- **Server Authority**: Server maintains authoritative game state
- **Move Validation**: All dice rolls and scores validated server-side
- **Timeout Protection**: Prevent players from holding up games

## Deployment Strategy

### Server Deployment
```yaml
# railway.toml or render.yaml
[build]
  builder = "NODEJS"
  buildCommand = "npm install && npm run build"
  
[deploy]
  startCommand = "npm start"
  
[env]
  NODE_ENV = "production"
  REDIS_URL = { from = "RAILWAY_REDIS_URL" }
  PORT = { from = "PORT" }
```

### Environment Configuration
```javascript
// server/config.js
export const config = {
  port: process.env.PORT || 3001,
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  game: {
    roomTimeout: 24 * 60 * 60 * 1000, // 24 hours
    turnTimeout: 120 * 1000,          // 2 minutes
    maxRooms: 1000,
    maxPlayersPerRoom: 6
  }
};
```

## Testing Strategy

### Integration Testing
- **Socket Event Testing**: Verify all real-time events work correctly
- **Room Lifecycle Testing**: Test room creation, joining, playing, cleanup
- **Reconnection Testing**: Verify players can rejoin after disconnection

### Load Testing
- **Concurrent Rooms**: Test multiple simultaneous games
- **Player Capacity**: Test maximum players per room
- **Memory Usage**: Monitor server memory under load

### Error Scenarios
- **Network Failures**: Test handling of connection drops
- **Invalid Moves**: Verify server rejects invalid game actions
- **Room Cleanup**: Test automatic room cleanup and garbage collection

## Monitoring & Analytics

### Real-time Metrics
- **Active Rooms**: Current number of active game rooms
- **Connected Players**: Total players currently connected
- **Games Completed**: Successfully finished games
- **Average Game Duration**: Time from start to completion

### Error Tracking
- **Connection Errors**: Failed socket connections
- **Game State Errors**: Invalid state transitions
- **Performance Issues**: Slow response times or memory leaks

### Business Metrics
- **Daily Active Rooms**: Number of new rooms created daily
- **Player Retention**: How often players return to play
- **Peak Concurrent Usage**: Maximum simultaneous active players

---

This specification provides a comprehensive foundation for implementing online multiplayer functionality while maintaining the core Yahtzee gameplay experience. The phased approach allows for iterative development and testing to ensure a robust, enjoyable multiplayer experience. 