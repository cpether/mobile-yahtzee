// Script to compare different dice randomness implementations
import crypto from 'crypto';

/**
 * Implementation 1: Using crypto API
 * This mimics our current implementation in diceUtils.ts
 */
function cryptoRollDie() {
  const array = new Uint32Array(1);
  crypto.randomFillSync(array);
  return (array[0] % 6) + 1;
}

/**
 * Implementation 2: Using Math.random
 * This is our fallback implementation
 */
function mathRandomRollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Run a randomness test with specified sample size
 */
function runRandomnessTest(rollFunction, sampleSize, implementationName) {
  console.log(`\nRunning randomness test for ${implementationName} with ${sampleSize} dice rolls...`);
  
  // Initialize counters
  const counts = {
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
    counts[roll]++;
  }
  const endTime = performance.now();
  
  // Calculate statistics
  const expected = sampleSize / 6;
  const percentages = {};
  const deviations = {};
  
  Object.keys(counts).forEach(key => {
    const numKey = parseInt(key);
    percentages[numKey] = (counts[numKey] / sampleSize) * 100;
    deviations[numKey] = ((counts[numKey] - expected) / expected) * 100;
  });
  
  // Calculate chi-square value
  let chiSquareValue = 0;
  for (let i = 1; i <= 6; i++) {
    const diff = counts[i] - expected;
    chiSquareValue += (diff * diff) / expected;
  }
  
  // Calculate p-value
  const pValue = calculatePValue(chiSquareValue);
  
  // Determine if the distribution passes the chi-square test
  // For 5 degrees of freedom (6 categories - 1), chi-square value 
  // should be < 11.07 with 95% confidence
  const isProbablyRandom = chiSquareValue <= 11.07;
  
  // Print results
  console.log(`\n=== ${implementationName.toUpperCase()} TEST RESULTS ===`);
  console.log(`Sample Size: ${sampleSize} rolls`);
  console.log(`Execution Time: ${(endTime - startTime).toFixed(2)}ms`);
  
  console.log('\nDistribution:');
  console.log('Face\tCount\tPercentage\tDeviation');
  for (let i = 1; i <= 6; i++) {
    console.log(`${i}\t${counts[i]}\t${percentages[i].toFixed(2)}%\t${deviations[i].toFixed(2)}%`);
  }
  
  console.log('\nStatistical Analysis:');
  console.log(`Expected count per face: ${expected}`);
  console.log(`Chi-square value: ${chiSquareValue.toFixed(4)}`);
  console.log(`P-value: ${pValue.toFixed(4)}`);
  
  console.log(`\nRandomness Assessment: ${isProbablyRandom ? 'LIKELY RANDOM ✅' : 'POTENTIALLY BIASED ❌'}`);
  console.log('(chi-square test with 95% confidence level)');
  
  return {
    sampleSize,
    counts,
    percentages, 
    deviations,
    chiSquareValue,
    isProbablyRandom,
    executionTime: endTime - startTime
  };
}

/**
 * Run multiple tests to get more reliable results
 */
function runMultipleTests(rollFunction, sampleSize, runCount, implementationName) {
  console.log(`\nRunning ${runCount} randomness tests for ${implementationName} with ${sampleSize} rolls each...`);
  
  const results = [];
  const startTime = performance.now();
  
  for (let i = 0; i < runCount; i++) {
    process.stdout.write(`\rCompleted test ${i+1}/${runCount}...`);
    
    // Run test without logging details
    const counts = {
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
  const failedTests = runCount - passedTests;
  const passRate = (passedTests / runCount) * 100;
  const avgChiSquare = results.reduce((sum, r) => sum + r.chiSquare, 0) / runCount;
  
  console.log(`\n\n=== ${implementationName.toUpperCase()} MULTIPLE TESTS SUMMARY ===`);
  console.log(`Total runs: ${runCount}`);
  console.log(`Sample size per run: ${sampleSize}`);
  console.log(`Tests passed: ${passedTests} (${passRate.toFixed(2)}%)`);
  console.log(`Tests failed: ${failedTests} (${(100 - passRate).toFixed(2)}%)`);
  console.log(`Average chi-square: ${avgChiSquare.toFixed(4)}`);
  console.log(`Execution time: ${(endTime - startTime).toFixed(2)}ms`);
  
  // Overall assessment 
  const overallRandom = passRate >= 95;
  console.log(`\nOverall Assessment: ${overallRandom ? 'LIKELY RANDOM ✅' : 'POTENTIALLY BIASED ❌'}`);
  
  return {
    passRate,
    avgChiSquare,
    overallRandom,
    executionTime: endTime - startTime
  };
}

/**
 * Calculate approximate p-value from chi-square statistic
 * This is a simplified approximation for 5 degrees of freedom
 */
function calculatePValue(chiSquare) {
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
  
  return 0.0001;
}

/**
 * Compare two implementations and provide a recommendation
 */
function compareImplementations(impl1Results, impl2Results) {
  console.log('\n\n========= IMPLEMENTATION COMPARISON =========');
  console.log('Comparing crypto API vs Math.random implementations\n');
  
  const comparison = [
    {
      metric: 'Average Chi-Square',
      crypto: impl1Results.avgChiSquare.toFixed(4),
      mathRandom: impl2Results.avgChiSquare.toFixed(4),
      better: impl1Results.avgChiSquare < impl2Results.avgChiSquare ? 'crypto' : 'mathRandom',
      notes: 'Lower is better (closer to theoretical random distribution)'
    },
    {
      metric: 'Pass Rate',
      crypto: `${impl1Results.passRate.toFixed(2)}%`,
      mathRandom: `${impl2Results.passRate.toFixed(2)}%`,
      better: impl1Results.passRate > impl2Results.passRate ? 'crypto' : 'mathRandom',
      notes: 'Higher is better (more tests pass randomness check)'
    },
    {
      metric: 'Execution Time',
      crypto: `${impl1Results.executionTime.toFixed(2)}ms`,
      mathRandom: `${impl2Results.executionTime.toFixed(2)}ms`,
      better: impl1Results.executionTime < impl2Results.executionTime ? 'crypto' : 'mathRandom',
      notes: 'Lower is better (faster execution)'
    }
  ];
  
  console.log('Metric\t\t\tCrypto API\tMath.random\tBetter Option');
  console.log('---------------------------------------------------------------');
  
  comparison.forEach(item => {
    const betterMarker = item.better === 'crypto' ? '✅ crypto' : '✅ Math.random';
    console.log(`${item.metric}\t\t${item.crypto}\t\t${item.mathRandom}\t\t${betterMarker}`);
  });
  
  console.log('\nRECOMMENDATION:');
  
  const randomnessScore = {
    crypto: impl1Results.passRate * 0.6 + (10 - Math.min(impl1Results.avgChiSquare, 10)) * 0.4,
    mathRandom: impl2Results.passRate * 0.6 + (10 - Math.min(impl2Results.avgChiSquare, 10)) * 0.4
  };
  
  if (randomnessScore.crypto > randomnessScore.mathRandom) {
    console.log('👑 The crypto API implementation provides better randomness quality.');
    if (impl2Results.executionTime < impl1Results.executionTime * 0.8) {
      console.log('⚠️  However, Math.random is significantly faster.');
      console.log('✅ Recommendation: Keep using crypto API as primary with Math.random as fallback.');
    } else {
      console.log('✅ Recommendation: Continue using the crypto API as it offers better randomness with acceptable performance.');
    }
  } else if (randomnessScore.mathRandom > randomnessScore.crypto) {
    console.log('👑 The Math.random implementation provides better randomness quality.');
    console.log('⚠️  This is unexpected as crypto API should theoretically be more random.');
    console.log('✅ Recommendation: Run more extensive tests or consider using Math.random.');
  } else {
    console.log('👑 Both implementations provide similar randomness quality.');
    if (impl2Results.executionTime < impl1Results.executionTime) {
      console.log('✅ Recommendation: Consider using Math.random as it\'s faster with similar quality.');
    } else {
      console.log('✅ Recommendation: Keep using crypto API as it\'s theoretically more secure.');
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let sampleSize = 10000;
let runCount = 30;

args.forEach(arg => {
  if (arg.startsWith('--sample=')) {
    const size = parseInt(arg.split('=')[1], 10);
    if (!isNaN(size) && size > 0) {
      sampleSize = size;
    }
  } else if (arg.startsWith('--runs=')) {
    const count = parseInt(arg.split('=')[1], 10);
    if (!isNaN(count) && count > 0) {
      runCount = count;
    }
  }
});

// Print information about test
console.log('=== DICE RANDOMNESS IMPLEMENTATION COMPARISON ===');
console.log(`Testing with ${sampleSize} dice rolls per test and ${runCount} test runs`);

// Run single test for each implementation
const cryptoSingleResult = runRandomnessTest(cryptoRollDie, sampleSize, 'crypto API');
const mathRandomSingleResult = runRandomnessTest(mathRandomRollDie, sampleSize, 'Math.random');

// Run multiple tests for each implementation
const cryptoMultipleResult = runMultipleTests(cryptoRollDie, sampleSize, runCount, 'crypto API');
const mathRandomMultipleResult = runMultipleTests(mathRandomRollDie, sampleSize, runCount, 'Math.random');

// Compare implementations
compareImplementations(cryptoMultipleResult, mathRandomMultipleResult); 