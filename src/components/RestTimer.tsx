'use client';

import { formatSecondsToTime } from '../lib/validation';
import { Icon } from './shared/Icon';

interface RestTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
  onAdd30: () => void;
  onClose: () => void;
}

export function RestTimer({
  secondsLeft,
  totalSeconds,
  isActive,
  onToggle,
  onReset,
  onAdd30,
  onClose,
}: RestTimerProps) {
  if (totalSeconds <= 0 && secondsLeft <= 0) return null;

  const percent = totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  return (
    <div className="rest-timer-bar" role="region" aria-label="Rest timer">
      <div className="timer-left">
        <div className="timer-ring-mini">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke="var(--accent-volt)"
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="timer-display">
          <span className="timer-clock">{formatSecondsToTime(secondsLeft)}</span>
          <span className="timer-label">{isActive ? 'Resting…' : 'Timer Paused'}</span>
        </div>
      </div>

      <div className="timer-controls">
        <button className="timer-btn" onClick={onToggle} title={isActive ? 'Pause' : 'Resume'}>
          <Icon name={isActive ? 'pause' : 'play'} size={14} />
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>
        <button className="timer-btn" onClick={onAdd30} title="Add 30 seconds">
          <span>+30s</span>
        </button>
        <button className="timer-btn" onClick={onReset} title="Reset timer">
          <Icon name="rotate" size={13} />
        </button>
        <button className="timer-btn" onClick={onClose} title="Dismiss timer" style={{ padding: '6px' }}>
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
}
