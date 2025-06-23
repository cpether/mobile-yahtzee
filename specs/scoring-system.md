# Scoring System Specification

## Overview

The scoring system implements the official Yahtzee scoring rules, handles score validation, manages the scorecard, and provides game completion logic. This specification covers all scoring categories, bonus calculations, and the digital scorecard interface.

## Scoring Categories

### Upper Section (Sum of Matching Dice)

Each category scores the sum of all dice showing that number:

| Category | Description | Scoring Logic | Example |
|----------|-------------|---------------|---------|
| **Ones** | Sum of all 1s | `count(1) × 1` | [1,1,3,4,5] = 2 points |
| **Twos** | Sum of all 2s | `count(2) × 2` | [2,2,2,4,5] = 6 points |
| **Threes** | Sum of all 3s | `count(3) × 3` | [3,3,3,3,1] = 12 points |
| **Fours** | Sum of all 4s | `count(4) × 4` | [4,4,4,2,6] = 12 points |
| **Fives** | Sum of all 5s | `count(5) × 5` | [5,5,1,2,3] = 10 points |
| **Sixes** | Sum of all 6s | `count(6) × 6` | [6,6,6,6,6] = 30 points |

**Upper Section Bonus:**
- If upper section total ≥ 63 points: +35 bonus points
- Target calculation: 3 of each number = 63 points exactly
- Bonus is calculated automatically when upper section is complete

### Lower Section (Fixed Point Combinations)

Each category scores fixed points when the combination is achieved:

| Category | Description | Points | Requirement |
|----------|-------------|--------|-------------|
| **Three of a Kind** | At least 3 of same number | Sum of all dice | ≥3 matching dice |
| **Four of a Kind** | At least 4 of same number | Sum of all dice | ≥4 matching dice |
| **Full House** | 3 of one + 2 of another | 25 points | Exactly 3+2 pattern |
| **Small Straight** | 4 consecutive numbers | 30 points | 4 in sequence |
| **Large Straight** | 5 consecutive numbers | 40 points | 5 in sequence |
| **Yahtzee** | All 5 dice same number | 50 points | All 5 matching |
| **Chance** | Any combination | Sum of all dice | No requirement |

### Scoring Logic Implementation

```typescript
interface ScoreCard {
  // Upper section
  ones: number | null;
  twos: number | null;
  threes: number | null;
  fours: number | null;
  fives: number | null;
  sixes: number | null;
  
  // Lower section
  threeOfAKind: number | null;
  fourOfAKind: number | null;
  fullHouse: number | null;
  smallStraight: number | null;
  largeStraight: number | null;
  yahtzee: number | null;
  chance: number | null;
  
  // Calculated totals
  upperSectionTotal: number;
  upperSectionBonus: number;
  lowerSectionTotal: number;
  grandTotal: number;
  
  // Special tracking
  yahtzeeCount: number;        // For bonus Yahtzees
  yahtzeeBonusTotal: number;   // Additional Yahtzee bonuses
}

type ScoreCategory = keyof Omit<ScoreCard, 'upperSectionTotal' | 'upperSectionBonus' | 'lowerSectionTotal' | 'grandTotal' | 'yahtzeeCount' | 'yahtzeeBonusTotal'>;

interface ScoreCalculation {
  category: ScoreCategory;
  points: number;
  isValid: boolean;
  description: string;
}
```

## Score Calculation Functions

### Upper Section Scoring

```typescript
function calculateUpperSection(dice: number[], number: number): number {
  return dice.filter(die => die === number).length * number;
}

function calculateUpperSectionScores(dice: number[]): Record<string, number> {
  return {
    ones: calculateUpperSection(dice, 1),
    twos: calculateUpperSection(dice, 2),
    threes: calculateUpperSection(dice, 3),
    fours: calculateUpperSection(dice, 4),
    fives: calculateUpperSection(dice, 5),
    sixes: calculateUpperSection(dice, 6)
  };
}
```

### Lower Section Scoring

```typescript
function analyzeHand(dice: number[]): HandAnalysis {
  const counts = dice.reduce((acc, die) => {
    acc[die] = (acc[die] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const countValues = Object.values(counts).sort((a, b) => b - a);
  const uniqueValues = Object.keys(counts).map(Number).sort((a, b) => a - b);
  
  return {
    counts,
    countValues,
    uniqueValues,
    sum: dice.reduce((a, b) => a + b, 0),
    maxCount: Math.max(...countValues),
    isYahtzee: countValues[0] === 5,
    isFullHouse: countValues[0] === 3 && countValues[1] === 2,
    isFourOfAKind: countValues[0] >= 4,
    isThreeOfAKind: countValues[0] >= 3
  };
}

function checkStraight(dice: number[], length: number): boolean {
  const unique = [...new Set(dice)].sort((a, b) => a - b);
  
  // Check for consecutive sequence of required length
  for (let i = 0; i <= unique.length - length; i++) {
    let consecutive = 1;
    for (let j = i + 1; j < unique.length; j++) {
      if (unique[j] === unique[j - 1] + 1) {
        consecutive++;
        if (consecutive >= length) {
          return true;
        }
      } else {
        break;
      }
    }
  }
  return false;
}

function calculateLowerSectionScores(dice: number[]): Record<string, number> {
  const analysis = analyzeHand(dice);
  
  return {
    threeOfAKind: analysis.isThreeOfAKind ? analysis.sum : 0,
    fourOfAKind: analysis.isFourOfAKind ? analysis.sum : 0,
    fullHouse: analysis.isFullHouse ? 25 : 0,
    smallStraight: checkStraight(dice, 4) ? 30 : 0,
    largeStraight: checkStraight(dice, 5) ? 40 : 0,
    yahtzee: analysis.isYahtzee ? 50 : 0,
    chance: analysis.sum
  };
}
```

## Special Yahtzee Rules

### Multiple Yahtzees

**First Yahtzee:**
- Must be scored in the Yahtzee category for 50 points
- If Yahtzee category already has a zero, subsequent Yahtzees score 0

**Subsequent Yahtzees (Bonuses):**
- Each additional Yahtzee: +100 bonus points
- Player can choose where to score the dice:
  1. **Upper section**: If corresponding number is available
  2. **Lower section**: Any available category (Joker rules apply)

### Joker Rules

When a Yahtzee is rolled and the Yahtzee category is already filled:

**Preferred Scoring:**
1. **Corresponding upper section** (if available)
2. **Any lower section** (if available)

**Joker Scoring Rules:**
- **Three/Four of a Kind**: Score sum of all dice
- **Full House**: Score 25 points (even though it's not a true full house)
- **Small/Large Straight**: Score 30/40 points (even though it's not a true straight)
- **Chance**: Score sum of all dice

```typescript
function handleYahtzeeBonus(
  dice: number[], 
  scoreCard: ScoreCard,
  category: ScoreCategory
): ScoreCalculation {
  const yahtzeeNumber = dice[0]; // All dice are the same
  const hasYahtzee = scoreCard.yahtzee !== null && scoreCard.yahtzee > 0;
  
  if (!hasYahtzee) {
    // First Yahtzee must go in Yahtzee category
    return calculateScore(dice, category);
  }
  
  // This is a bonus Yahtzee
  const bonusPoints = 100;
  let categoryScore = 0;
  
  // Determine score for chosen category using Joker rules
  if (category === `${numberNames[yahtzeeNumber]}s` as ScoreCategory) {
    // Corresponding upper section
    categoryScore = yahtzeeNumber * 5;
  } else if (['threeOfAKind', 'fourOfAKind', 'chance'].includes(category)) {
    // Score sum of dice
    categoryScore = dice.reduce((a, b) => a + b, 0);
  } else if (category === 'fullHouse') {
    categoryScore = 25;
  } else if (category === 'smallStraight') {
    categoryScore = 30;
  } else if (category === 'largeStraight') {
    categoryScore = 40;
  }
  
  return {
    category,
    points: categoryScore,
    isValid: scoreCard[category] === null,
    description: `Yahtzee Bonus! +${bonusPoints} bonus + ${categoryScore} for ${category}`,
    bonusPoints
  };
}
```

## Scorecard Validation

### Category Availability

```typescript
function getAvailableCategories(scoreCard: ScoreCard): ScoreCategory[] {
  const allCategories: ScoreCategory[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];
  
  return allCategories.filter(category => scoreCard[category] === null);
}

function validateScoreSelection(
  dice: number[],
  category: ScoreCategory,
  scoreCard: ScoreCard
): ValidationResult {
  // Check if category is available
  if (scoreCard[category] !== null) {
    return {
      isValid: false,
      error: 'Category already scored'
    };
  }
  
  // Check for forced zero situations
  const scores = {
    ...calculateUpperSectionScores(dice),
    ...calculateLowerSectionScores(dice)
  };
  
  const potentialScore = scores[category];
  
  return {
    isValid: true,
    score: potentialScore,
    isZero: potentialScore === 0,
    warning: potentialScore === 0 ? 'This will score 0 points' : undefined
  };
}
```

### Forced Zero Rule

Players must score in a category even if it results in zero points:

```typescript
function mustScoreZero(scoreCard: ScoreCard): boolean {
  const availableCategories = getAvailableCategories(scoreCard);
  return availableCategories.length > 0; // Player must choose something
}

function handleForcedZero(
  category: ScoreCategory,
  scoreCard: ScoreCard
): ScoreCalculation {
  return {
    category,
    points: 0,
    isValid: scoreCard[category] === null,
    description: `Forced zero in ${category}`,
    isForced: true
  };
}
```

## Scorecard Totals Calculation

```typescript
function calculateTotals(scoreCard: ScoreCard): ScoreCard {
  // Upper section total
  const upperSectionCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'] as const;
  const upperSectionTotal = upperSectionCategories.reduce((total, category) => {
    return total + (scoreCard[category] || 0);
  }, 0);
  
  // Upper section bonus
  const upperSectionBonus = upperSectionTotal >= 63 ? 35 : 0;
  
  // Lower section total
  const lowerSectionCategories = [
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ] as const;
  const lowerSectionTotal = lowerSectionCategories.reduce((total, category) => {
    return total + (scoreCard[category] || 0);
  }, 0);
  
  // Grand total
  const grandTotal = upperSectionTotal + upperSectionBonus + lowerSectionTotal + scoreCard.yahtzeeBonusTotal;
  
  return {
    ...scoreCard,
    upperSectionTotal,
    upperSectionBonus,
    lowerSectionTotal,
    grandTotal
  };
}
```

## Digital Scorecard Interface

### Scorecard Component Structure

```tsx
interface ScorecardProps {
  scoreCard: ScoreCard;
  currentDice: number[];
  onScoreSelect: (category: ScoreCategory) => void;
  gamePhase: 'rolling' | 'scoring' | 'complete';
}

export const Scorecard: React.FC<ScorecardProps> = ({
  scoreCard,
  currentDice,
  onScoreSelect,
  gamePhase
}) => {
  const availableCategories = getAvailableCategories(scoreCard);
  const potentialScores = gamePhase === 'scoring' ? {
    ...calculateUpperSectionScores(currentDice),
    ...calculateLowerSectionScores(currentDice)
  } : {};
  
  return (
    <div className="scorecard">
      <UpperSection
        scoreCard={scoreCard}
        potentialScores={potentialScores}
        onScoreSelect={onScoreSelect}
        disabled={gamePhase !== 'scoring'}
      />
      
      <SectionTotals
        upperTotal={scoreCard.upperSectionTotal}
        upperBonus={scoreCard.upperSectionBonus}
        targetProgress={(scoreCard.upperSectionTotal / 63) * 100}
      />
      
      <LowerSection
        scoreCard={scoreCard}
        potentialScores={potentialScores}
        onScoreSelect={onScoreSelect}
        disabled={gamePhase !== 'scoring'}
      />
      
      <GrandTotal
        total={scoreCard.grandTotal}
        yahtzeeBonuses={scoreCard.yahtzeeBonusTotal}
      />
    </div>
  );
};
```

### Category Row Component

```tsx
interface CategoryRowProps {
  category: ScoreCategory;
  label: string;
  currentScore: number | null;
  potentialScore?: number;
  onSelect: () => void;
  disabled: boolean;
  isHighlighted?: boolean;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  label,
  currentScore,
  potentialScore,
  onSelect,
  disabled,
  isHighlighted
}) => {
  const isScored = currentScore !== null;
  const showPotential = !isScored && potentialScore !== undefined && !disabled;
  
  return (
    <button
      className={`
        category-row 
        ${isScored ? 'category-row--scored' : ''} 
        ${isHighlighted ? 'category-row--highlighted' : ''}
        ${showPotential && potentialScore > 0 ? 'category-row--available' : ''}
      `}
      onClick={onSelect}
      disabled={disabled || isScored}
      aria-label={`${label}: ${isScored ? `${currentScore} points` : `potential ${potentialScore} points`}`}
    >
      <span className="category-label">{label}</span>
      <span className="category-score">
        {isScored ? (
          <span className="score-final">{currentScore}</span>
        ) : showPotential ? (
          <span className={`score-potential ${potentialScore === 0 ? 'score-zero' : ''}`}>
            {potentialScore}
          </span>
        ) : (
          <span className="score-empty">—</span>
        )}
      </span>
    </button>
  );
};
```

## Mobile Scorecard Considerations

### Responsive Layout

```css
.scorecard {
  max-width: 400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #eee;
  background: white;
  width: 100%;
  text-align: left;
  min-height: 48px; /* Touch target size */
}

.category-row:active {
  background: #f0f0f0;
}

.category-row--available {
  background: rgba(76, 175, 80, 0.1);
  border-left: 4px solid #4CAF50;
}

.category-row--highlighted {
  background: rgba(33, 150, 243, 0.1);
  border-left: 4px solid #2196F3;
}

.score-potential {
  color: #4CAF50;
  font-weight: 600;
}

.score-zero {
  color: #f44336;
}
```

### Touch Interactions

- **Tap to Score**: Large touch targets (48px minimum)
- **Visual Feedback**: Highlight available categories
- **Confirmation**: Confirm zero scores with modal
- **Haptic Feedback**: On selection and score confirmation

### Progress Indicators

```tsx
export const UpperSectionProgress: React.FC<{
  current: number;
  target: number;
}> = ({ current, target }) => {
  const progress = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  
  return (
    <div className="upper-section-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-text">
        {current}/{target} points
        {remaining > 0 && (
          <span className="progress-remaining">
            ({remaining} needed for bonus)
          </span>
        )}
      </div>
    </div>
  );
};
```

## Game Completion Logic

### End Game Detection

```typescript
function isGameComplete(scoreCard: ScoreCard): boolean {
  const allCategories: ScoreCategory[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];
  
  return allCategories.every(category => scoreCard[category] !== null);
}

function calculateFinalScore(scoreCard: ScoreCard): FinalScore {
  const finalCard = calculateTotals(scoreCard);
  
  return {
    upperSectionTotal: finalCard.upperSectionTotal,
    upperSectionBonus: finalCard.upperSectionBonus,
    lowerSectionTotal: finalCard.lowerSectionTotal,
    yahtzeeBonusTotal: finalCard.yahtzeeBonusTotal,
    grandTotal: finalCard.grandTotal,
    yahtzeeCount: finalCard.yahtzeeCount,
    perfectGame: finalCard.grandTotal === 375, // Theoretical maximum
    ranking: calculateRanking(finalCard.grandTotal)
  };
}
```

### Score Rankings

```typescript
function calculateRanking(score: number): ScoreRanking {
  if (score >= 350) return { level: 'Legendary', description: 'Yahtzee Master!' };
  if (score >= 300) return { level: 'Excellent', description: 'Outstanding play!' };
  if (score >= 250) return { level: 'Very Good', description: 'Great game!' };
  if (score >= 200) return { level: 'Good', description: 'Well played!' };
  if (score >= 150) return { level: 'Average', description: 'Nice try!' };
  return { level: 'Beginner', description: 'Keep practicing!' };
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('Scoring System', () => {
  test('calculates upper section correctly', () => {
    expect(calculateUpperSection([1, 1, 2, 3, 4], 1)).toBe(2);
    expect(calculateUpperSection([3, 3, 3, 3, 3], 3)).toBe(15);
  });
  
  test('detects combinations correctly', () => {
    expect(analyzeHand([1, 1, 1, 2, 3]).isThreeOfAKind).toBe(true);
    expect(analyzeHand([2, 2, 2, 2, 3]).isFourOfAKind).toBe(true);
    expect(analyzeHand([1, 1, 1, 2, 2]).isFullHouse).toBe(true);
    expect(analyzeHand([1, 2, 3, 4, 5]).isLargeStraight).toBe(true);
  });
  
  test('handles Yahtzee bonuses', () => {
    const scoreCard = { yahtzee: 50, ones: null } as ScoreCard;
    const result = handleYahtzeeBonus([1, 1, 1, 1, 1], scoreCard, 'ones');
    expect(result.bonusPoints).toBe(100);
    expect(result.points).toBe(5);
  });
});
```

### Integration Tests

- Complete game scoring flow
- Multi-player score tracking
- Edge cases and special rules
- Scorecard state persistence

This comprehensive scoring system ensures accurate, official Yahtzee gameplay with an intuitive mobile interface. 