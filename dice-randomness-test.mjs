// Test script for dice randomness in ES module format
import crypto from 'crypto';

/**
 * Dice roll function using crypto API (similar to our game implementation)
 */
function cryptoRollDie() {
  const array = new Uint32Array(1);
  crypto.randomFillSync(array);
  return (array[0] % 6) + 1;
}

/**
 * Math.random implementation (our fallback in the game)
 */
function mathRandomRollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Run randomness test on a dice roll function
 */
function testDiceRandomness(rollFunction, sampleSize = 10000) {
  console.log(`Running test with sample size: ${sampleSize}`);
  
  // Count occurrences of each value
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
  
  // Critical value for 5 degrees of freedom at 95% confidence level is 11.07
  const isProbablyRandom = chiSquareValue <= 11.07;
  
  // Print results
  console.log('\n=== DICE RANDOMNESS TEST RESULTS ===');
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
 * Run multiple tests
 */
function runMultipleTests(rollFunction, sampleSize = 10000, runCount = 20) {
  console.log(`\nRunning ${runCount} randomness tests with ${sampleSize} rolls each...`);
  
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
  
  console.log('\n\n=== MULTIPLE TESTS SUMMARY ===');
  console.log(`Total runs: ${runCount}`);
  console.log(`Sample size per run: ${sampleSize}`);
  console.log(`Tests passed: ${passedTests} (${passRate.toFixed(2)}%)`);
  console.log(`Tests failed: ${failedTests} (${(100 - passRate).toFixed(2)}%)`);
  console.log(`Average chi-square: ${avgChiSquare.toFixed(4)}`);
  console.log(`Execution time: ${(endTime - startTime).toFixed(2)}ms`);
  
  // Overall assessment 
  const overallRandom = passRate >= 95;
  console.log(`\nOverall Assessment: ${overallRandom ? 'LIKELY RANDOM ✅' : 'POTENTIALLY BIASED ❌'}`);
  
  if (!overallRandom) {
    console.log('\n⚠️  The randomness quality may not be sufficient');
    console.log('Suggestion: Consider implementing a more robust random number generator');
  } else {
    console.log('\n✅ The randomness quality appears to be good');
    console.log('Current implementation is likely sufficient for game dice');
  }
  
  return {
    passRate,
    avgChiSquare,
    overallRandom,
    executionTime: endTime - startTime
  };
}

// Compare both implementations
function compareImplementations(sampleSize, runCount) {
  console.log('=== DICE RANDOMNESS IMPLEMENTATION COMPARISON ===');
  
  // Test crypto implementation
  console.log('\n[TESTING CRYPTO API IMPLEMENTATION]');
  const cryptoSingleResult = testDiceRandomness(cryptoRollDie, sampleSize);
  const cryptoMultipleResult = runMultipleTests(cryptoRollDie, sampleSize, runCount);
  
  // Test Math.random implementation
  console.log('\n[TESTING MATH.RANDOM IMPLEMENTATION]');
  const mathRandomSingleResult = testDiceRandomness(mathRandomRollDie, sampleSize);
  const mathRandomMultipleResult = runMultipleTests(mathRandomRollDie, sampleSize, runCount);
  
  // Compare results
  console.log('\n\n========= IMPLEMENTATION COMPARISON =========');
  console.log('Comparing crypto API vs Math.random implementations\n');
  
  const comparison = [
    {
      metric: 'Average Chi-Square',
      crypto: cryptoMultipleResult.avgChiSquare.toFixed(4),
      mathRandom: mathRandomMultipleResult.avgChiSquare.toFixed(4),
      better: cryptoMultipleResult.avgChiSquare < mathRandomMultipleResult.avgChiSquare ? 'crypto' : 'mathRandom',
      notes: 'Lower is better (closer to theoretical random distribution)'
    },
    {
      metric: 'Pass Rate',
      crypto: `${cryptoMultipleResult.passRate.toFixed(2)}%`,
      mathRandom: `${mathRandomMultipleResult.passRate.toFixed(2)}%`,
      better: cryptoMultipleResult.passRate > mathRandomMultipleResult.passRate ? 'crypto' : 'mathRandom',
      notes: 'Higher is better (more tests pass randomness check)'
    },
    {
      metric: 'Execution Time',
      crypto: `${cryptoMultipleResult.executionTime.toFixed(2)}ms`,
      mathRandom: `${mathRandomMultipleResult.executionTime.toFixed(2)}ms`,
      better: cryptoMultipleResult.executionTime < mathRandomMultipleResult.executionTime ? 'crypto' : 'mathRandom',
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
    crypto: cryptoMultipleResult.passRate * 0.6 + (10 - Math.min(cryptoMultipleResult.avgChiSquare, 10)) * 0.4,
    mathRandom: mathRandomMultipleResult.passRate * 0.6 + (10 - Math.min(mathRandomMultipleResult.avgChiSquare, 10)) * 0.4
  };
  
  if (randomnessScore.crypto > randomnessScore.mathRandom) {
    console.log('👑 The crypto API implementation provides better randomness quality.');
    if (mathRandomMultipleResult.executionTime < cryptoMultipleResult.executionTime * 0.8) {
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
    if (mathRandomMultipleResult.executionTime < cryptoMultipleResult.executionTime) {
      console.log('✅ Recommendation: Consider using Math.random as it\'s faster with similar quality.');
    } else {
      console.log('✅ Recommendation: Keep using crypto API as it\'s theoretically more secure.');
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let sampleSize = 10000;
let runCount = 10;

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

// Run comparison
compareImplementations(sampleSize, runCount); 