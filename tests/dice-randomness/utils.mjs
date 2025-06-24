/**
 * Dice Randomness Testing Utilities
 * 
 * This module provides core functions for testing the randomness of dice rolls
 * using statistical methods like the chi-square test.
 */

/**
 * Run a randomness test on a dice roll function
 * @param {Function} rollFunction - Function that returns a dice roll (1-6)
 * @param {number} sampleSize - Number of dice rolls to test
 * @param {string} implementationName - Name of the implementation being tested
 * @returns {Object} Test results with statistics
 */
export function testDiceDistribution(rollFunction, sampleSize = 10000, implementationName = 'Implementation') {
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
  
  // Critical value for 5 degrees of freedom at 95% confidence level is 11.07
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
    pValue,
    isProbablyRandom,
    executionTime: endTime - startTime
  };
}

/**
 * Run multiple randomness tests for statistical significance
 * @param {Function} rollFunction - Function that returns a dice roll (1-6)
 * @param {number} sampleSize - Number of dice rolls per test
 * @param {number} runCount - Number of tests to run
 * @param {string} implementationName - Name of the implementation being tested
 * @returns {Object} Aggregated test results
 */
export function runMultipleTests(rollFunction, sampleSize = 10000, runCount = 20, implementationName = 'Implementation') {
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
    executionTime: endTime - startTime,
    results
  };
}

/**
 * Compare two dice roll implementations and provide a recommendation
 * @param {Object} impl1Results - Results from first implementation
 * @param {Object} impl2Results - Results from second implementation
 * @param {string} impl1Name - Name of first implementation
 * @param {string} impl2Name - Name of second implementation
 */
export function compareImplementations(impl1Results, impl2Results, impl1Name = 'Implementation 1', impl2Name = 'Implementation 2') {
  console.log('\n\n========= IMPLEMENTATION COMPARISON =========');
  console.log(`Comparing ${impl1Name} vs ${impl2Name}\n`);
  
  const comparison = [
    {
      metric: 'Average Chi-Square',
      impl1: impl1Results.avgChiSquare.toFixed(4),
      impl2: impl2Results.avgChiSquare.toFixed(4),
      better: impl1Results.avgChiSquare < impl2Results.avgChiSquare ? 'impl1' : 'impl2',
      notes: 'Lower is better (closer to theoretical random distribution)'
    },
    {
      metric: 'Pass Rate',
      impl1: `${impl1Results.passRate.toFixed(2)}%`,
      impl2: `${impl2Results.passRate.toFixed(2)}%`,
      better: impl1Results.passRate > impl2Results.passRate ? 'impl1' : 'impl2',
      notes: 'Higher is better (more tests pass randomness check)'
    },
    {
      metric: 'Execution Time',
      impl1: `${impl1Results.executionTime.toFixed(2)}ms`,
      impl2: `${impl2Results.executionTime.toFixed(2)}ms`,
      better: impl1Results.executionTime < impl2Results.executionTime ? 'impl1' : 'impl2',
      notes: 'Lower is better (faster execution)'
    }
  ];
  
  console.log(`Metric\t\t\t${impl1Name}\t${impl2Name}\tBetter Option`);
  console.log('---------------------------------------------------------------');
  
  comparison.forEach(item => {
    const betterMarker = item.better === 'impl1' ? `✅ ${impl1Name}` : `✅ ${impl2Name}`;
    console.log(`${item.metric}\t\t${item.impl1}\t\t${item.impl2}\t\t${betterMarker}`);
  });
  
  console.log('\nRECOMMENDATION:');
  
  const randomnessScore = {
    impl1: impl1Results.passRate * 0.6 + (10 - Math.min(impl1Results.avgChiSquare, 10)) * 0.4,
    impl2: impl2Results.passRate * 0.6 + (10 - Math.min(impl2Results.avgChiSquare, 10)) * 0.4
  };
  
  if (randomnessScore.impl1 > randomnessScore.impl2) {
    console.log(`👑 The ${impl1Name} provides better randomness quality.`);
    if (impl2Results.executionTime < impl1Results.executionTime * 0.8) {
      console.log(`⚠️  However, ${impl2Name} is significantly faster.`);
      console.log(`✅ Recommendation: Use ${impl1Name} if randomness quality is critical, or ${impl2Name} if performance is more important.`);
    } else {
      console.log(`✅ Recommendation: Use ${impl1Name} as it offers better randomness with acceptable performance.`);
    }
  } else if (randomnessScore.impl2 > randomnessScore.impl1) {
    console.log(`👑 The ${impl2Name} provides better randomness quality.`);
    if (impl1Results.executionTime < impl2Results.executionTime * 0.8) {
      console.log(`⚠️  However, ${impl1Name} is significantly faster.`);
      console.log(`✅ Recommendation: Use ${impl2Name} if randomness quality is critical, or ${impl1Name} if performance is more important.`);
    } else {
      console.log(`✅ Recommendation: Use ${impl2Name} as it offers better randomness with acceptable performance.`);
    }
  } else {
    console.log('👑 Both implementations provide similar randomness quality.');
    if (impl2Results.executionTime < impl1Results.executionTime) {
      console.log(`✅ Recommendation: Consider using ${impl2Name} as it's faster with similar quality.`);
    } else if (impl1Results.executionTime < impl2Results.executionTime) {
      console.log(`✅ Recommendation: Consider using ${impl1Name} as it's faster with similar quality.`);
    } else {
      console.log('✅ Recommendation: Either implementation would work well.');
    }
  }
}

/**
 * Calculate approximate p-value from chi-square statistic
 * This is a simplified approximation for 5 degrees of freedom
 * @param {number} chiSquare - Chi-square value
 * @returns {number} Approximate p-value
 */
export function calculatePValue(chiSquare) {
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
 * Parse command line arguments for test configuration
 * @returns {Object} Configuration with sampleSize and runCount
 */
export function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  let sampleSize = 10000;
  let runCount = 20;

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

  return { sampleSize, runCount };
} 