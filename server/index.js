import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
// Configure CORS for Socket.io based on environment
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = isProduction 
  ? true  // Allow same-origin requests in production
  : (process.env.CLIENT_URL || "http://localhost:5173"); // Development setup

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Add additional production-specific settings
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// For development: using in-memory storage instead of Redis
// In production, you'd want to use Redis for persistence and scaling
console.log('Using in-memory storage for game rooms (development mode)');

// Configure Express CORS to match Socket.io
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist')));

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
    dice: Array(5).fill(null).map(() => ({ value: 1, isHeld: false, isRolling: false })),
    rollsRemaining: 3,
    scorecards: {},
    roundNumber: 1
  };
}

// Calculate score for a category based on dice values
function calculateCategoryScore(dice, category) {
  const values = dice.map(die => die.value);
  const counts = values.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  
  switch (category) {
    case 'ones':
    case 'twos':
    case 'threes':
    case 'fours':
    case 'fives':
    case 'sixes':
      const targetValue = { ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6 }[category];
      return (counts[targetValue] || 0) * targetValue;
    
    case 'threeOfAKind':
      const hasThreeOfKind = Object.values(counts).some(count => count >= 3);
      return hasThreeOfKind ? values.reduce((sum, val) => sum + val, 0) : 0;
    
    case 'fourOfAKind':
      const hasFourOfKind = Object.values(counts).some(count => count >= 4);
      return hasFourOfKind ? values.reduce((sum, val) => sum + val, 0) : 0;
    
    case 'fullHouse':
      const sortedCounts = Object.values(counts).sort((a, b) => b - a);
      const isFullHouse = sortedCounts[0] === 3 && sortedCounts[1] === 2;
      return isFullHouse ? 25 : 0;
    
    case 'smallStraight':
      const sortedValues = [...new Set(values)].sort((a, b) => a - b);
      const hasSmallStraight = 
        JSON.stringify(sortedValues).includes('[1,2,3,4]') ||
        JSON.stringify(sortedValues).includes('[2,3,4,5]') ||
        JSON.stringify(sortedValues).includes('[3,4,5,6]');
      return hasSmallStraight ? 30 : 0;
    
    case 'largeStraight':
      const isLargeStraight = 
        JSON.stringify(values.sort()) === JSON.stringify([1,2,3,4,5]) ||
        JSON.stringify(values.sort()) === JSON.stringify([2,3,4,5,6]);
      return isLargeStraight ? 40 : 0;
    
    case 'yahtzee':
      const isYahtzee = Object.values(counts).some(count => count === 5);
      return isYahtzee ? 50 : 0;
    
    case 'chance':
      return values.reduce((sum, val) => sum + val, 0);
    
    default:
      return 0;
  }
}

// Create scorecard structure that matches frontend expectations
function createGameScorecard(playerId) {
  return {
    playerId,
    scores: {
      // Upper section
      ones: null,
      twos: null,
      threes: null,
      fours: null,
      fives: null,
      sixes: null,
      // Lower section
      threeOfAKind: null,
      fourOfAKind: null,
      fullHouse: null,
      smallStraight: null,
      largeStraight: null,
      yahtzee: null,
      chance: null
    },
    upperSectionTotal: 0,
    upperSectionBonus: 0,
    lowerSectionTotal: 0,
    grandTotal: 0,
    yahtzeeCount: 0
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
    
    // Add scorecard to gameState for frontend compatibility
    this.gameState.scorecards[socketId] = createGameScorecard(socketId);
    
    this.lastActivity = new Date();
    
    return player;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
    this.gameState.players = this.players;
    
    // Remove scorecard from gameState
    delete this.gameState.scorecards[socketId];
    
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

    // First, set dice to rolling state for animation
    room.gameState.dice = room.gameState.dice.map(die => 
      die.isHeld ? die : { ...die, isRolling: true }
    );
    
    // Emit rolling start event
    io.to(roomCode).emit('dice-rolling-started', {
      dice: room.gameState.dice
    });

    // After animation delay, roll dice and emit final result
    setTimeout(() => {
      room.gameState.dice = room.gameState.dice.map(die => 
        die.isHeld ? die : { ...die, value: Math.floor(Math.random() * 6) + 1, isRolling: false }
      );
      room.gameState.rollsRemaining--;
      room.lastActivity = new Date();

      io.to(roomCode).emit('dice-rolled', {
        dice: room.gameState.dice,
        rollsRemaining: room.gameState.rollsRemaining
      });
    }, 1000); // 1 second animation to match CSS
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

  socket.on('select-score', (data) => {
    const { roomCode, category } = data;
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

    const scorecard = room.gameState.scorecards[socket.id];
    if (!scorecard || scorecard.scores[category] !== null) {
      socket.emit('game-error', { message: 'Invalid category or already scored' });
      return;
    }

    // Calculate score for the category
    const score = calculateCategoryScore(room.gameState.dice, category);
    scorecard.scores[category] = score;
    
    // Update totals (simplified for now)
    const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    const lowerCategories = ['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];
    
    scorecard.upperSectionTotal = upperCategories.reduce((sum, cat) => sum + (scorecard.scores[cat] || 0), 0);
    scorecard.lowerSectionTotal = lowerCategories.reduce((sum, cat) => sum + (scorecard.scores[cat] || 0), 0);
    scorecard.upperSectionBonus = scorecard.upperSectionTotal >= 63 ? 35 : 0;
    scorecard.grandTotal = scorecard.upperSectionTotal + scorecard.lowerSectionTotal + scorecard.upperSectionBonus;
    
    // Move to next turn
    room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.gameState.players.length;
    room.gameState.rollsRemaining = 3;
    room.gameState.dice = room.gameState.dice.map(die => ({ ...die, isHeld: false, isRolling: false }));
    
    // Update current player
    room.gameState.players.forEach((player, index) => {
      player.isCurrentPlayer = index === room.gameState.currentPlayerIndex;
    });
    
    // Check if game is finished (all categories scored for all players)
    const allCategoriesScored = room.gameState.players.every(player => {
      const playerScorecard = room.gameState.scorecards[player.id];
      return Object.values(playerScorecard.scores).every(score => score !== null);
    });
    
    if (allCategoriesScored) {
      room.gameState.gamePhase = 'finished';
      room.status = 'finished';
    }
    
    room.lastActivity = new Date();
    
    io.to(roomCode).emit('turn-ended', {
      gameState: room.gameState,
      scoredCategory: category,
      score: score,
      playerId: socket.id
    });
    
    if (allCategoriesScored) {
      io.to(roomCode).emit('game-ended', {
        gameState: room.gameState,
        finalScores: room.gameState.players.map(p => ({
          playerId: p.id,
          name: p.name,
          totalScore: room.gameState.scorecards[p.id].grandTotal
        }))
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

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
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