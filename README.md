# Mobile Yahtzee Game

A modern web-based implementation of the classic dice game Yahtzee, supporting both local pass-and-play and online multiplayer modes.

## Features

- **Mobile-First Design**: Optimized for touch interactions and small screens
- **Dual Multiplayer Modes**: 
  - Local pass-and-play on a single device
  - Online real-time multiplayer across different devices
- **Game Code System**: Create and join games with unique codes
- **Real-time Synchronization**: All players see dice rolls and scores instantly
- **Animated Dice Rolling**: Engaging visual feedback for dice rolls
- **Official Yahtzee Rules**: Complete implementation of standard Yahtzee scoring
- **Intuitive Scorecard**: Easy-to-use digital scorecard with validation
- **Progressive Web App**: Can be installed on mobile devices

## Technology Stack

- **Frontend**: React 19 with TypeScript, Socket.io Client
- **Backend**: Node.js + Express + Socket.io
- **Styling**: CSS Modules
- **Build Tool**: Vite
- **Testing**: Vitest and React Testing Library
- **Deployment**: Railway for hosting both frontend and backend

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd hackday
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd server && npm install && cd ..
```

### Development

Run the frontend development server:
```bash
npm run dev
```

Run the backend server (in another terminal):
```bash
cd server && npm run dev
```

### Testing

Run tests:
```bash
npm test
```

Run tests with watch mode:
```bash
npm run test:watch
```

### Production Build

Build for production:
```bash
npm run build
```

Start production server (builds frontend and starts backend):
```bash
npm run start:production
```

## Deployment

The application is configured to deploy automatically to Railway when changes are pushed to the main branch and tests pass successfully.

## Project Structure

```
hackday/
├── src/               # Frontend source code
│   ├── components/    # React components
│   ├── contexts/      # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── services/      # Service integrations (socket.io, etc.)
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── server/            # Backend Node.js server
├── public/            # Static assets
├── specs/             # Detailed specification documents
└── docs/              # Documentation
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by the classic Yahtzee dice game
- Built during a hackathon project
