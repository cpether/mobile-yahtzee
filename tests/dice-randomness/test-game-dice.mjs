/**
 * Test Game Dice Randomness
 * 
 * This script tests the randomness of the actual game dice implementation
 * from diceUtils.ts by creating a Node.js compatible version.
 */
import crypto from 'crypto';
import { testDiceDistribution, runMultipleTests, parseCommandLineArgs } from './utils.mjs';

/**
 * Game dice implementation (Node.js compatible version)
 * Based on the implementation in src/utils/diceUtils.ts
 */
function gameRollDie() {
  try {
    // Primary method: Use crypto API (similar to window.crypto in browser)
    const array = new Uint32Array(1);
    crypto.randomFillSync(array);
    return (array[0] % 6) + 1;
  } catch (e) {
    // Fallback method: Use Math.random
    return Math.floor(Math.random() * 6) + 1;
  }
}

/**
 * Main function to run the test
 */
function main() {
  // Parse command line arguments
  const { sampleSize, runCount } = parseCommandLineArgs();
  
  console.log('=== GAME DICE RANDOMNESS TEST ===');
  console.log(`Testing with ${sampleSize} dice rolls per test and ${runCount} test runs`);
  
  // Run single detailed test
  const singleResult = testDiceDistribution(gameRollDie, sampleSize, 'Game Dice');
  
  // Run multiple tests for statistical significance
  const multipleResult = runMultipleTests(gameRollDie, sampleSize, runCount, 'Game Dice');
  
  // Print conclusion
  console.log('\n=== CONCLUSION ===');
  if (multipleResult.overallRandom) {
    console.log('✅ The game dice implementation passes randomness tests');
    console.log('The current implementation is suitable for game purposes.');
  } else {
    console.log('⚠️ The game dice implementation may not be sufficiently random');
    console.log('Consider reviewing the implementation for potential improvements.');
  }
}

// Run the main function
main(); 