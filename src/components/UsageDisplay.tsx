
import React, { useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import ResetCountdown from './ResetCountdown';
import { Crown, Star, Zap } from 'lucide-react';

const UsageDisplay = () => {
  const { usage, checkUsageLimits } = useSubscription();
  const isMobile = useIsMobile();

  // Force refresh when component mounts to ensure latest data
  useEffect(() => {
    checkUsageLimits();
  }, []);

  if (!usage) return null;

  const dailyProgress = usage.daily_limit > 0 ? (usage.daily_count / usage.daily_limit) * 100 : 0;
  const monthlyProgress = usage.monthly_limit > 0 ? (usage.monthly_count / usage.monthly_limit) * 100 : 0;

  const getDailyColor = () => {
    if (dailyProgress >= 100) return 'bg-red-500';
    if (dailyProgress >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMonthlyColor = () => {
    if (monthlyProgress >= 100) return 'bg-red-500';
    if (monthlyProgress >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPlanBadge = () => {
    switch (usage.subscription_tier) {
      case 'pro':
        return (
          <Badge variant="outline" className="text-yellow-400 border-yellow-400 bg-yellow-400/10">
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        );
      case 'starter':
        return (
          <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-400/10">
            <Star className="h-3 w-3 mr-1" />
            Starter
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-400 border-gray-400 bg-gray-400/10">
            <Zap className="h-3 w-3 mr-1" />
            Free
          </Badge>
        );
    }
  };

  return (
    <div className="bg-chart-card border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Usage Statistics</h3>
        {getPlanBadge()}
      </div>

      {/* Daily Usage */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Daily Usage</span>
          <span className="text-sm text-gray-400">
            {usage.daily_count} / {usage.daily_limit}
          </span>
        </div>
        <Progress 
          value={dailyProgress} 
          className="h-2"
          style={{
            '--progress-foreground': getDailyColor(),
          } as React.CSSProperties}
        />
        <div className="text-xs text-gray-500">
          {usage.daily_remaining} analyses remaining today
        </div>
      </div>

      {/* Monthly Usage */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Monthly Usage</span>
          <span className="text-sm text-gray-400">
            {usage.monthly_count} / {usage.monthly_limit}
          </span>
        </div>
        <Progress 
          value={monthlyProgress} 
          className="h-2"
          style={{
            '--progress-foreground': getMonthlyColor(),
          } as React.CSSProperties}
        />
        <div className="text-xs text-gray-500">
          {usage.monthly_remaining} analyses remaining this month
        </div>
      </div>

      {/* Reset Countdown */}
      <div className="border-t border-gray-700 pt-3">
        <ResetCountdown />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${usage.can_analyze ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={`text-sm ${usage.can_analyze ? 'text-green-400' : 'text-red-400'}`}>
          {usage.can_analyze ? 'Analysis available' : 'Usage limits reached'}
        </span>
      </div>
    </div>
  );
};

export default UsageDisplay;
