
import React, { useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import ResetCountdown from './ResetCountdown';
import { Crown, Star, Zap, Brain, Info, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const UsageDisplay = () => {
  const { usage, checkUsageLimits } = useSubscription();
  const isMobile = useIsMobile();

  // Force refresh when component mounts to ensure latest data
  useEffect(() => {
    checkUsageLimits();
  }, []);

  if (!usage) return null;

  const deepDailyProgress = usage.deep_analysis_daily_limit > 0 ? (usage.deep_analysis_daily_count / usage.deep_analysis_daily_limit) * 100 : 0;
  const deepMonthlyProgress = usage.deep_analysis_monthly_limit > 0 ? (usage.deep_analysis_monthly_count / usage.deep_analysis_monthly_limit) * 100 : 0;

  const getDeepDailyColor = () => {
    if (deepDailyProgress >= 100) return 'bg-red-500';
    if (deepDailyProgress >= 80) return 'bg-yellow-500';
    return 'bg-purple-500';
  };

  const getDeepMonthlyColor = () => {
    if (deepMonthlyProgress >= 100) return 'bg-red-500';
    if (deepMonthlyProgress >= 80) return 'bg-yellow-500';
    return 'bg-purple-500';
  };

  const getPlanBadge = () => {
    switch (usage.subscription_tier) {
      case 'pro':
        return (
          <Badge variant="outline" className="text-yellow-400 border-yellow-400 bg-yellow-400/10 text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        );
      case 'starter':
        return (
          <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-400/10 text-xs">
            <Star className="h-3 w-3 mr-1" />
            Starter
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-400 border-gray-400 bg-gray-400/10 text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Free
          </Badge>
        );
    }
  };

  return (
    <TooltipProvider>
      <div className="bg-chart-card border border-gray-700 rounded-lg p-3 space-y-3 transition-all duration-200 hover:border-purple-500/30">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium text-sm flex items-center gap-2">
            Usage Statistics
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={checkUsageLimits}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh usage statistics</p>
              </TooltipContent>
            </Tooltip>
          </h3>
          {getPlanBadge()}
        </div>

        {/* Deep Multi-Timeframe Analysis Usage */}
        <div className="space-y-3">
          <h4 className="text-white font-medium text-xs flex items-center gap-2">
            <Brain className="h-3 w-3 text-purple-400" />
            Multi-Timeframe Analysis
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Each analysis covers 3 timeframes (D1, H4, M15) for 1 credit</p>
              </TooltipContent>
            </Tooltip>
          </h4>
          
          {/* Deep Daily Usage */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Daily</span>
              <span className="text-xs text-gray-400">
                {usage.deep_analysis_daily_count} / {usage.deep_analysis_daily_limit}
              </span>
            </div>
            <Progress 
              value={deepDailyProgress} 
              className="h-1.5"
              style={{
                '--progress-foreground': getDeepDailyColor(),
              } as React.CSSProperties}
            />
            <div className="text-xs text-gray-500">
              {usage.deep_analysis_daily_remaining} remaining today
            </div>
          </div>

          {/* Deep Monthly Usage */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Monthly</span>
              <span className="text-xs text-gray-400">
                {usage.deep_analysis_monthly_count} / {usage.deep_analysis_monthly_limit}
              </span>
            </div>
            <Progress 
              value={deepMonthlyProgress} 
              className="h-1.5"
              style={{
                '--progress-foreground': getDeepMonthlyColor(),
              } as React.CSSProperties}
            />
            <div className="text-xs text-gray-500">
              {usage.deep_analysis_monthly_remaining} remaining this month
            </div>
          </div>
        </div>

        {/* Reset Countdown */}
        <div className="border-t border-gray-700 pt-2">
          <ResetCountdown />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${usage.can_deep_analyze ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-xs ${usage.can_deep_analyze ? 'text-purple-400' : 'text-red-400'}`}>
              {usage.can_deep_analyze ? 'Multi-timeframe analysis available' : 'Analysis limits reached'}
            </span>
          </div>
          {usage.can_deep_analyze && (
            <div className="text-xs text-gray-500 ml-3.5">
              Each analysis covers 3 timeframes (D1, H4, M15) for 1 credit
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default UsageDisplay;
