import { rollDie } from './diceUtils';

/**
 * Dice Randomness Testing Utilities (TypeScript)
 * 
 * These utilities provide functions to test the randomness of dice rolls
 * using statistical methods like the chi-square test.
 */

/**
 * Interface for dice randomness test results
 */
export interface DiceRandomnessTestResult {
  sampleSize: number;
  counts: Record<number, number>;
  percentages: Record<number, number>;
  deviations: Record<number, number>;
  expected: number;
  chiSquareValue: number;
  pValue: number;
  isProbablyRandom: boolean;
  executionTime?: number;
}

/**
 * Interface for multiple test results
 */
export interface MultipleTestResults {
  passRate: number;
  avgChiSquare: number;
  overallRandom: boolean;
  executionTime?: number;
  results?: Array<{ chiSquare: number; passed: boolean }>;
}

/**
 * Test the randomness of dice rolls using chi-square test
 * @param rollFunction Function that returns a dice roll (1-6)
 * @param sampleSize Number of dice rolls to test
 * @returns Object containing test results
 */
export function testDiceDistribution(
  rollFunction: () => number, 
  sampleSize: number = 10000
): DiceRandomnessTestResult {
  // Count occurrences of each value
  const counts: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0
  };
  
  // Generate rolls
  const startTime = performance.now();
  for (let i = 0; i < sampleSize; i++) {
    const roll = rollFunction();
    counts[roll] = counts[roll] + 1;
  }
  const endTime = performance.now();
  
  // Calculate statistics
  const expected = sampleSize / 6;
  const percentages: Record<number, number> = {};
  const deviations: Record<number, number> = {};
  
  for (let i = 1; i <= 6; i++) {
    percentages[i] = (counts[i] / sampleSize) * 100;
    deviations[i] = ((counts[i] - expected) / expected) * 100;
  }
  
  // Calculate chi-square value
  let chiSquareValue = 0;
  for (let i = 1; i <= 6; i++) {
    const diff = counts[i] - expected;
    chiSquareValue += (diff * diff) / expected;
  }
  
  // Calculate p-value
  const pValue = calculatePValue(chiSquareValue);
  
  // Critical value for 5 degrees of freedom at 95% confidence level is 11.07
  const isProbablyRandom = chiSquareValue <= 11.07;
  
  return {
    sampleSize,
    counts,
    percentages,
    deviations,
    expected,
    chiSquareValue,
    pValue,
    isProbablyRandom,
    executionTime: endTime - startTime
  };
}

/**
 * Run multiple randomness tests for statistical significance
 * @param rollFunction Function that returns a dice roll (1-6)
 * @param sampleSize Number of dice rolls per test
 * @param runCount Number of tests to run
 * @returns Aggregated test results
 */
export function runMultipleTests(
  rollFunction: () => number, 
  sampleSize: number = 10000, 
  runCount: number = 20
): MultipleTestResults {
  const results: Array<{ chiSquare: number; passed: boolean }> = [];
  const startTime = performance.now();
  
  for (let i = 0; i < runCount; i++) {
    // Run test without logging details
    const counts: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
    };
    
    for (let j = 0; j < sampleSize; j++) {
      const roll = rollFunction();
      counts[roll]++;
    }
    
    const expected = sampleSize / 6;
    let chiSquare = 0;
    
    for (let face = 1; face <= 6; face++) {
      const diff = counts[face] - expected;
      chiSquare += (diff * diff) / expected;
    }
    
    results.push({
      chiSquare,
      passed: chiSquare <= 11.07
    });
  }
  
  const endTime = performance.now();
  
  // Analyze results
  const passedTests = results.filter(r => r.passed).length;
  const passRate = (passedTests / runCount) * 100;
  const avgChiSquare = results.reduce((sum, r) => sum + r.chiSquare, 0) / runCount;
  
  // Overall assessment 
  const overallRandom = passRate >= 95;
  
  return {
    passRate,
    avgChiSquare,
    overallRandom,
    executionTime: endTime - startTime,
    results
  };
}

/**
 * Calculate approximate p-value from chi-square statistic
 * This is a simplified approximation for 5 degrees of freedom
 * @param chiSquare Chi-square value
 * @returns Approximate p-value
 */
function calculatePValue(chiSquare: number): number {
  const thresholds = [
    { threshold: 1.15, p: 0.95 },
    { threshold: 2.67, p: 0.75 },
    { threshold: 4.35, p: 0.50 },
    { threshold: 6.06, p: 0.30 },
    { threshold: 9.24, p: 0.10 },
    { threshold: 11.07, p: 0.05 },
    { threshold: 15.09, p: 0.01 },
    { threshold: 20.52, p: 0.001 }
  ];
  
  for (const { threshold, p } of thresholds) {
    if (chiSquare <= threshold) {
      return p;
    }
  }
  
  return 0.0001; // Very small p-value for large chi-square values
}

/**
 * Creates a formatted report from test results
 */
export const generateTestReport = (result: DiceRandomnessTestResult): string => {
  const formatPercent = (num: number): string => num.toFixed(2) + '%';
  const formatNumber = (num: number): string => num.toFixed(4);
  
  let report = `
=== DICE RANDOMNESS TEST REPORT ===
Sample Size: ${result.sampleSize} rolls
Execution Time: ${result.executionTime?.toFixed(2) || 'N/A'}ms

Distribution:
`;

  for (let i = 1; i <= 6; i++) {
    report += `Die face ${i}: ${result.counts[i]} rolls (${formatPercent(result.percentages[i])}) | `;
    report += `Deviation: ${formatPercent(result.deviations[i])}\n`;
  }
  
  report += `
Statistical Analysis:
- Expected count per face: ${result.expected}
- Chi-square value: ${formatNumber(result.chiSquareValue)}
- P-value: ${formatNumber(result.pValue)}

Randomness Assessment:
The distribution is ${result.isProbablyRandom ? 'LIKELY RANDOM' : 'POTENTIALLY BIASED'} 
(chi-square test with 95% confidence level)

Note: For a fair six-sided die, chi-square should be less than 11.07 
for the distribution to be considered random with 95% confidence.
`;

  return report;
};

/**
 * Interface for dice distribution test results
 */
export interface DiceDistributionTestResult {
  sampleSize: number;
  counts: Record<number, number>;
  percentages: Record<number, number>;
  deviations: Record<number, number>;
  expected: number;
  chiSquareValue: number;
  stdDev: number;
  executionTime: number;
  isProbablyRandom: boolean;
  pValue: number;
}

/**
 * Interface for multiple test run results
 */
export interface MultipleTestResult {
  runCount: number;
  sampleSizePerRun: number;
  passedTests: number;
  failedTests: number;
  avgChiSquare: number;
  allResults: DiceDistributionTestResult[];
  isOverallRandom: boolean;
} 