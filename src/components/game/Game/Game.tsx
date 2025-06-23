import React, { useState, useCallback } from 'react';
import type { Player, ScoreCategory } from '../../../types/game';
import { useGameState } from '../../../contexts/GameContext';
import { GameSetup } from '../GameSetup/GameSetup';
import { GameBoard } from '../GameBoard/GameBoard';
import { GameSummary } from '../GameSummary/GameSummary';
import { Scorecard } from '../../scorecard/Scorecard/Scorecard';
import { MultiPlayerScorecard } from '../../scorecard/MultiPlayerScorecard/MultiPlayerScorecard';

import './Game.css';

type GameView = 'setup' | 'playing' | 'scoring' | 'summary';

export const Game: React.FC = () => {
  const { gameState, startNewGame, rollDice, toggleDieHold, scoreCategory } = useGameState();
  const [currentView, setCurrentView] = useState<GameView>('setup');
  const [showScorecard, setShowScorecard] = useState(false);

  const handleStartGame = useCallback((players: Player[]) => {
    startNewGame(players);
    setCurrentView('playing');
  }, [startNewGame]);

  const handleRollDice = useCallback(() => {
    rollDice();
    // If no rolls remaining, show scoring view
    if (gameState.rollsRemaining === 1) {
      setCurrentView('scoring');
    }
  }, [rollDice, gameState.rollsRemaining]);

  const handleScoreSelect = useCallback((category: ScoreCategory) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    scoreCategory(category);
    
    // Check if game is complete
    if (gameState.gamePhase === 'finished') {
      setCurrentView('summary');
    } else {
      setCurrentView('playing');
    }
    setShowScorecard(false);
  }, [gameState.dice, gameState.players, gameState.currentPlayerIndex, gameState.gamePhase, scoreCategory]);

  const handleNewGame = useCallback(() => {
    setCurrentView('setup');
    setShowScorecard(false);
  }, []);

  const handleViewScorecards = useCallback(() => {
    setShowScorecard(true);
  }, []);

  const handleBackToGame = useCallback(() => {
    setShowScorecard(false);
  }, []);

  const handleShowScorecard = useCallback(() => {
    setShowScorecard(true);
  }, []);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentScorecard = currentPlayer?.id ? gameState.scorecards[currentPlayer.id] : null;

  // Handle game completion detection
  React.useEffect(() => {
    if (gameState.gamePhase === 'finished' && currentView !== 'summary') {
      setCurrentView('summary');
    }
  }, [gameState.gamePhase, currentView]);

  if (currentView === 'setup') {
    return <GameSetup onStartGame={handleStartGame} />;
  }

  if (currentView === 'summary') {
    return (
      <GameSummary
        players={gameState.players}
        scorecards={gameState.scorecards}
        onNewGame={handleNewGame}
        onViewScorecards={handleViewScorecards}
      />
    );
  }

  if (showScorecard) {
    return (
      <div className="game-scorecard-view">
        <div className="scorecard-header">
          <button 
            className="btn btn-secondary"
            onClick={handleBackToGame}
          >
            ← Back to Game
          </button>
          <h2>All Scores</h2>
          <div className="scorecard-spacer" />
        </div>
        <MultiPlayerScorecard
          players={gameState.players}
          scorecards={gameState.scorecards}
          currentDice={gameState.dice}
          currentPlayerId={currentPlayer?.id || ''}
          onScoreSelect={handleScoreSelect}
          disabled={gameState.rollsRemaining > 0}
        />
      </div>
    );
  }

  if (currentView === 'playing' || currentView === 'scoring') {
    return (
      <GameBoard
        gameState={gameState}
        onRollDice={handleRollDice}
        onToggleDieHold={toggleDieHold}
        onShowScorecard={handleShowScorecard}
        onScoreSelect={handleScoreSelect}
        showScoring={currentView === 'scoring'}
      />
    );
  }

  return null;
}; 