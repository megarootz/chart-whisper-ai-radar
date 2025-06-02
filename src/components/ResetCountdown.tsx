
import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Clock } from 'lucide-react';

const ResetCountdown = () => {
  const { serverTime } = useSubscription();
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!serverTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const resetTime = new Date(serverTime.next_reset_utc).getTime();
      const timeLeft = resetTime - now;

      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        setCountdown({ hours, minutes, seconds });
      } else {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [serverTime]);

  if (!countdown || !serverTime) return null;

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <Clock className="h-4 w-4" />
      <span>
        Daily reset in: {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
      </span>
    </div>
  );
};

export default ResetCountdown;
