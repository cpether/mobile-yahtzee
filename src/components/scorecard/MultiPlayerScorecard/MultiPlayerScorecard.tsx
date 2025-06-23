import React from 'react';
import type { Player, ScoreCategory, Scorecard as ScorecardType, DiceState } from '../../../types/game';
import { SCORE_CATEGORIES } from '../../../constants/scoreCategories';
import { calculateScore, canScoreCategory } from '../../../utils/scoring';
import './MultiPlayerScorecard.css';

interface MultiPlayerScorecardProps {
  players: Player[];
  scorecards: Record<string, ScorecardType>;
  currentDice: DiceState[];
  currentPlayerId: string;
  onScoreSelect: (category: ScoreCategory) => void;
  disabled?: boolean;
}

export const MultiPlayerScorecard: React.FC<MultiPlayerScorecardProps> = ({
  players,
  scorecards,
  currentDice,
  currentPlayerId,
  onScoreSelect,
  disabled = false
}) => {
  const upperSectionCategories: ScoreCategory[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes'
  ];
  
  const lowerSectionCategories: ScoreCategory[] = [
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];

  const calculateSectionTotals = (scorecard: ScorecardType) => {
    const upperSectionTotal = upperSectionCategories.reduce((total, category) => {
      const score = scorecard.scores[category];
      return total + (score || 0);
    }, 0);

    const upperSectionBonus = upperSectionTotal >= 63 ? 35 : 0;
    const upperSectionWithBonus = upperSectionTotal + upperSectionBonus;

    const lowerSectionTotal = lowerSectionCategories.reduce((total, category) => {
      const score = scorecard.scores[category];
      return total + (score || 0);
    }, 0);

    const grandTotal = upperSectionWithBonus + lowerSectionTotal;

    return {
      upperSectionTotal,
      upperSectionBonus,
      upperSectionWithBonus,
      lowerSectionTotal,
      grandTotal
    };
  };

  const renderScoreCell = (player: Player, category: ScoreCategory) => {
    const scorecard = scorecards[player.id];
    if (!scorecard) return null;

    const currentScore = scorecard.scores[category];
    const isScored = currentScore !== null;
    const isCurrentPlayer = player.id === currentPlayerId;
    const potentialScore = isCurrentPlayer ? calculateScore(currentDice, category) : 0;
    const canScore = !disabled && !isScored && isCurrentPlayer && canScoreCategory(scorecard, category);

    const handleClick = () => {
      if (canScore) {
        onScoreSelect(category);
      }
    };

    return (
      <button
        key={`${player.id}-${category}`}
        className={`score-cell ${isScored ? 'scored' : ''} ${canScore ? 'available' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}
        onClick={handleClick}
        disabled={!canScore}
        aria-label={`${player.name} ${SCORE_CATEGORIES[category].name}: ${isScored ? `Scored ${currentScore}` : canScore ? `Score ${potentialScore}` : 'Not available'}`}
      >
        {isScored ? (
          <span className="score-value">{currentScore}</span>
        ) : canScore ? (
          <span className="score-potential">{potentialScore}</span>
        ) : (
          <span className="score-empty">—</span>
        )}
      </button>
    );
  };

  const renderSectionTotalCell = (player: Player, totalType: 'upper' | 'upperBonus' | 'lower' | 'grand') => {
    const scorecard = scorecards[player.id];
    if (!scorecard) return null;

    const totals = calculateSectionTotals(scorecard);
    let value: number;
    
    switch (totalType) {
      case 'upper':
        value = totals.upperSectionTotal;
        break;
      case 'upperBonus':
        value = totals.upperSectionBonus;
        break;
      case 'lower':
        value = totals.lowerSectionTotal;
        break;
      case 'grand':
        value = totals.grandTotal;
        break;
    }

    return (
      <div className={`total-cell ${totalType === 'grand' ? 'grand-total' : ''}`}>
        {value}
      </div>
    );
  };

  return (
    <div 
      className="multi-player-scorecard"
      style={{ '--player-count': players.length } as React.CSSProperties}
    >
      <div className="scorecard-table">
        {/* Header Row with Player Names */}
        <div className="scorecard-header">
          <div className="category-label-header">Category</div>
          {players.map(player => (
            <div 
              key={player.id} 
              className={`player-header ${player.id === currentPlayerId ? 'current-player' : ''}`}
            >
              {player.name}
            </div>
          ))}
        </div>

        {/* Upper Section */}
        <div className="scorecard-section">
          <div className="section-title">Upper Section</div>
          
          {upperSectionCategories.map(category => (
            <div key={category} className="scorecard-row">
              <div className="category-label">
                <span className="category-name">{SCORE_CATEGORIES[category].name}</span>
                <span className="category-description">{SCORE_CATEGORIES[category].description}</span>
              </div>
              {players.map(player => renderScoreCell(player, category))}
            </div>
          ))}

          {/* Upper Section Totals */}
          <div className="scorecard-row total-row">
            <div className="category-label">
              <span className="category-name">Subtotal</span>
            </div>
            {players.map(player => (
              <div key={`${player.id}-upper-total`}>
                {renderSectionTotalCell(player, 'upper')}
              </div>
            ))}
          </div>

          <div className="scorecard-row total-row">
            <div className="category-label">
              <span className="category-name">Bonus (35 if ≥ 63)</span>
            </div>
            {players.map(player => (
              <div key={`${player.id}-upper-bonus`}>
                {renderSectionTotalCell(player, 'upperBonus')}
              </div>
            ))}
          </div>
        </div>

        {/* Lower Section */}
        <div className="scorecard-section">
          <div className="section-title">Lower Section</div>
          
          {lowerSectionCategories.map(category => (
            <div key={category} className="scorecard-row">
              <div className="category-label">
                <span className="category-name">{SCORE_CATEGORIES[category].name}</span>
                <span className="category-description">{SCORE_CATEGORIES[category].description}</span>
              </div>
              {players.map(player => renderScoreCell(player, category))}
            </div>
          ))}

          {/* Lower Section Total */}
          <div className="scorecard-row total-row">
            <div className="category-label">
              <span className="category-name">Lower Total</span>
            </div>
            {players.map(player => (
              <div key={`${player.id}-lower-total`}>
                {renderSectionTotalCell(player, 'lower')}
              </div>
            ))}
          </div>
        </div>

        {/* Grand Total */}
        <div className="scorecard-section grand-total-section">
          <div className="scorecard-row grand-total-row">
            <div className="category-label">
              <span className="category-name">Grand Total</span>
            </div>
            {players.map(player => (
              <div key={`${player.id}-grand-total`}>
                {renderSectionTotalCell(player, 'grand')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="scorecard-hint">
          {disabled 
            ? "Roll dice to see scoring options"
            : "Tap a category to score your roll"
          }
        </div>
      )}
    </div>
  );
}; 