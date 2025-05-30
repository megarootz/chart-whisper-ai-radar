
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsageDisplay = () => {
  const { subscription, usage } = useSubscription();
  const navigate = useNavigate();

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

  return (
    <Card className="bg-chart-card border-gray-700 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${tierColors[currentTier as keyof typeof tierColors]} flex items-center justify-center text-white`}>
              {tierIcons[currentTier as keyof typeof tierIcons]}
            </div>
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
          </CardTitle>
          {currentTier === 'free' && (
            <Button 
              size="sm" 
              onClick={() => navigate('/subscription')}
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
            <span className="text-white">{usage.daily_count}/{usage.daily_limit}</span>
          </div>
          <Progress 
            value={(usage.daily_count / usage.daily_limit) * 100} 
            className="h-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {usage.daily_remaining} analyses remaining today
          </p>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Monthly Usage</span>
            <span className="text-white">{usage.monthly_count}/{usage.monthly_limit}</span>
          </div>
          <Progress 
            value={(usage.monthly_count / usage.monthly_limit) * 100} 
            className="h-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {usage.monthly_remaining} analyses remaining this month
          </p>
        </div>

        {!usage.can_analyze && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm font-medium">
              Usage limit reached. Upgrade your plan to continue analyzing charts.
            </p>
            <Button 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => navigate('/subscription')}
            >
              View Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageDisplay;
