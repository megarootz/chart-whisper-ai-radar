
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsageDisplay = () => {
  const { subscription, usage, loading } = useSubscription();
  const navigate = useNavigate();

  // Show loading state while subscription data is being fetched
  if (loading) {
    return (
      <Card className="bg-chart-card border-gray-700 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-600 animate-pulse rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Daily Usage</span>
              <div className="h-4 w-16 bg-gray-600 animate-pulse rounded"></div>
            </div>
            <div className="h-2 w-full bg-gray-600 animate-pulse rounded"></div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Monthly Usage</span>
              <div className="h-4 w-16 bg-gray-600 animate-pulse rounded"></div>
            </div>
            <div className="h-2 w-full bg-gray-600 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  const tierIcons = {
    free: <Check className="h-4 w-4" />,
    starter: <Zap className="h-4 w-4" />,
    pro: <Crown className="h-4 w-4" />
  };

  const tierColors = {
    free: 'bg-gray-500',
    starter: 'bg-blue-500', 
    pro: 'bg-purple-500'
  };

  const currentTier = subscription?.subscription_tier || 'free';
  const isFreeUser = currentTier === 'free';

  // For free users: STRICT limits (3 daily, 90 monthly)
  const displayDailyLimit = isFreeUser ? 3 : usage.daily_limit;
  const displayMonthlyLimit = isFreeUser ? 90 : usage.monthly_limit;
  const displayDailyRemaining = isFreeUser ? Math.max(0, 3 - usage.daily_count) : usage.daily_remaining;
  const displayMonthlyRemaining = isFreeUser ? Math.max(0, 90 - usage.monthly_count) : usage.monthly_remaining;

  // Check if free user has hit limits
  const freeUserDailyLimitHit = isFreeUser && usage.daily_count >= 3;
  const freeUserMonthlyLimitHit = isFreeUser && usage.monthly_count >= 90;
  const freeUserLimitHit = freeUserDailyLimitHit || freeUserMonthlyLimitHit;

  return (
    <Card className="bg-chart-card border-gray-700 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${tierColors[currentTier as keyof typeof tierColors]} flex items-center justify-center text-white`}>
              {tierIcons[currentTier as keyof typeof tierIcons]}
            </div>
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
            {isFreeUser && (
              <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500">
                3/day • 90/month
              </Badge>
            )}
          </CardTitle>
          {currentTier === 'free' && (
            <Button 
              size="sm" 
              onClick={() => navigate('/pricing')}
              className="text-xs"
            >
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Daily Usage</span>
            <span className={`${freeUserDailyLimitHit ? 'text-red-400 font-bold' : 'text-white'}`}>
              {usage.daily_count}/{displayDailyLimit}
            </span>
          </div>
          <Progress 
            value={(usage.daily_count / displayDailyLimit) * 100} 
            className="h-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {freeUserDailyLimitHit ? (
              <span className="text-red-400 font-medium">
                Daily limit reached! Wait until tomorrow or upgrade.
              </span>
            ) : (
              `${displayDailyRemaining} analyses remaining today`
            )}
          </p>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Monthly Usage</span>
            <span className={`${freeUserMonthlyLimitHit ? 'text-red-400 font-bold' : 'text-white'}`}>
              {usage.monthly_count}/{displayMonthlyLimit}
            </span>
          </div>
          <Progress 
            value={(usage.monthly_count / displayMonthlyLimit) * 100} 
            className="h-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {freeUserMonthlyLimitHit ? (
              <span className="text-red-400 font-medium">
                Monthly limit reached! Upgrade for unlimited monthly analyses.
              </span>
            ) : (
              `${displayMonthlyRemaining} analyses remaining this month`
            )}
          </p>
        </div>

        {freeUserLimitHit && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm font-medium mb-2">
              🚫 Free Plan Limit Reached
            </p>
            <p className="text-red-300 text-xs mb-3">
              {freeUserDailyLimitHit && !freeUserMonthlyLimitHit && 
                "You've used all 3 daily analyses. Wait until tomorrow or upgrade for more."
              }
              {freeUserMonthlyLimitHit && 
                "You've used all 90 monthly analyses. Upgrade for unlimited monthly analyses."
              }
            </p>
            <Button 
              size="sm" 
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => navigate('/pricing')}
            >
              Upgrade to Continue Analyzing
            </Button>
          </div>
        )}

        {isFreeUser && !freeUserLimitHit && (
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              <strong>Free Plan:</strong> {displayDailyRemaining} analyses left today, {displayMonthlyRemaining} left this month.
            </p>
            {displayDailyRemaining === 0 && displayMonthlyRemaining > 0 && (
              <p className="text-yellow-400 text-xs mt-1">
                Daily limit reached. Resets tomorrow at midnight.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageDisplay;
