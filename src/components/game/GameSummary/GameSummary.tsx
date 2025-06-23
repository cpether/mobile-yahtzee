import React from 'react';
import type { Player, Scorecard } from '../../../types/game';
import { calculateGrandTotal } from '../../../utils/scoring';
import './GameSummary.css';

interface GameSummaryProps {
  players: Player[];
  scorecards: Record<string, Scorecard>;
  onNewGame: () => void;
  onViewScorecards: () => void;
}

interface PlayerResult {
  player: Player;
  scorecard: Scorecard;
  rank: number;
  totalScore: number;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  players,
  scorecards,
  onNewGame,
  onViewScorecards
}) => {
  // Calculate final scores and rankings
  const playerResults: PlayerResult[] = players
    .map(player => ({
      player,
      scorecard: scorecards[player.id],
      rank: 0, // Will be calculated below
      totalScore: calculateGrandTotal(scorecards[player.id])
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((result, index) => ({
      ...result,
      rank: index + 1
    }));

  const winner = playerResults[0];
  const hasYahtzee = (scorecard: Scorecard) => scorecard.scores.yahtzee !== null && scorecard.scores.yahtzee > 0;

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🎯';
    }
  };

  const getRankText = (rank: number) => {
    switch (rank) {
      case 1: return '1st Place';
      case 2: return '2nd Place';
      case 3: return '3rd Place';
      default: return `${rank}th Place`;
    }
  };

  return (
    <div className="game-summary">
      <div className="game-summary__header">
        <h1 className="game-summary__title">🎉 Game Complete!</h1>
        <div className="game-summary__winner">
          <div className="winner-trophy">🏆</div>
          <div className="winner-info">
            <div className="winner-name">{winner.player.name}</div>
            <div className="winner-score">{winner.totalScore} points</div>
          </div>
        </div>
      </div>

      <div className="game-summary__results">
        <h2 className="results-title">Final Rankings</h2>
        <div className="results-list">
          {playerResults.map(result => (
            <div
              key={result.player.id}
              className={`result-item ${result.rank === 1 ? 'result-item--winner' : ''}`}
            >
              <div className="result-rank">
                <span className="rank-emoji">{getRankEmoji(result.rank)}</span>
                <span className="rank-text">{getRankText(result.rank)}</span>
              </div>
              
              <div className="result-player">
                <div 
                  className="player-color-indicator"
                  style={{ backgroundColor: result.player.color || '#1a73e8' }}
                />
                <div className="player-info">
                  <div className="player-name">{result.player.name}</div>
                  <div className="player-achievements">
                    {hasYahtzee(result.scorecard) && (
                      <span className="achievement">⚡ Yahtzee!</span>
                    )}
                    {result.scorecard.upperSectionBonus > 0 && (
                      <span className="achievement">💎 Upper Bonus</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="result-score">
                <span className="score-value">{result.totalScore}</span>
                <span className="score-label">points</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="game-summary__stats">
        <h3 className="stats-title">Game Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{Math.max(...playerResults.map(r => r.totalScore))}</div>
            <div className="stat-label">Highest Score</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {Math.round(playerResults.reduce((sum, r) => sum + r.totalScore, 0) / playerResults.length)}
            </div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {playerResults.filter(r => hasYahtzee(r.scorecard)).length}
            </div>
            <div className="stat-label">Yahtzees</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {playerResults.filter(r => r.scorecard.upperSectionBonus > 0).length}
            </div>
            <div className="stat-label">Upper Bonuses</div>
          </div>
        </div>
      </div>

      <div className="game-summary__actions">
        <button 
          className="btn btn-primary btn-large"
          onClick={onNewGame}
        >
          🎲 New Game
        </button>
        <button 
          className="btn btn-secondary btn-large"
          onClick={onViewScorecards}
        >
          📊 View Scorecards
        </button>
      </div>

      <div className="game-summary__congratulations">
        <p>
          {winner.totalScore >= 300 ? "🔥 Exceptional game!" :
           winner.totalScore >= 250 ? "⭐ Great game!" :
           winner.totalScore >= 200 ? "👏 Well played!" :
           "🎯 Good game everyone!"}
        </p>
        <p className="thanks-message">Thanks for playing Mobile Yahtzee!</p>
      </div>
    </div>
  );
}; 