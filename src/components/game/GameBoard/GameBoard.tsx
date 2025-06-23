import React from 'react';
import type { GameState, ScoreCategory } from '../../../types/game';
import { Die } from '../../dice/Die/Die';
import { Scorecard } from '../../scorecard/Scorecard/Scorecard';
import { calculateScore, canScoreCategory } from '../../../utils/scoring';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onRollDice: () => void;
  onToggleDieHold: (dieIndex: number) => void;
  onShowScorecard: () => void;
  onScoreSelect: (category: ScoreCategory) => void;
  showScoring: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onRollDice,
  onToggleDieHold,
  onShowScorecard,
  onScoreSelect,
  showScoring
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentScorecard = currentPlayer?.id ? gameState.scorecards[currentPlayer.id] : null;
  
  if (!currentPlayer || !currentScorecard) {
    return null;
  }

  const canRoll = gameState.rollsRemaining > 0;
  const mustScore = gameState.rollsRemaining === 0;

  const getAvailableCategories = (): ScoreCategory[] => {
    const allCategories: ScoreCategory[] = [
      'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
      'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight',
      'largeStraight', 'yahtzee', 'chance'
    ];
    
    return allCategories.filter(category => canScoreCategory(currentScorecard, category));
  };

  const getGameProgress = (): { current: number; total: number } => {
    const totalCategories = 13;
    const filledCategories = Object.values(currentScorecard.scores).filter(score => score !== null).length;
    return { current: filledCategories, total: totalCategories };
  };

  const progress = getGameProgress();

  return (
    <div className="game-board">
      {/* Header */}
      <div className="game-board__header">
        <div className="current-player">
          <div 
            className="player-color-indicator"
            style={{ backgroundColor: currentPlayer.color || '#1a73e8' }}
          />
          <div className="player-info">
            <h2 className="player-name">{currentPlayer.name}</h2>
            <p className="player-turn">Turn {gameState.currentTurn}</p>
          </div>
        </div>
        <div className="game-progress">
          <div className="progress-text">
            {progress.current}/{progress.total} categories
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dice Area */}
      <div className="game-board__dice">
        <div className="dice-container">
          {gameState.dice.map((die, index) => (
            <Die
              key={index}
              value={die.value}
              isHeld={die.isHeld}
              isRolling={die.isRolling}
              onToggleHold={() => onToggleDieHold(index)}
              disabled={gameState.rollsRemaining === 3} // Can't hold on first roll
            />
          ))}
        </div>
        
        <div className="dice-info">
          <div className="rolls-remaining">
            <span className="rolls-count">{gameState.rollsRemaining}</span>
            <span className="rolls-label">rolls left</span>
          </div>
          
          {gameState.rollsRemaining > 0 && (
            <p className="dice-hint">
              {gameState.rollsRemaining === 3 
                ? "Roll to start your turn" 
                : "Tap dice to hold, then roll again"}
            </p>
          )}
          
          {mustScore && (
            <p className="dice-hint score-hint">
              Choose a category to score your roll
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="game-board__actions">
        {canRoll && (
          <button
            className="btn btn-primary btn-large roll-button"
            onClick={onRollDice}
          >
            🎲 Roll Dice
          </button>
        )}
        
        {!canRoll && (
          <button
            className="btn btn-secondary btn-large"
            onClick={onShowScorecard}
          >
            📊 View All Scores
          </button>
        )}
      </div>

      {/* Quick Scoring */}
      {showScoring && (
        <div className="game-board__scoring">
          <h3 className="scoring-title">Choose a Category</h3>
          <div className="scoring-options">
            {getAvailableCategories().map(category => {
              const score = calculateScore(gameState.dice, category);
              return (
                <button
                  key={category}
                  className="scoring-option"
                  onClick={() => onScoreSelect(category)}
                >
                  <span className="category-name">{category}</span>
                  <span className="category-score">{score}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact Scorecard Preview */}
      {!showScoring && (
        <div className="game-board__scorecard-preview">
          <div className="scorecard-preview-header">
            <h3>Scorecard Preview</h3>
            <button 
              className="btn btn-link"
              onClick={onShowScorecard}
            >
              View All Scores →
            </button>
          </div>
          <Scorecard
            player={currentPlayer}
            scorecard={currentScorecard}
            currentDice={gameState.dice}
            onScoreSelect={onScoreSelect}
            disabled={canRoll}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}; 