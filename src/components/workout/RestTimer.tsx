import { useState, useEffect } from 'react';
import Card from '../common/Card';

interface RestTimerProps {
  duration: number; // Duration in seconds
  onComplete: () => void;
}

export default function RestTimer({ duration, onComplete }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete();
          
          // Send notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Rest Period Complete! 💪', {
              body: 'Time to crush your next set',
              icon: '/pwa-192x192.png'
            });
            
            // Trigger vibration separately
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (mins: number, secs: number): string => {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="text-center">
      <div className="text-sm text-gray-600 mb-2">REST TIMER</div>
      <div className="text-6xl font-bold text-primary">
        {formatTime(minutes, seconds)}
      </div>
      {timeLeft <= 10 && timeLeft > 0 && (
        <div className="mt-2 text-warning-dark font-medium">
          Almost ready!
        </div>
      )}
      {timeLeft === 0 && (
        <div className="mt-2 text-success-dark font-semibold">
          ✓ Rest complete!
        </div>
      )}
    </Card>
  );
}

