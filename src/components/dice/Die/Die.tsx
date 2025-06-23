import React from 'react';
import './Die.css';

interface DieProps {
  value: number;
  isHeld: boolean;
  isRolling: boolean;
  onToggleHold: () => void;
  disabled?: boolean;
  animationDelay?: number;
}

export const Die: React.FC<DieProps> = ({
  value,
  isHeld,
  isRolling,
  onToggleHold,
  disabled = false,
  animationDelay = 0
}) => {
  const handleClick = () => {
    if (!disabled && !isRolling) {
      onToggleHold();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const getDotPositions = (value: number): string[] => {
    const dotPositions: Record<number, string[]> = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };
    
    return dotPositions[value] || [];
  };

  const dotPositions = getDotPositions(value);

  return (
    <button
      className={`die ${isHeld ? 'die--held' : ''} ${isRolling ? 'die--rolling' : ''} ${disabled ? 'die--disabled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      disabled={disabled}
      style={{ 
        animationDelay: animationDelay ? `${animationDelay}ms` : undefined 
      }}
      aria-label={`Die showing ${value}, ${isHeld ? 'held' : 'not held'}. Click to ${isHeld ? 'unhold' : 'hold'}.`}
      tabIndex={disabled ? -1 : 0}
    >
      <div className="die__face">
        {dotPositions.map((position, index) => (
          <div key={`${position}-${index}`} className={`die__dot die__dot--${position}`} />
        ))}
      </div>
      {isHeld && (
        <div className="die__held-indicator">
          <span className="sr-only">Held</span>
        </div>
      )}
    </button>
  );
}; 