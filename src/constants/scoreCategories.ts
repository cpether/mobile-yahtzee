import type { ScoreCategory } from '../types/game';

export interface ScoreCategoryInfo {
  key: ScoreCategory;
  name: string;
  description: string;
  section: 'upper' | 'lower';
  maxScore: number;
}

export const SCORE_CATEGORIES: Record<ScoreCategory, ScoreCategoryInfo> = {
  ones: {
    key: 'ones',
    name: 'Ones',
    description: 'Sum of all ones',
    section: 'upper',
    maxScore: 5
  },
  twos: {
    key: 'twos',
    name: 'Twos',
    description: 'Sum of all twos',
    section: 'upper',
    maxScore: 10
  },
  threes: {
    key: 'threes',
    name: 'Threes', 
    description: 'Sum of all threes',
    section: 'upper',
    maxScore: 15
  },
  fours: {
    key: 'fours',
    name: 'Fours',
    description: 'Sum of all fours',
    section: 'upper',
    maxScore: 20
  },
  fives: {
    key: 'fives',
    name: 'Fives',
    description: 'Sum of all fives',
    section: 'upper',
    maxScore: 25
  },
  sixes: {
    key: 'sixes',
    name: 'Sixes',
    description: 'Sum of all sixes',
    section: 'upper',
    maxScore: 30
  },
  threeOfAKind: {
    key: 'threeOfAKind',
    name: 'Three of a Kind',
    description: 'Sum of all dice (3+ of same number)',
    section: 'lower',
    maxScore: 30
  },
  fourOfAKind: {
    key: 'fourOfAKind',
    name: 'Four of a Kind',
    description: 'Sum of all dice (4+ of same number)',
    section: 'lower',
    maxScore: 30
  },
  fullHouse: {
    key: 'fullHouse',
    name: 'Full House',
    description: '3 of one number + 2 of another',
    section: 'lower',
    maxScore: 25
  },
  smallStraight: {
    key: 'smallStraight',
    name: 'Small Straight',
    description: '4 consecutive numbers',
    section: 'lower',
    maxScore: 30
  },
  largeStraight: {
    key: 'largeStraight',
    name: 'Large Straight',
    description: '5 consecutive numbers',
    section: 'lower',
    maxScore: 40
  },
  yahtzee: {
    key: 'yahtzee',
    name: 'Yahtzee',
    description: 'All 5 dice the same',
    section: 'lower',
    maxScore: 50
  },
  chance: {
    key: 'chance',
    name: 'Chance',
    description: 'Sum of all dice',
    section: 'lower',
    maxScore: 30
  }
};

export const UPPER_SECTION_CATEGORIES: ScoreCategory[] = [
  'ones', 'twos', 'threes', 'fours', 'fives', 'sixes'
];

export const LOWER_SECTION_CATEGORIES: ScoreCategory[] = [
  'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 
  'largeStraight', 'yahtzee', 'chance'
];

export const UPPER_SECTION_BONUS_THRESHOLD = 63;
export const UPPER_SECTION_BONUS_POINTS = 35;
export const YAHTZEE_BONUS_POINTS = 100; 