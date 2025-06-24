# Dice Randomness Testing

This directory contains tools and scripts for testing the randomness of dice roll implementations used in the game.

## Overview

The tests use statistical methods like the chi-square test to evaluate whether dice rolls are sufficiently random for game purposes. The primary goal is to ensure that dice rolls are fair and unbiased.

## Available Scripts

### 1. Compare Implementations

Compares different dice roll implementations (Crypto API vs Math.random):

```bash
npm run test:dice:compare
```

Options:
- `--sample=<number>`: Set the sample size per test (default: 10000)
- `--runs=<number>`: Set the number of test runs (default: 20)

Example:
```bash
npm run test:dice:compare -- --sample=50000 --runs=50
```

### 2. Test Game Dice

Tests the actual game dice implementation:

```bash
npm run test:dice:game
```

Options:
- Same as compare script

### 3. TypeScript Test

Tests dice randomness from the TypeScript codebase:

```bash
npm run test:dice
```

## Files Structure

- `utils.mjs` - Core testing utilities (JavaScript)
- `compare-implementations.mjs` - Script to compare different dice implementations
- `test-game-dice.mjs` - Script to test the game's dice implementation
- `README.md` - This documentation file

## Related Files in Source Code

- `src/utils/diceTestingUtils.ts` - TypeScript version of testing utilities
- `src/scripts/testDiceRandomness.ts` - TypeScript test script
- `src/utils/diceUtils.ts` - Contains the game's dice implementation

## Understanding the Results

### Chi-Square Test

The chi-square test measures how well the observed distribution of dice rolls matches the expected distribution. For a fair six-sided die, each face should appear with equal probability (1/6).

- **Chi-square value**: Lower is better (closer to theoretical distribution)
- **P-value**: Higher is better (probability that the distribution is random)
- **Critical value**: For 5 degrees of freedom at 95% confidence level, chi-square should be ≤ 11.07

### Pass Rate

The percentage of tests that pass the chi-square test. A high pass rate (≥95%) indicates that the dice implementation is likely random.

### Performance

The tests also measure execution time, which can be important for game performance, especially when rolling multiple dice frequently.

## Conclusion from Tests

Based on the test results, both the Crypto API and Math.random implementations provide sufficient randomness for game purposes. The Crypto API is theoretically more secure, while Math.random is significantly faster.

The current game implementation uses Crypto API as the primary method with Math.random as a fallback, which provides a good balance between randomness quality and performance. 