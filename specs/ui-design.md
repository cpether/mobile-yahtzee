# User Interface Design Specification

## Overview

This document outlines the user interface design requirements for the mobile Yahtzee game. The design follows mobile-first principles with an emphasis on touch-friendly interactions and clear visual hierarchy.

## Design Principles

### Mobile-First
- Designed primarily for mobile devices (phones and tablets)
- Touch-friendly interactions with minimum 44px touch targets
- Single-handed operation support where possible
- Responsive design that works on desktop as a bonus

### Simplicity
- Clean, uncluttered interface
- Minimal text and instructions
- Visual icons and indicators where possible
- Easy-to-understand game state

### Accessibility
- High contrast colors for visibility
- Large, readable text (minimum 16px base size)
- Screen reader compatible
- Colorblind-friendly design

## Screen Layouts

### 1. Game Setup Screen

```
┌─────────────────────────┐
│  🎲 Mobile Yahtzee      │
├─────────────────────────┤
│                         │
│  Number of Players:     │
│  ○ 2  ○ 3  ○ 4         │
│                         │
│  Player Names:          │
│  ┌─────────────────┐    │
│  │ Player 1        │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │ Player 2        │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │   Start Game    │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

**Features:**
- Simple player count selection
- Text inputs for player names
- Prominent "Start Game" button
- Game title and branding

### 2. Main Game Screen

```
┌─────────────────────────┐
│ Player: Sarah (Turn 3)  │
│ ┌─────┐ ┌─────┐        │
│ │  ⚀  │ │ 🎯  │        │  <- Dice area
│ └─────┘ └─────┘        │
│    HELD    KEEP         │
│                         │
│ ┌─────────────────┐     │
│ │   Roll Dice     │     │  <- Roll button
│ └─────────────────┘     │
│ Rolls Left: 2           │
│                         │
│ ┌─────────────────────┐ │  <- All Players Scorecard
│ │Sarah│Mike │Lisa │   │ │
│ ├─────┼─────┼─────┤   │ │
│ │ [3] │ [2] │ [ ] │1s │ │
│ │ [ ] │ [4] │ [2] │2s │ │
│ │ [9] │ [ ] │ [6] │3s │ │
│ │ 52  │ 72  │ 45  │TOT│ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Components:**
- **Player Info**: Current player name and turn count
- **Dice Display**: Visual dice with hold/keep states
- **Roll Button**: Primary action button
- **Roll Counter**: Shows remaining rolls
- **Multi-Player Scorecard**: Always visible table showing all players' scores with current player highlighted

### 3. End Game Summary

```
┌─────────────────────────┐
│       🏆 GAME OVER      │
├─────────────────────────┤
│                         │
│  1st Place: Sarah       │
│      Score: 287         │
│                         │
│  2nd Place: Mike        │
│      Score: 245         │
│                         │
│  3rd Place: Lisa        │
│      Score: 198         │
│                         │
│ ┌─────────────────┐     │
│ │   New Game      │     │
│ └─────────────────┘     │
│ ┌─────────────────┐     │
│ │ View Scorecards │     │
│ └─────────────────┘     │
└─────────────────────────┘
```

## Component Design

### Dice Component

**States:**
- **Normal**: White background, black dots
- **Held**: Blue background, white dots
- **Selectable**: Slight glow/outline
- **Rolling**: Animation state

**Specifications:**
- Minimum size: 60px × 60px
- Touch target: 64px × 64px
- Rounded corners: 8px
- Drop shadow for depth

### Button Components

**Primary Button (Roll Dice)**
- Background: #007AFF (iOS blue)
- Text: White, 18px, bold
- Height: 48px minimum
- Rounded corners: 24px
- Full-width on mobile

**Secondary Button**
- Background: White
- Border: 2px solid #007AFF
- Text: #007AFF, 16px
- Height: 44px minimum

**Scorecard Button**
- Background: Light gray (#F8F9FA)
- Text: Dark gray (#343A40)
- Left-aligned text
- Score on right side
- Height: 44px minimum

**Multi-Player Scorecard Table**
- Header row with player names
- Grid layout with equal column widths
- Alternating row colors for readability
- Compact cells (32px height minimum)
- Scrollable horizontally if needed for many players
- Current player highlighted with subtle border
- Clickable cells for scoring (current player only)

### Color Palette

```css
:root {
  /* Primary Colors */
  --primary-blue: #007AFF;
  --primary-dark: #0056CC;
  
  /* Dice Colors */
  --dice-normal: #FFFFFF;
  --dice-held: #007AFF;
  --dice-dots: #000000;
  --dice-dots-held: #FFFFFF;
  
  /* Background Colors */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;
  --bg-tertiary: #E9ECEF;
  
  /* Text Colors */
  --text-primary: #212529;
  --text-secondary: #6C757D;
  --text-light: #FFFFFF;
  
  /* Status Colors */
  --success: #28A745;
  --warning: #FFC107;
  --danger: #DC3545;
  --info: #17A2B8;
}
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

### Font Sizes
- **Large Title**: 32px (Game title)
- **Title**: 24px (Section headers)
- **Headline**: 20px (Player names)
- **Body**: 16px (Default text)
- **Caption**: 14px (Secondary info)
- **Small**: 12px (Fine print)

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Bold**: 700

## Responsive Breakpoints

```css
/* Mobile First */
.container {
  max-width: 100%;
  padding: 16px;
}

/* Small devices (landscape phones) */
@media (min-width: 576px) {
  .container {
    max-width: 540px;
  }
}

/* Medium devices (tablets) */
@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
  
  .dice-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Large devices (desktops) */
@media (min-width: 992px) {
  .container {
    max-width: 960px;
  }
  
  .game-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
  }
}
```

## Animation Specifications

### Dice Roll Animation
```css
@keyframes diceRoll {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.1); }
  50% { transform: rotate(180deg) scale(1); }
  75% { transform: rotate(270deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

.dice-rolling {
  animation: diceRoll 0.5s ease-in-out;
}
```

### Button Press Animation
```css
.button:active {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}
```

### Score Update Animation
```css
@keyframes scoreUpdate {
  0% { 
    background-color: #28A745;
    transform: scale(1);
  }
  50% { 
    background-color: #28A745;
    transform: scale(1.05);
  }
  100% { 
    background-color: transparent;
    transform: scale(1);
  }
}

.score-updated {
  animation: scoreUpdate 0.6s ease-in-out;
}
```

## Touch Interactions

### Dice Selection
- **Tap**: Toggle hold state
- **Visual Feedback**: Immediate color change
- **Haptic Feedback**: Light vibration (where supported)

### Button Interactions
- **Minimum Touch Target**: 44px × 44px
- **Press State**: Scale down to 95%
- **Loading State**: Show spinner for roll actions

### Scroll Behavior
- **Scorecard**: Smooth scrolling
- **Momentum Scrolling**: Enabled on iOS
- **Scroll Indicators**: Hidden by default

## Accessibility Features

### Screen Reader Support
```html
<!-- Dice with proper labeling -->
<button 
  role="button" 
  aria-label="Die showing 4, currently held" 
  aria-pressed="true"
>
  <!-- Dice visual -->
</button>

<!-- Score buttons -->
<button aria-label="Score 12 points in Threes category">
  Threes: 12
</button>
```

### Keyboard Navigation
- Tab order follows logical flow
- Enter key activates buttons
- Arrow keys for dice selection (desktop)
- Escape key for modal dismissal

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  :root {
    --primary-blue: #0000CC;
    --text-primary: #000000;
    --bg-primary: #FFFFFF;
  }
}
```

## Loading States

### Initial Game Load
- Skeleton screens for scorecard
- Progressive loading of game assets
- Smooth transitions between states

### Dice Roll Loading
- Disable roll button during animation
- Show rolling animation for 0.5s minimum
- Update dice values simultaneously

## Error States

### Network Errors
- Graceful degradation for offline play
- Clear error messages
- Retry mechanisms

### Invalid Actions
- Disabled buttons for unavailable actions
- Tooltip explanations for restrictions
- Visual indicators for valid moves

## Performance Considerations

### Image Assets
- Use CSS for dice dots instead of images
- SVG icons for scalability
- Lazy loading for non-critical assets

### Animations
- Use transform and opacity for performance
- Reduce motion for users who prefer it
- 60fps target for all animations

### Memory Management
- Efficient state updates
- Cleanup of event listeners
- Minimize re-renders 