import type { DiceState } from '../types/game';

/**
 * Generate a random dice value using crypto.getRandomValues for better randomness
 */
export const rollDie = (): number => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % 6) + 1;
  }
  // Fallback to Math.random if crypto API is not available
  return Math.floor(Math.random() * 6) + 1;
};

/**
 * Create initial dice state (all unheld, all showing 1)
 */
export const createInitialDice = (): DiceState[] => {
  return Array.from({ length: 5 }, () => ({
    value: 1,
    isHeld: false,
    isRolling: false
  }));
};

/**
 * Roll all unheld dice
 */
export const rollUnheldDice = (dice: DiceState[]): DiceState[] => {
  return dice.map(die => ({
    ...die,
    value: die.isHeld ? die.value : rollDie(),
    isRolling: !die.isHeld // Only unheld dice are rolling
  }));
};

/**
 * Toggle hold state of a specific die
 */
export const toggleDieHold = (dice: DiceState[], dieIndex: number): DiceState[] => {
  if (dieIndex < 0 || dieIndex >= dice.length) {
    return dice; // Invalid index, return unchanged
  }
  
  return dice.map((die, index) => 
    index === dieIndex ? { ...die, isHeld: !die.isHeld } : die
  );
};

/**
 * Set rolling state for all dice (used for animations)
 */
export const setDiceRolling = (dice: DiceState[], isRolling: boolean): DiceState[] => {
  return dice.map(die => ({
    ...die,
    isRolling: !die.isHeld && isRolling
  }));
};

/**
 * Reset all dice to unheld state (for new turn)
 */
export const resetDiceHolds = (dice: DiceState[]): DiceState[] => {
  return dice.map(die => ({
    ...die,
    isHeld: false,
    isRolling: false
  }));
};

/**
 * Validate dice state
 */
export const validateDice = (dice: DiceState[]): boolean => {
  if (!Array.isArray(dice) || dice.length !== 5) {
    return false;
  }
  
  return dice.every(die => 
    typeof die.value === 'number' &&
    die.value >= 1 && 
    die.value <= 6 &&
    typeof die.isHeld === 'boolean' &&
    typeof die.isRolling === 'boolean'
  );
};

/**
 * Count held dice
 */
export const countHeldDice = (dice: DiceState[]): number => {
  return dice.filter(die => die.isHeld).length;
};

/**
 * Check if any dice are currently rolling (for animation state)
 */
export const areDiceRolling = (dice: DiceState[]): boolean => {
  return dice.some(die => die.isRolling);
};

/**
 * Get dice values as array of numbers
 */
export const getDiceValues = (dice: DiceState[]): number[] => {
  return dice.map(die => die.value);
};

/**
 * Create dice from values (for testing)
 */
export const createDiceFromValues = (values: number[]): DiceState[] => {
  if (values.length !== 5) {
    throw new Error('Must provide exactly 5 dice values');
  }
  
  return values.map(value => ({
    value: Math.max(1, Math.min(6, value)), // Clamp to valid range
    isHeld: false,
    isRolling: false
  }));
};

/**
 * Animate dice roll with staggered timing
 */
export const createStaggeredRollAnimation = (dice: DiceState[]): DiceState[] => {
  return dice.map((die, index) => ({
    ...die,
    isRolling: !die.isHeld,
    // Add a small delay property that can be used for CSS animation-delay
    animationDelay: !die.isHeld ? index * 100 : 0 // 100ms stagger
  } as DiceState & { animationDelay?: number }));
};

/**
 * Generate haptic feedback pattern for dice roll
 */
export const triggerDiceRollHaptic = (): void => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    // Short, sharp vibration for dice roll
    navigator.vibrate([50, 30, 50]);
  }
};

/**
 * Generate haptic feedback for die hold/unhold
 */
export const triggerDieHoldHaptic = (): void => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    // Single short vibration for hold toggle
    navigator.vibrate(25);
  }
}; 