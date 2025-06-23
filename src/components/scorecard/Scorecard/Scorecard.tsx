import React from 'react';
import type { Player, ScoreCategory, Scorecard as ScorecardType, DiceState } from '../../../types/game';
import { SCORE_CATEGORIES } from '../../../constants/scoreCategories';
import { calculateScore, canScoreCategory } from '../../../utils/scoring';
import './Scorecard.css';

interface ScorecardProps {
  player: Player;
  scorecard: ScorecardType;
  currentDice: DiceState[];
  onScoreSelect: (category: ScoreCategory) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const Scorecard: React.FC<ScorecardProps> = ({
  player,
  scorecard,
  currentDice,
  onScoreSelect,
  disabled = false,
  compact = false
}) => {
  const upperSectionCategories: ScoreCategory[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes'
  ];
  
  const lowerSectionCategories: ScoreCategory[] = [
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];

  const renderScoreRow = (category: ScoreCategory) => {
    const categoryInfo = SCORE_CATEGORIES[category];
    const currentScore = scorecard.scores[category];
    const isScored = currentScore !== null;
    const potentialScore = calculateScore(currentDice, category);
    const canScore = !disabled && !isScored && canScoreCategory(scorecard, category);

    const handleClick = () => {
      if (canScore) {
        onScoreSelect(category);
      }
    };

    return (
      <button
        key={category}
        className={`scorecard-row ${isScored ? 'scored' : ''} ${canScore ? 'available' : ''} ${compact ? 'compact' : ''}`}
        onClick={handleClick}
        disabled={!canScore}
        aria-label={`${categoryInfo.name}: ${isScored ? `Scored ${currentScore}` : canScore ? `Score ${potentialScore}` : 'Not available'}`}
      >
        <div className="scorecard-row__info">
          <span className="scorecard-row__name">{categoryInfo.name}</span>
          <span className="scorecard-row__description">{categoryInfo.description}</span>
        </div>
        <div className="scorecard-row__score">
          {isScored ? (
            <span className="score-value">{currentScore}</span>
          ) : canScore ? (
            <span className="score-potential">{potentialScore}</span>
          ) : (
            <span className="score-empty">—</span>
          )}
        </div>
      </button>
    );
  };

  // Calculate section totals
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

  return (
    <div className={`scorecard ${compact ? 'scorecard--compact' : ''}`}>
      <div className="scorecard__header">
        <h3 className="scorecard__title">{player.name}'s Scorecard</h3>
        <div className="scorecard__total">{grandTotal}</div>
      </div>

      <div className="scorecard__content">
        {/* Upper Section */}
        <div className="scorecard__section">
          <h4 className="scorecard__section-title">Upper Section</h4>
          <div className="scorecard__rows">
            {upperSectionCategories.map(renderScoreRow)}
          </div>
          
          <div className="scorecard__section-summary">
            <div className="scorecard-summary-row">
              <span>Subtotal</span>
              <span>{upperSectionTotal}</span>
            </div>
            <div className="scorecard-summary-row">
              <span>Bonus (35 if ≥ 63)</span>
              <span>{upperSectionBonus}</span>
            </div>
            <div className="scorecard-summary-row scorecard-summary-row--total">
              <span>Upper Total</span>
              <span>{upperSectionWithBonus}</span>
            </div>
          </div>
        </div>

        {/* Lower Section */}
        <div className="scorecard__section">
          <h4 className="scorecard__section-title">Lower Section</h4>
          <div className="scorecard__rows">
            {lowerSectionCategories.map(renderScoreRow)}
          </div>
          
          <div className="scorecard__section-summary">
            <div className="scorecard-summary-row scorecard-summary-row--total">
              <span>Lower Total</span>
              <span>{lowerSectionTotal}</span>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="scorecard__grand-total">
          <div className="scorecard-summary-row scorecard-summary-row--grand">
            <span>Grand Total</span>
            <span>{grandTotal}</span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="scorecard__hint">
          {disabled 
            ? "Roll dice to see scoring options"
            : "Tap a category to score your roll"
          }
        </div>
      )}
    </div>
  );
}; 