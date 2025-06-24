import React, { useState, useCallback } from 'react';
import type { Player, ScoreCategory } from '../../../types/game';
import { useGameState } from '../../../hooks/useGameState';
import { GameSetup } from '../GameSetup/GameSetup';
import { GameBoard } from '../GameBoard/GameBoard';
import { GameSummary } from '../GameSummary/GameSummary';


import './Game.css';

type GameView = 'setup' | 'playing' | 'scoring' | 'summary';

export const Game: React.FC = () => {
  const { gameState, startNewGame, rollDice, toggleDieHold, scoreCategory } = useGameState();
  const [currentView, setCurrentView] = useState<GameView>('setup');

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
  }, [gameState.players, gameState.currentPlayerIndex, gameState.gamePhase, scoreCategory]);

  const handleNewGame = useCallback(() => {
    setCurrentView('setup');
  }, []);

  const handleViewScorecards = useCallback(() => {
    // This will show the multi-player scorecard in GameSummary
  }, []);

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



  if (currentView === 'playing' || currentView === 'scoring') {
    return (
      <GameBoard
        gameState={gameState}
        onRollDice={handleRollDice}
        onToggleDieHold={toggleDieHold}
        onScoreSelect={handleScoreSelect}
        showScoring={currentView === 'scoring'}
      />
    );
  }

  return null;
}; 