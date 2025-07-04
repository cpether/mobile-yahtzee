import React, { useState, useCallback, useEffect } from 'react';
import type { GameRoom, DiceRolledData, TurnEndedData } from '../../../types/online';
import type { ScoreCategory, DiceState } from '../../../types/game';
import { socketService } from '../../../services/socketService';
import { GameBoard } from '../../game/GameBoard/GameBoard';
import { GameSummary } from '../../game/GameSummary/GameSummary';
import './OnlineGame.css';

interface OnlineGameProps {
  room: GameRoom;
  currentPlayerId: string;
  onGameEnd: () => void;
}

export const OnlineGame: React.FC<OnlineGameProps> = ({
  room,
  currentPlayerId,
  onGameEnd
}) => {
  const [gameState, setGameState] = useState(room.gameState);
  const [showScoring, setShowScoring] = useState(false);
  
  const isCurrentPlayerTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;
  const isGameFinished = gameState.gamePhase === 'finished';



  // Listen for game state updates from server
  useEffect(() => {
    const handleDiceRollingStarted = (data?: unknown) => {
      const typedData = data as { dice: DiceState[] };
      setGameState(prevState => ({
        ...prevState,
        dice: typedData.dice
      }));
    };

    const handleDiceRolled = (data?: unknown) => {
      const typedData = data as DiceRolledData;
      setGameState(prevState => ({
        ...prevState,
        dice: typedData.dice,
        rollsRemaining: typedData.rollsRemaining
      }));
      
      // Show scoring if no rolls remaining
      if (typedData.rollsRemaining === 0) {
        setShowScoring(true);
      }
    };

    const handleDieHeld = (data?: unknown) => {
      const typedData = data as { dieIndex: number; isHeld: boolean };
      setGameState(prevState => ({
        ...prevState,
        dice: prevState.dice.map((die, index) => 
          index === typedData.dieIndex ? { ...die, isHeld: typedData.isHeld } : die
        )
      }));
    };

    const handleTurnEnded = (data?: unknown) => {
      const typedData = data as TurnEndedData;
      setGameState(typedData.gameState);
      setShowScoring(false);
    };

    const handleGameEnded = () => {
      setGameState(prevState => ({
        ...prevState,
        gamePhase: 'finished'
      }));
    };

    socketService.on('dice-rolling-started', handleDiceRollingStarted);
    socketService.on('dice-rolled', handleDiceRolled);
    socketService.on('die-held', handleDieHeld);
    socketService.on('turn-ended', handleTurnEnded);
    socketService.on('game-ended', handleGameEnded);

    return () => {
      socketService.off('dice-rolling-started', handleDiceRollingStarted);
      socketService.off('dice-rolled', handleDiceRolled);
      socketService.off('die-held', handleDieHeld);
      socketService.off('turn-ended', handleTurnEnded);
      socketService.off('game-ended', handleGameEnded);
    };
  }, []);

  const handleRollDice = useCallback(() => {
    if (isCurrentPlayerTurn && gameState.rollsRemaining > 0) {
      socketService.rollDice();
    }
  }, [isCurrentPlayerTurn, gameState.rollsRemaining]);

  const handleToggleDieHold = useCallback((dieIndex: number) => {
    if (isCurrentPlayerTurn && gameState.rollsRemaining < 3) {
      socketService.holdDie(dieIndex);
    }
  }, [isCurrentPlayerTurn, gameState.rollsRemaining]);

  const handleScoreSelect = useCallback((category: ScoreCategory) => {
    if (isCurrentPlayerTurn) {
      socketService.selectScore(category);
      setShowScoring(false);
    }
  }, [isCurrentPlayerTurn]);

  const handleNewGame = useCallback(() => {
    onGameEnd();
  }, [onGameEnd]);

  const handleViewScorecards = useCallback(() => {
    // Could implement a detailed scorecard view
  }, []);

  if (isGameFinished) {
    return (
      <GameSummary
        players={gameState.players}
        scorecards={gameState.scorecards}
        onNewGame={handleNewGame}
        onViewScorecards={handleViewScorecards}
      />
    );
  }

  return (
    <div className="online-game">
      <div className="game-header">
        <h2>Online Yahtzee</h2>
        <div className="room-code">Room: {room.code}</div>
      </div>
      
      <div className="turn-indicator">
        {isCurrentPlayerTurn ? (
          <div className="your-turn">🎯 Your Turn!</div>
        ) : (
          <div className="waiting-turn">
            ⏳ Waiting for {gameState.players[gameState.currentPlayerIndex]?.name}...
          </div>
        )}
      </div>

      <GameBoard
        gameState={gameState}
        onRollDice={handleRollDice}
        onToggleDieHold={handleToggleDieHold}
        onScoreSelect={handleScoreSelect}
        showScoring={showScoring || gameState.rollsRemaining === 0}
      />
    </div>
  );
}; 