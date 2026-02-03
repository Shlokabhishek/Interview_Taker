import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { formatDuration } from '../../utils/helpers';

const Timer = ({
  duration, // Total duration in seconds
  onTimeUp,
  onWarning,
  warningThreshold = 30, // Warn when 30 seconds left
  autoStart = true,
  showProgress = true,
  size = 'md',
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [hasWarned, setHasWarned] = useState(false);

  // Start timer
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  // Pause timer
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Reset timer
  const reset = useCallback(() => {
    setTimeRemaining(duration);
    setHasWarned(false);
    setIsRunning(false);
  }, [duration]);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          if (onTimeUp) onTimeUp();
          return 0;
        }

        // Check for warning
        if (prev === warningThreshold + 1 && !hasWarned) {
          setHasWarned(true);
          if (onWarning) onWarning();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, warningThreshold, hasWarned, onTimeUp, onWarning]);

  // Reset when duration changes
  useEffect(() => {
    setTimeRemaining(duration);
    setHasWarned(false);
  }, [duration]);

  const progress = (timeRemaining / duration) * 100;
  const isWarning = timeRemaining <= warningThreshold;
  const isCritical = timeRemaining <= 10;

  const sizes = {
    sm: {
      container: 'text-sm',
      icon: 'w-4 h-4',
      progressHeight: 'h-1',
    },
    md: {
      container: 'text-base',
      icon: 'w-5 h-5',
      progressHeight: 'h-1.5',
    },
    lg: {
      container: 'text-lg',
      icon: 'w-6 h-6',
      progressHeight: 'h-2',
    },
  };

  const getColorClasses = () => {
    if (isCritical) return 'text-red-600 bg-red-50';
    if (isWarning) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-700 bg-gray-50';
  };

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-primary-500';
  };

  return (
    <div className={`${className}`}>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getColorClasses()} ${sizes[size].container}`}>
        {isCritical ? (
          <AlertCircle className={`${sizes[size].icon} animate-pulse`} />
        ) : (
          <Clock className={sizes[size].icon} />
        )}
        <span className="font-mono font-semibold">
          {formatDuration(timeRemaining)}
        </span>
      </div>

      {showProgress && (
        <div className={`mt-2 w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size].progressHeight}`}>
          <div
            className={`${sizes[size].progressHeight} ${getProgressColor()} transition-all duration-1000 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Timer;
