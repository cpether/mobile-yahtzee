/**
 * Dice Randomness Test Script
 * 
 * This script tests the randomness of the game's dice implementation
 * using statistical methods like the chi-square test.
 */
import { rollDie } from '../utils/diceUtils.js';
import { 
  testDiceDistribution, 
  runMultipleTests, 
  generateTestReport 
} from '../utils/diceTestingUtils.js';

/**
 * Main function to run the test
 */
function main() {
  // Configuration
  const sampleSize = 10000;
  const runCount = 20;
  
  console.log('=== DICE RANDOMNESS TEST ===');
  console.log(`Testing game dice implementation with ${sampleSize} rolls`);
  
  // Run single detailed test
  const singleResult = testDiceDistribution(rollDie, sampleSize);
  console.log(generateTestReport(singleResult));
  
  // Run multiple tests for statistical significance
  console.log('\nRunning multiple tests for statistical significance...');
  const multipleResults = runMultipleTests(rollDie, sampleSize, runCount);
  
  // Print conclusion
  console.log('\n=== CONCLUSION ===');
  if (multipleResults.overallRandom) {
    console.log('✅ The game dice implementation passes randomness tests');
    console.log(`Pass rate: ${multipleResults.passRate.toFixed(2)}% of tests passed`);
    console.log(`Average chi-square: ${multipleResults.avgChiSquare.toFixed(4)}`);
    console.log('\nThe current implementation is suitable for game purposes.');
  } else {
    console.log('⚠️ The game dice implementation may not be sufficiently random');
    console.log(`Pass rate: ${multipleResults.passRate.toFixed(2)}% of tests passed`);
    console.log(`Average chi-square: ${multipleResults.avgChiSquare.toFixed(4)}`);
    console.log('\nConsider reviewing the implementation for potential improvements.');
  }
}

// Run the main function
main(); 