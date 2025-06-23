import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from 'redis';
import { nanoid } from 'nanoid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Redis client setup
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
await redis.connect();

app.use(cors());
app.use(express.json());

// Game room storage
const rooms = new Map();

// Generate unique 6-character room codes
function generateRoomCode() {
  let code;
  do {
    code = nanoid(6).toUpperCase();
  } while (rooms.has(code));
  return code;
}

// Create initial game state
function createInitialGameState() {
  return {
    players: [],
    currentPlayerIndex: 0,
    currentTurn: 1,
    gamePhase: 'setup',
    dice: Array(5).fill(null).map(() => ({ value: 1, isHeld: false })),
    rollsRemaining: 3,
    scorecards: {},
    roundNumber: 1
  };
}

// Room management
class GameRoom {
  constructor(hostSocketId, hostPlayerName) {
    this.id = nanoid();
    this.code = generateRoomCode();
    this.hostId = hostSocketId;
    this.players = [];
    this.gameState = createInitialGameState();
    this.settings = {
      maxPlayers: 6,
      isPrivate: false,
      allowReconnection: true,
      turnTimeLimit: 0,
      autoStart: false
    };
    this.status = 'waiting';
    this.createdAt = new Date();
    this.lastActivity = new Date();
    
    // Add host as first player
    this.addPlayer(hostSocketId, hostPlayerName, true);
  }

  addPlayer(socketId, playerName, isHost = false) {
    const player = {
      id: socketId,
      socketId,
      name: playerName,
      color: this.getNextPlayerColor(),
      avatar: this.getPlayerAvatar(playerName),
      scoreCard: this.createEmptyScoreCard(),
      totalScore: 0,
      turnOrder: this.players.length,
      isCurrentPlayer: this.players.length === 0,
      isConnected: true,
      isReady: isHost, // Host is ready by default
      lastSeen: new Date(),
      isHost,
      gameStats: {
        gamesPlayed: 0,
        gamesWon: 0,
        averageScore: 0,
        highestScore: 0,
        yahtzeesRolled: 0,
        perfectGames: 0
      }
    };
    
    this.players.push(player);
    this.gameState.players = this.players;
    this.lastActivity = new Date();
    
    return player;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
    this.gameState.players = this.players;
    
    // If host left, assign new host
    if (socketId === this.hostId && this.players.length > 0) {
      this.hostId = this.players[0].socketId;
      this.players[0].isHost = true;
    }
    
    this.lastActivity = new Date();
  }

  setPlayerReady(socketId, isReady) {
    const player = this.players.find(p => p.socketId === socketId);
    if (player) {
      player.isReady = isReady;
      this.lastActivity = new Date();
    }
    
    // Check if all players are ready
    if (this.players.length >= 2 && this.players.every(p => p.isReady)) {
      this.status = 'ready';
    } else {
      this.status = 'waiting';
    }
  }

  startGame() {
    if (this.status === 'ready') {
      this.status = 'playing';
      this.gameState.gamePhase = 'playing';
      this.gameState.currentPlayerIndex = 0;
      this.gameState.players[0].isCurrentPlayer = true;
      this.lastActivity = new Date();
      return true;
    }
    return false;
  }

  getNextPlayerColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[this.players.length % colors.length];
  }

  getPlayerAvatar(name) {
    return name.charAt(0).toUpperCase();
  }

  createEmptyScoreCard() {
    return {
      upperSection: {
        aces: null, twos: null, threes: null, fours: null, fives: null, sixes: null
      },
      lowerSection: {
        threeOfKind: null, fourOfKind: null, fullHouse: null,
        smallStraight: null, largeStraight: null, yahtzee: null, chance: null
      },
      bonusScores: {
        upperSectionBonus: 0,
        yahtzeeBonus: 0
      }
    };
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      hostId: this.hostId,
      players: this.players,
      gameState: this.gameState,
      settings: this.settings,
      status: this.status,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity
    };
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create a new game room
  socket.on('create-room', (data) => {
    const { playerName } = data;
    
    if (!playerName || playerName.trim().length === 0) {
      socket.emit('room-error', { message: 'Player name is required' });
      return;
    }

    const room = new GameRoom(socket.id, playerName.trim());
    rooms.set(room.code, room);
    
    socket.join(room.code);
    
    socket.emit('room-created', {
      room: room.toJSON(),
      playerId: socket.id
    });
    
    console.log(`Room created: ${room.code} by ${playerName}`);
  });

  // Join an existing room
  socket.on('join-room', (data) => {
    const { code, playerName } = data;
    
    if (!code || !playerName || playerName.trim().length === 0) {
      socket.emit('room-error', { message: 'Room code and player name are required' });
      return;
    }

    const room = rooms.get(code.toUpperCase());
    
    if (!room) {
      socket.emit('room-error', { message: 'Room not found' });
      return;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      socket.emit('room-error', { message: 'Room is full' });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('room-error', { message: 'Game has already started' });
      return;
    }

    // Check for duplicate names
    if (room.players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
      socket.emit('room-error', { message: 'Player name already taken' });
      return;
    }

    const player = room.addPlayer(socket.id, playerName.trim());
    socket.join(code.toUpperCase());
    
    // Notify player they joined
    socket.emit('room-joined', {
      room: room.toJSON(),
      playerId: socket.id
    });
    
    // Notify other players
    socket.to(code.toUpperCase()).emit('player-joined', { player });
    
    console.log(`${playerName} joined room ${code}`);
  });

  // Player ready state change
  socket.on('player-ready', (data) => {
    const { roomCode, isReady } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('room-error', { message: 'Room not found' });
      return;
    }

    room.setPlayerReady(socket.id, isReady);
    
    // Notify all players in room
    io.to(roomCode).emit('player-ready-changed', {
      playerId: socket.id,
      isReady,
      roomStatus: room.status
    });
  });

  // Start game
  socket.on('start-game', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('room-error', { message: 'Room not found' });
      return;
    }

    if (socket.id !== room.hostId) {
      socket.emit('room-error', { message: 'Only the host can start the game' });
      return;
    }

    if (room.startGame()) {
      io.to(roomCode).emit('game-started', {
        gameState: room.gameState
      });
      console.log(`Game started in room ${roomCode}`);
    } else {
      socket.emit('room-error', { message: 'Cannot start game - not all players ready' });
    }
  });

  // Game actions
  socket.on('roll-dice', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (!room || room.status !== 'playing') {
      socket.emit('game-error', { message: 'Invalid game state' });
      return;
    }

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.socketId !== socket.id) {
      socket.emit('game-error', { message: 'Not your turn' });
      return;
    }

    if (room.gameState.rollsRemaining <= 0) {
      socket.emit('game-error', { message: 'No rolls remaining' });
      return;
    }

    // Roll dice that aren't held
    room.gameState.dice = room.gameState.dice.map(die => 
      die.isHeld ? die : { ...die, value: Math.floor(Math.random() * 6) + 1 }
    );
    room.gameState.rollsRemaining--;
    room.lastActivity = new Date();

    io.to(roomCode).emit('dice-rolled', {
      dice: room.gameState.dice,
      rollsRemaining: room.gameState.rollsRemaining
    });
  });

  socket.on('hold-die', (data) => {
    const { roomCode, dieIndex } = data;
    const room = rooms.get(roomCode);
    
    if (!room || room.status !== 'playing') {
      socket.emit('game-error', { message: 'Invalid game state' });
      return;
    }

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.socketId !== socket.id) {
      socket.emit('game-error', { message: 'Not your turn' });
      return;
    }

    if (dieIndex >= 0 && dieIndex < room.gameState.dice.length) {
      room.gameState.dice[dieIndex].isHeld = !room.gameState.dice[dieIndex].isHeld;
      room.lastActivity = new Date();

      io.to(roomCode).emit('die-held', {
        dieIndex,
        isHeld: room.gameState.dice[dieIndex].isHeld
      });
    }
  });

  // Leave room
  socket.on('leave-room', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (room) {
      room.removePlayer(socket.id);
      socket.leave(roomCode);
      
      socket.to(roomCode).emit('player-left', { playerId: socket.id });
      
      // Remove room if empty
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted - no players remaining`);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Find and clean up any rooms this player was in
    for (const [code, room] of rooms.entries()) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        room.removePlayer(socket.id);
        socket.to(code).emit('player-left', { playerId: socket.id });
        
        if (room.players.length === 0) {
          rooms.delete(code);
          console.log(`Room ${code} deleted - no players remaining`);
        }
        break;
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size,
    uptime: process.uptime()
  });
});

// Get room info (for debugging)
app.get('/rooms/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (room) {
    res.json(room.toJSON());
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Yahtzee server running on port ${PORT}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
});

// Cleanup old rooms periodically (every 30 minutes)
setInterval(() => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivity > maxAge) {
      rooms.delete(code);
      console.log(`Cleaned up inactive room: ${code}`);
    }
  }
}, 30 * 60 * 1000); 