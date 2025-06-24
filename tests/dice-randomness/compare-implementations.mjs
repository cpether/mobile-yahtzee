/**
 * Dice Randomness Implementation Comparison
 * 
 * This script compares different implementations of dice roll functions
 * to evaluate their randomness quality and performance.
 */
import crypto from 'crypto';
import { 
  testDiceDistribution, 
  runMultipleTests, 
  compareImplementations, 
  parseCommandLineArgs 
} from './utils.mjs';

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
 * Main function to run the comparison
 */
function main() {
  // Parse command line arguments
  const { sampleSize, runCount } = parseCommandLineArgs();
  
  // Print information about test
  console.log('=== DICE RANDOMNESS IMPLEMENTATION COMPARISON ===');
  console.log(`Testing with ${sampleSize} dice rolls per test and ${runCount} test runs`);
  
  // Run single test for each implementation
  const cryptoSingleResult = testDiceDistribution(cryptoRollDie, sampleSize, 'crypto API');
  const mathRandomSingleResult = testDiceDistribution(mathRandomRollDie, sampleSize, 'Math.random');
  
  // Run multiple tests for each implementation
  const cryptoMultipleResult = runMultipleTests(cryptoRollDie, sampleSize, runCount, 'crypto API');
  const mathRandomMultipleResult = runMultipleTests(mathRandomRollDie, sampleSize, runCount, 'Math.random');
  
  // Compare implementations
  compareImplementations(
    cryptoMultipleResult, 
    mathRandomMultipleResult, 
    'crypto API', 
    'Math.random'
  );
}

// Run the main function
main(); 