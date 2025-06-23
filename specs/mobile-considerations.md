# Mobile Considerations Specification

## Overview

This specification covers all mobile-specific considerations for the Yahtzee game, including touch interactions, responsive design, performance optimizations, and mobile user experience patterns.

## Touch Interface Design

### Touch Target Guidelines

**Minimum Touch Targets:**
- iOS: 44pt × 44pt (approximately 44px × 44px)
- Android: 48dp × 48dp (approximately 48px × 48px)
- Recommended: 48px × 48px minimum for all interactive elements

**Touch Target Implementation:**
```css
.touch-target {
  min-width: 48px;
  min-height: 48px;
  padding: 12px;
  margin: 4px;
}

/* Dice touch targets */
.die {
  width: 60px;
  height: 60px;
  cursor: pointer;
  touch-action: manipulation; /* Prevent double-tap zoom */
}

/* Button touch targets */
.button {
  min-height: 48px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px; /* Prevent zoom on iOS */
}
```

### Touch Interactions

**Tap Gestures:**
- Single tap: Primary action (roll dice, select score, hold/unhold die)
- Long press: Secondary action (show help, context menu)
- Double tap: Disabled to prevent accidental zooming

**Touch Feedback:**
```css
.interactive-element {
  transition: transform 0.1s ease-out;
}

.interactive-element:active {
  transform: scale(0.95);
  background-color: rgba(0, 0, 0, 0.1);
}

/* Haptic feedback for supported devices */
.haptic-feedback {
  /* Implemented via JavaScript Vibration API */
}
```

**Haptic Feedback Implementation:**
```typescript
function provideHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 50,
      medium: 100,
      heavy: 200
    };
    navigator.vibrate(patterns[type]);
  }
}

// Usage examples
function onDiceRoll() {
  provideHapticFeedback('medium');
  // ... roll logic
}

function onScoreSelect() {
  provideHapticFeedback('light');
  // ... scoring logic
}
```

## Responsive Design Strategy

### Viewport Configuration

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### Breakpoint System

```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 480px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
}

/* Base styles: Mobile (320px - 479px) */
.game-container {
  padding: 16px;
  max-width: 100vw;
}

/* Small Mobile (480px+) */
@media (min-width: 480px) {
  .game-container {
    padding: 20px;
    max-width: 450px;
    margin: 0 auto;
  }
  
  .dice-container {
    gap: 12px;
  }
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .game-container {
    max-width: 600px;
    padding: 24px;
  }
  
  .dice {
    width: 80px;
    height: 80px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .game-container {
    max-width: 800px;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 32px;
  }
}
```

### Flexible Layouts

```css
/* Flexible dice container */
.dice-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 20px 0;
}

/* Responsive scorecard */
.scorecard {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

/* Stacked layout for small screens */
@media (max-width: 479px) {
  .dice-container {
    gap: 6px;
  }
  
  .dice {
    width: 50px;
    height: 50px;
  }
  
  .scorecard {
    font-size: 14px;
  }
}
```

## Mobile-Specific UI Patterns

### Mobile Navigation

```tsx
interface MobileNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentScreen,
  onNavigate
}) => {
  return (
    <nav className="mobile-nav">
      <button
        className={`nav-item ${currentScreen === 'game' ? 'active' : ''}`}
        onClick={() => onNavigate('game')}
      >
        🎲 Game
      </button>
      <button
        className={`nav-item ${currentScreen === 'scores' ? 'active' : ''}`}
        onClick={() => onNavigate('scores')}
      >
        📊 Scores
      </button>
      <button
        className={`nav-item ${currentScreen === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
      >
        ⚙️ Settings
      </button>
    </nav>
  );
};
```

### Bottom Sheet Pattern

```tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children
}) => {
  return (
    <>
      {isOpen && (
        <div className="bottom-sheet-overlay" onClick={onClose} />
      )}
      <div className={`bottom-sheet ${isOpen ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
};
```

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
  z-index: 1000;
  max-height: 80vh;
  overflow-y: auto;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: #ccc;
  border-radius: 2px;
  margin: 8px auto;
}
```

## Performance Optimizations

### Animation Performance

```css
/* Use transform and opacity for animations */
.dice-roll-animation {
  will-change: transform;
  animation: diceRoll 1s ease-in-out;
}

@keyframes diceRoll {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Remove will-change after animation */
.dice-roll-animation.complete {
  will-change: auto;
}
```

### Memory Management

```typescript
// Optimize re-renders with React.memo
export const Die = React.memo<DieProps>(({ die, onToggleHold }) => {
  return (
    <button
      className={`die ${die.isHeld ? 'held' : ''}`}
      onClick={onToggleHold}
    >
      <DieFace value={die.value} />
    </button>
  );
});

// Use useCallback for event handlers
const handleDiceRoll = useCallback(() => {
  if (canRoll) {
    rollDice();
    provideHapticFeedback('medium');
  }
}, [canRoll, rollDice]);
```

### Bundle Size Optimization

```typescript
// Lazy load components
const GameStats = lazy(() => import('./components/GameStats'));
const Settings = lazy(() => import('./components/Settings'));

// Code splitting by route
const GameScreen = lazy(() => import('./screens/GameScreen'));
const SetupScreen = lazy(() => import('./screens/SetupScreen'));
```

## Battery and Performance Considerations

### Power Management

```typescript
// Reduce animation complexity on low battery
function getBatteryLevel(): Promise<number> {
  if ('getBattery' in navigator) {
    return (navigator as any).getBattery().then((battery: any) => battery.level);
  }
  return Promise.resolve(1); // Assume full battery if API not available
}

// Adjust animations based on battery level
async function optimizeForBattery() {
  const batteryLevel = await getBatteryLevel();
  
  if (batteryLevel < 0.2) {
    // Disable complex animations when battery is low
    document.body.classList.add('low-battery-mode');
  }
}
```

### Reduced Motion Support

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .dice-roll-animation {
    animation: none;
  }
  
  .transition-element {
    transition: none;
  }
  
  /* Provide alternative feedback */
  .dice-roll-simple {
    background-color: #4CAF50;
    transition: background-color 0.3s ease;
  }
}
```

### Background Behavior

```typescript
// Pause game when app goes to background
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // App is in background
    pauseAnimations();
    clearTimers();
  } else {
    // App is in foreground
    resumeAnimations();
    restartTimers();
  }
});

// Wake lock to prevent screen from turning off during gameplay
async function preventScreenSleep() {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      
      // Release wake lock when game ends
      return () => wakeLock.release();
    } catch (err) {
      console.log('Wake lock not supported or failed:', err);
    }
  }
}
```

## Accessibility on Mobile

### Screen Reader Support

```tsx
// Proper ARIA labels for mobile screen readers
export const Die: React.FC<DieProps> = ({ die, onToggleHold }) => {
  const ariaLabel = `Die showing ${die.value}. ${
    die.isHeld ? 'Currently held' : 'Not held'
  }. ${die.canBeHeld ? 'Tap to toggle hold' : 'Cannot be held yet'}`;
  
  return (
    <button
      className={`die ${die.isHeld ? 'held' : ''}`}
      onClick={onToggleHold}
      disabled={!die.canBeHeld}
      aria-label={ariaLabel}
      aria-pressed={die.isHeld}
    >
      <DieFace value={die.value} />
    </button>
  );
};
```

### Focus Management

```typescript
// Manage focus for mobile accessibility
function manageFocus() {
  // Focus management for screen readers
  const focusableElements = document.querySelectorAll(
    'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  // Focus first interactive element when screen changes
  if (focusableElements.length > 0) {
    (focusableElements[0] as HTMLElement).focus();
  }
}

// Skip to main content link
export const SkipLink: React.FC = () => (
  <a
    href="#main-content"
    className="skip-link"
    onClick={(e) => {
      e.preventDefault();
      document.getElementById('main-content')?.focus();
    }}
  >
    Skip to main content
  </a>
);
```

## Device-Specific Considerations

### iOS Safari Specific

```css
/* Fix iOS Safari viewport height issues */
.app-container {
  height: 100vh;
  height: -webkit-fill-available;
}

/* Prevent iOS Safari bounce scrolling */
body {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app-content {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Fix iOS Safari input zoom */
input, select, textarea {
  font-size: 16px; /* Prevents zoom on focus */
}
```

### Android Chrome Specific

```css
/* Fix Android Chrome address bar behavior */
.app-container {
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
}

/* Set CSS custom property for viewport height */
```

```typescript
// Calculate real viewport height on Android
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);
setViewportHeight();
```

### PWA Features

```typescript
// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered: ', registration);
    })
    .catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
}

// Add to home screen prompt
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  showInstallButton();
});

function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      deferredPrompt = null;
    });
  }
}
```

## Testing on Mobile

### Touch Testing

```typescript
// Test touch interactions
describe('Mobile Touch Interactions', () => {
  test('dice respond to touch events', () => {
    const die = screen.getByLabelText(/die showing/i);
    fireEvent.touchStart(die);
    fireEvent.touchEnd(die);
    expect(die).toHaveClass('held');
  });
  
  test('buttons have adequate touch targets', () => {
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
  });
});
```

### Responsive Testing

```typescript
// Test responsive layouts
describe('Responsive Design', () => {
  test('adapts to mobile viewport', () => {
    global.innerWidth = 375;
    global.innerHeight = 667;
    global.dispatchEvent(new Event('resize'));
    
    const container = screen.getByTestId('game-container');
    expect(container).toHaveStyle('max-width: 100vw');
  });
  
  test('dice resize for different screen sizes', () => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // iPhone 5
      { width: 375, height: 667 }, // iPhone 6/7/8
      { width: 414, height: 896 }, // iPhone 11
      { width: 768, height: 1024 } // iPad
    ];
    
    viewports.forEach(viewport => {
      global.innerWidth = viewport.width;
      global.innerHeight = viewport.height;
      global.dispatchEvent(new Event('resize'));
      
      // Assert appropriate sizing
    });
  });
});
```

## Mobile UX Best Practices

### Loading States

```tsx
export const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner" role="status" aria-label="Loading">
    <div className="spinner-circle" />
  </div>
);

// Skeleton loading for scorecard
export const ScorecardSkeleton: React.FC = () => (
  <div className="scorecard-skeleton">
    {Array.from({ length: 13 }, (_, i) => (
      <div key={i} className="skeleton-row">
        <div className="skeleton-text" />
        <div className="skeleton-number" />
      </div>
    ))}
  </div>
);
```

### Error Handling

```tsx
export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div className="error-screen">
        <h2>Oops! Something went wrong</h2>
        <p>Please try refreshing the page or restarting the game.</p>
        <button onClick={() => setHasError(false)}>
          Try Again
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
};
```

### Offline Support

```typescript
// Check online status
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

// Offline indicator
export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  
  if (isOnline) return null;
  
  return (
    <div className="offline-indicator">
      📴 Playing offline
    </div>
  );
};
```

This comprehensive mobile considerations specification ensures the Yahtzee game provides an excellent user experience across all mobile devices and platforms. 