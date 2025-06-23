# Game Rules & Logic Specification

## Overview

This document defines the official Yahtzee rules and game logic that will be implemented in the mobile web application. The game follows the standard Yahtzee rules as published by Hasbro.

## Game Objective

The objective of Yahtzee is to score the most points by rolling five dice to create specific combinations over 13 rounds of play.

## Game Components

- **5 six-sided dice** (values 1-6)
- **Score card** with 13 scoring categories
- **Players**: 1-4 players (pass-and-play on single device)

## Game Flow

### Setup
1. Players enter their names (2-4 players recommended)
2. Game determines turn order (highest initial roll goes first)
3. Each player gets a scorecard with 13 empty categories

### Turn Structure
Each player's turn consists of:

1. **Roll Phase**: Up to 3 rolls per turn
   - **First Roll**: Roll all 5 dice
   - **Second Roll** (optional): Keep any dice, reroll others
   - **Third Roll** (optional): Keep any dice, reroll others
   
2. **Scoring Phase**: Choose one scoring category to fill
   - Must choose exactly one category per turn
   - Each category can only be used once per game
   - If no valid combinations exist, must take a zero in chosen category

### Game End
- Game ends when all players have filled all 13 categories
- Player with highest total score wins

## Scoring Categories

### Upper Section (Number Categories)

| Category | Requirement | Score Calculation | Example |
|----------|-------------|-------------------|---------|
| **Ones** | Any combination | Sum of all 1s | [1,1,1,3,4] = 3 points |
| **Twos** | Any combination | Sum of all 2s | [2,2,2,5,6] = 6 points |
| **Threes** | Any combination | Sum of all 3s | [3,3,3,3,4] = 12 points |
| **Fours** | Any combination | Sum of all 4s | [4,4,5,5,5] = 8 points |
| **Fives** | Any combination | Sum of all 5s | [1,1,2,2,5] = 5 points |
| **Sixes** | Any combination | Sum of all 6s | [3,3,6,6,6] = 18 points |

**Upper Section Bonus**: If total of upper section ≥ 63 points, award 35 bonus points.

### Lower Section (Combination Categories)

| Category | Requirement | Score | Example |
|----------|-------------|-------|---------|
| **Three of a Kind** | At least 3 dice the same | Sum of all dice | [2,3,4,4,4] = 17 points |
| **Four of a Kind** | At least 4 dice the same | Sum of all dice | [4,5,5,5,5] = 24 points |
| **Full House** | 3 of one number + 2 of another | 25 points | [2,2,5,5,5] = 25 points |
| **Small Straight** | 4 consecutive numbers | 30 points | [1,3,4,5,6] = 30 points |
| **Large Straight** | 5 consecutive numbers | 40 points | [1,2,3,4,5] = 40 points |
| **Yahtzee** | All 5 dice the same | 50 points | [3,3,3,3,3] = 50 points |
| **Chance** | Any combination | Sum of all dice | [5,5,5,3,2] = 20 points |

### Straight Definitions
- **Small Straight**: Any of these sequences: 1-2-3-4, 2-3-4-5, or 3-4-5-6
- **Large Straight**: Either 1-2-3-4-5 or 2-3-4-5-6

## Special Rules

### Yahtzee Bonus
- If a player scores 50 in the Yahtzee category, subsequent Yahtzees earn 100 bonus points each
- The subsequent Yahtzee must still be scored in an available category using Joker rules

### Joker Rules (for additional Yahtzees)
When rolling a Yahtzee after already scoring 50 in the Yahtzee category:

1. **First Priority**: If the corresponding upper section box is empty, must score there (e.g., five 3s must go in Threes category)

2. **Second Priority**: If upper section box is filled, can use as "joker" in lower section:
   - Full House = 25 points
   - Small Straight = 30 points  
   - Large Straight = 40 points
   - Three/Four of a Kind = sum of all dice
   - Chance = sum of all dice

3. **Last Resort**: If all lower section used, must score zero in any remaining upper section category

### Forced Zero Rule
- If a player cannot or chooses not to score in any beneficial category, they must place a zero in one category
- This category becomes unusable for the rest of the game

## Validation Rules

### Roll Validation
- Must roll at least once per turn
- Cannot roll more than 3 times per turn
- Can choose to keep any combination of dice between rolls

### Scoring Validation
- Each category can only be used once per player
- Must select exactly one category per turn
- Score must be calculated correctly based on dice combination
- Cannot change score once entered

### Combination Validation
- **Three/Four of a Kind**: Must have exactly 3 or 4+ of the same number
- **Full House**: Must have exactly 3 of one number AND 2 of another number
- **Small Straight**: Must contain 4 consecutive numbers (can have extra die)
- **Large Straight**: Must contain exactly 5 consecutive numbers
- **Yahtzee**: Must have exactly 5 of the same number

## Game State Transitions

```
Game Start → Player Setup → Turn Start → Roll Phase → Scoring Phase → Next Player → ... → Game End
```

### Turn States
1. **Roll State**: Player can roll dice (up to 3 times)
2. **Keep State**: Player selects which dice to keep
3. **Score State**: Player must select a scoring category
4. **Complete State**: Turn is finished, move to next player

## Implementation Notes

### Random Number Generation
- Use cryptographically secure random number generator for fair dice rolls
- Each die shows values 1-6 with equal probability

### Score Calculation
- All calculations must be performed server-side or with immutable logic
- Validate all scores before recording
- Prevent tampering with score values

### Turn Management
- Enforce strict turn order
- Prevent players from taking actions out of turn
- Handle edge cases (player disconnection, page refresh)

## Edge Cases

1. **Same Total Scores**: In case of tie, declare multiple winners
2. **Invalid Combinations**: If dice don't match selected category, score = 0
3. **Incomplete Games**: Allow game saving/restoration for interrupted sessions
4. **Maximum Score**: Theoretical maximum is 1,575 points (13 Yahtzees scenario)

## References

- Official Hasbro Yahtzee Rules
- Milton Bradley Company rulebook
- Standard tournament Yahtzee regulations 