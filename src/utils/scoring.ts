import type { ScoreCategory, DiceState, Scorecard } from '../types/game';
import { UPPER_SECTION_BONUS_THRESHOLD, UPPER_SECTION_BONUS_POINTS, YAHTZEE_BONUS_POINTS } from '../constants/scoreCategories';

/**
 * Calculate the score for a given category and dice values
 */
export const calculateScore = (dice: DiceState[], category: ScoreCategory): number => {
  const values = dice.map(die => die.value);
  const counts = getDiceCounts(values);
  
  switch (category) {
    case 'ones':
    case 'twos':
    case 'threes':
    case 'fours':
    case 'fives':
    case 'sixes':
      return calculateUpperSectionScore(values, category);
    
    case 'threeOfAKind':
      return hasNOfAKind(counts, 3) ? sumAllDice(values) : 0;
    
    case 'fourOfAKind':
      return hasNOfAKind(counts, 4) ? sumAllDice(values) : 0;
    
    case 'fullHouse':
      return isFullHouse(counts) ? 25 : 0;
    
    case 'smallStraight':
      return isSmallStraight(values) ? 30 : 0;
    
    case 'largeStraight':
      return isLargeStraight(values) ? 40 : 0;
    
    case 'yahtzee':
      return hasNOfAKind(counts, 5) ? 50 : 0;
    
    case 'chance':
      return sumAllDice(values);
    
    default:
      return 0;
  }
};

/**
 * Calculate score for upper section categories (ones through sixes)
 */
const calculateUpperSectionScore = (values: number[], category: ScoreCategory): number => {
  const targetValue = getTargetValueForCategory(category);
  return values.filter(value => value === targetValue).reduce((sum, value) => sum + value, 0);
};

/**
 * Get the target dice value for upper section categories
 */
const getTargetValueForCategory = (category: ScoreCategory): number => {
  const categoryToValue: Record<string, number> = {
    'ones': 1,
    'twos': 2,
    'threes': 3,
    'fours': 4,
    'fives': 5,
    'sixes': 6
  };
  return categoryToValue[category] || 0;
};

/**
 * Get count of each die value (1-6)
 */
const getDiceCounts = (values: number[]): Record<number, number> => {
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 6; i++) {
    counts[i] = 0;
  }
  values.forEach(value => {
    if (value >= 1 && value <= 6) {
      counts[value]++;
    }
  });
  return counts;
};

/**
 * Check if there are at least N dice of the same value
 */
const hasNOfAKind = (counts: Record<number, number>, n: number): boolean => {
  return Object.values(counts).some(count => count >= n);
};

/**
 * Check if dice form a full house (3 of one kind + 2 of another)
 */
const isFullHouse = (counts: Record<number, number>): boolean => {
  const countValues = Object.values(counts).filter(count => count > 0).sort((a, b) => b - a);
  return countValues.length === 2 && countValues[0] === 3 && countValues[1] === 2;
};

/**
 * Check if dice form a small straight (4 consecutive numbers)
 */
const isSmallStraight = (values: number[]): boolean => {
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  
  // Check for consecutive sequences of 4
  for (let i = 0; i <= uniqueValues.length - 4; i++) {
    if (uniqueValues[i + 1] === uniqueValues[i] + 1 &&
        uniqueValues[i + 2] === uniqueValues[i] + 2 &&
        uniqueValues[i + 3] === uniqueValues[i] + 3) {
      return true;
    }
  }
  return false;
};

/**
 * Check if dice form a large straight (5 consecutive numbers)
 */
const isLargeStraight = (values: number[]): boolean => {
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  
  if (uniqueValues.length !== 5) return false;
  
  // Check if all values are consecutive
  for (let i = 1; i < uniqueValues.length; i++) {
    if (uniqueValues[i] !== uniqueValues[i - 1] + 1) {
      return false;
    }
  }
  return true;
};

/**
 * Sum all dice values
 */
const sumAllDice = (values: number[]): number => {
  return values.reduce((sum, value) => sum + value, 0);
};

/**
 * Calculate upper section total and bonus
 */
export const calculateUpperSectionTotal = (scorecard: Scorecard): { total: number; bonus: number } => {
  const upperCategories: ScoreCategory[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  const total = upperCategories.reduce((sum, category) => {
    const score = scorecard.scores[category];
    return sum + (score || 0);
  }, 0);
  
  const bonus = total >= UPPER_SECTION_BONUS_THRESHOLD ? UPPER_SECTION_BONUS_POINTS : 0;
  
  return { total, bonus };
};

/**
 * Calculate lower section total
 */
export const calculateLowerSectionTotal = (scorecard: Scorecard): number => {
  const lowerCategories: ScoreCategory[] = [
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 
    'largeStraight', 'yahtzee', 'chance'
  ];
  
  return lowerCategories.reduce((sum, category) => {
    const score = scorecard.scores[category];
    return sum + (score || 0);
  }, 0);
};

/**
 * Calculate Yahtzee bonus points
 */
export const calculateYahtzeeBonus = (scorecard: Scorecard): number => {
  return Math.max(0, scorecard.yahtzeeCount - 1) * YAHTZEE_BONUS_POINTS;
};

/**
 * Calculate grand total for a scorecard
 */
export const calculateGrandTotal = (scorecard: Scorecard): number => {
  const { total: upperTotal, bonus: upperBonus } = calculateUpperSectionTotal(scorecard);
  const lowerTotal = calculateLowerSectionTotal(scorecard);
  const yahtzeeBonus = calculateYahtzeeBonus(scorecard);
  
  return upperTotal + upperBonus + lowerTotal + yahtzeeBonus;
};

/**
 * Check if a category can be scored (is not already filled)
 */
export const canScoreCategory = (scorecard: Scorecard, category: ScoreCategory): boolean => {
  return scorecard.scores[category] === null;
};

/**
 * Check if Yahtzee joker rules apply
 */
export const isYahtzeeJoker = (dice: DiceState[], scorecard: Scorecard): boolean => {
  const values = dice.map(die => die.value);
  const counts = getDiceCounts(values);
  
  // Must have a Yahtzee (5 of a kind)
  if (!hasNOfAKind(counts, 5)) return false;
  
  // Must have already scored a Yahtzee
  return scorecard.scores.yahtzee !== null && scorecard.scores.yahtzee > 0;
};

/**
 * Get forced scoring options when Yahtzee joker rules apply
 */
export const getJokerScoringOptions = (dice: DiceState[], scorecard: Scorecard): ScoreCategory[] => {
  if (!isYahtzeeJoker(dice, scorecard)) return [];
  
  const diceValue = dice[0].value; // All dice have same value in Yahtzee
  const upperCategory = getUpperCategoryForValue(diceValue);
  const availableOptions: ScoreCategory[] = [];
  
  // First priority: corresponding upper section category
  if (canScoreCategory(scorecard, upperCategory)) {
    availableOptions.push(upperCategory);
  }
  
  // Second priority: any available lower section category
  const lowerCategories: ScoreCategory[] = [
    'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 
    'largeStraight', 'chance'
  ];
  
  lowerCategories.forEach(category => {
    if (canScoreCategory(scorecard, category)) {
      availableOptions.push(category);
    }
  });
  
  return availableOptions;
};

/**
 * Get upper section category for a dice value
 */
const getUpperCategoryForValue = (value: number): ScoreCategory => {
  const valueToCategory: Record<number, ScoreCategory> = {
    1: 'ones',
    2: 'twos',
    3: 'threes',
    4: 'fours',
    5: 'fives',
    6: 'sixes'
  };
  return valueToCategory[value] || 'ones';
}; 