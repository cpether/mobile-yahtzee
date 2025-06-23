# Dice System Specification

## Overview

The dice system is the core interactive element of the Yahtzee game. This specification covers the mechanics, animations, visual states, and user interactions for the five dice used in gameplay.

## Dice Mechanics

### Core Properties

Each die has the following properties:

```typescript
interface Die {
  id: number;           // Unique identifier (0-4)
  value: number;        // Current face value (1-6)
  isHeld: boolean;      // Whether die is held for next roll
  isRolling: boolean;   // Animation state
  canBeHeld: boolean;   // Whether die can be held (after first roll)
}

interface DiceState {
  dice: Die[];
  rollsRemaining: number;  // 0-3 rolls per turn
  canRoll: boolean;        // Whether roll button should be enabled
  isAnyDieRolling: boolean; // Global rolling state
}
```

### Roll Logic

**Initial State (Turn Start)**
- All dice show value 1
- No dice are held
- 3 rolls remaining
- Can roll immediately

**First Roll**
- All 5 dice roll simultaneously
- Random values 1-6 generated
- All dice become holdable
- 2 rolls remaining

**Subsequent Rolls (2nd & 3rd)**
- Only non-held dice roll
- Held dice maintain their values and positions
- Roll count decrements

**Roll Completion**
- When 0 rolls remaining, turn ends
- Player must score in a category
- All dice reset for next turn

### Random Number Generation

```typescript
// Cryptographically secure random number generation
function rollDie(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % 6) + 1;
}

// Roll multiple dice with validation
function rollDice(diceToRoll: number[]): number[] {
  return diceToRoll.map(() => rollDie());
}
```

### Validation Rules

- Cannot roll if no rolls remaining
- Cannot hold dice before first roll
- Cannot unhold and reroll on final roll
- Must have at least one valid scoring category available

## Dice Animations

### Rolling Animation

**Animation Sequence:**
1. **Pre-roll** (100ms): Dice slightly scale up to indicate activation
2. **Rolling** (800-1200ms): Rapid value changes with rotation effect
3. **Settling** (200ms): Final value revealed with bounce effect
4. **Complete**: Dice return to normal state, become holdable

**Animation Properties:**
```css
.die {
  transition: transform 0.2s ease-in-out;
  animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.die--rolling {
  animation: diceRoll 1s ease-in-out;
  pointer-events: none;
}

.die--settling {
  animation: diceSettle 0.2s ease-out;
}

@keyframes diceRoll {
  0% { transform: scale(1) rotateX(0deg) rotateY(0deg); }
  25% { transform: scale(1.1) rotateX(90deg) rotateY(45deg); }
  50% { transform: scale(1.05) rotateX(180deg) rotateY(90deg); }
  75% { transform: scale(1.1) rotateX(270deg) rotateY(135deg); }
  100% { transform: scale(1) rotateX(360deg) rotateY(180deg); }
}

@keyframes diceSettle {
  0% { transform: scale(1.05); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

### Staggered Animation

To create engaging visual effects, dice animations are staggered:

- Die 1: Start immediately
- Die 2: Start after 50ms delay
- Die 3: Start after 100ms delay  
- Die 4: Start after 150ms delay
- Die 5: Start after 200ms delay

This creates a wave-like rolling effect across the dice.

### Hold/Unhold Animation

```css
.die--held {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border: 2px solid var(--color-primary);
}

.die--hold-transition {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Visual Design

### Die Appearance

**Default State:**
- Size: 60px × 60px on mobile, 80px × 80px on desktop
- Border radius: 12px for rounded corners
- Background: White with subtle gradient
- Border: 2px solid #ddd
- Shadow: Subtle drop shadow for depth

**Held State:**
- Elevated position (8px up)
- Primary color border
- Enhanced shadow
- Slightly larger scale (1.05x)

**Rolling State:**
- Rapid value changes
- Rotation animation
- Slightly larger scale
- Disabled pointer events

### Dot Patterns

Standard die face patterns using CSS:

```css
.die-face {
  display: grid;
  grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  gap: 2px;
  padding: 8px;
}

.die-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #333;
}

/* Face-specific dot positions */
.face-1 .dot { grid-area: 2 / 2; }
.face-2 .dot:nth-child(1) { grid-area: 1 / 1; }
.face-2 .dot:nth-child(2) { grid-area: 3 / 3; }
/* ... etc for faces 3-6 */
```

### Responsive Sizing

```css
.dice-container {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 20px 0;
}

@media (max-width: 480px) {
  .die {
    width: 50px;
    height: 50px;
  }
  
  .dice-container {
    gap: 6px;
  }
}

@media (min-width: 768px) {
  .die {
    width: 80px;
    height: 80px;
  }
  
  .dice-container {
    gap: 12px;
  }
}
```

## User Interactions

### Touch Interactions

**Single Tap (Hold/Unhold):**
- Only available after first roll
- Toggle die held state
- Provide haptic feedback on mobile
- Visual feedback with bounce animation

**Roll Button:**
- Large, prominent button below dice
- Disabled states clearly indicated
- Loading state during animation
- Haptic feedback on tap

### Accessibility

**Screen Reader Support:**
```jsx
<div
  role="button"
  aria-label={`Die ${die.id + 1}, showing ${die.value}, ${die.isHeld ? 'held' : 'not held'}`}
  aria-pressed={die.isHeld}
  tabIndex={die.canBeHeld ? 0 : -1}
>
  {/* Die visual content */}
</div>
```

**Keyboard Navigation:**
- Tab through dice after first roll
- Space/Enter to toggle hold state
- Arrow keys for navigation
- Escape to unhold all dice

### Visual Feedback

**Success States:**
- Green glow for high-scoring combinations
- Celebration animation for Yahtzee
- Subtle pulse for available combinations

**Error States:**
- Red border for invalid actions
- Shake animation for disabled interactions
- Clear messaging for why action failed

## Performance Optimizations

### Animation Performance

```typescript
// Use RAF for smooth animations
function animateDiceRoll(dice: Die[], onComplete: () => void) {
  const duration = 1000;
  const startTime = performance.now();
  
  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Update dice values using easing function
    updateDiceAnimation(dice, progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  }
  
  requestAnimationFrame(animate);
}
```

### Memory Management

- Reuse animation objects
- Clean up event listeners
- Use CSS transforms over position changes
- Minimize DOM manipulations during animation

### Battery Optimization

- Reduce animation complexity on low battery
- Use `will-change` CSS property sparingly
- Pause animations when tab not visible
- Provide option to disable animations

## Component Architecture

### DiceContainer Component

```tsx
interface DiceContainerProps {
  gameState: GameState;
  onRoll: () => void;
  onToggleHold: (dieIndex: number) => void;
}

export const DiceContainer: React.FC<DiceContainerProps> = ({
  gameState,
  onRoll,
  onToggleHold
}) => {
  const { dice, rollsRemaining, canRoll, isAnyDieRolling } = gameState;
  
  return (
    <div className="dice-game-area">
      <div className="dice-container">
        {dice.map((die, index) => (
          <Die
            key={die.id}
            die={die}
            onToggleHold={() => onToggleHold(index)}
            animationDelay={index * 50}
          />
        ))}
      </div>
      
      <RollButton
        disabled={!canRoll || isAnyDieRolling}
        rollsRemaining={rollsRemaining}
        onRoll={onRoll}
      />
      
      <RollInfo
        rollsRemaining={rollsRemaining}
        heldDiceCount={dice.filter(d => d.isHeld).length}
      />
    </div>
  );
};
```

### Individual Die Component

```tsx
interface DieProps {
  die: Die;
  onToggleHold: () => void;
  animationDelay: number;
}

export const Die: React.FC<DieProps> = ({ 
  die, 
  onToggleHold, 
  animationDelay 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (die.isRolling) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000 + animationDelay);
      
      return () => clearTimeout(timer);
    }
  }, [die.isRolling, animationDelay]);
  
  return (
    <button
      className={`die ${die.isHeld ? 'die--held' : ''} ${isAnimating ? 'die--rolling' : ''}`}
      onClick={die.canBeHeld ? onToggleHold : undefined}
      disabled={!die.canBeHeld}
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-label={`Die showing ${die.value}${die.isHeld ? ', held' : ''}`}
    >
      <DieFace value={die.value} />
    </button>
  );
};
```

## Testing Considerations

### Unit Tests

- Random number generation within bounds
- Hold/unhold state transitions
- Roll count decrements correctly
- Animation state management

### Integration Tests

- Complete turn flow
- Dice reset between turns
- Score calculation with held dice
- Error handling for invalid actions

### Visual Regression Tests

- Dice appearance in all states
- Animation keyframes
- Responsive layouts
- Accessibility compliance

## Implementation Notes

### State Management Integration

The dice system integrates with the global game state through:

- **Actions**: `ROLL_DICE`, `TOGGLE_HOLD_DIE`, `RESET_DICE`
- **Selectors**: `getDiceState`, `canPlayerRoll`, `getHeldDice`
- **Effects**: Auto-advance when no rolls remaining

### Mobile Considerations

- Touch targets minimum 44px (iOS) / 48px (Android)
- Haptic feedback using Vibration API
- Prevent zoom on double-tap
- Smooth 60fps animations
- Reduced motion preferences support

### Browser Compatibility

- CSS Grid support (95%+ browser support)
- Web Animations API fallback
- `crypto.getRandomValues()` support
- RequestAnimationFrame polyfill if needed

This dice system specification ensures engaging, accessible, and performant dice interactions that form the heart of the Yahtzee gaming experience. 