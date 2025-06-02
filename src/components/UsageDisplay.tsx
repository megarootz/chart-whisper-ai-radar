
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import ResetCountdown from './ResetCountdown';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const UsageDisplay = () => {
  const { usage, subscription, serverTime } = useSubscription();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Debug function to check raw database data
  const debugUsageData = async () => {
    if (!user) return;
    
    console.log('🔍 DEBUGGING: Checking raw database usage data...');
    
    // Check today's usage directly from database
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData, error: todayError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);
    
    console.log('🔍 Today\'s usage data from usage_tracking table:', todayData, 'Error:', todayError);
    
    // Check actual analyses from chart_analyses table for today
    const { data: todayAnalyses, error: analysesError } = await supabase
      .from('chart_analyses')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);
    
    console.log('🔍 Today\'s actual analyses from chart_analyses table:', todayAnalyses, 'Error:', analysesError);
    console.log('🔍 Actual daily count from analyses:', todayAnalyses?.length || 0);
    
    // Check subscription data
    const { data: subData, error: subError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('🔍 Subscription data from DB:', subData, 'Error:', subError);
    
    // Check all usage data for this month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: monthData, error: monthError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .ilike('month_year', `${currentMonth}%`);
    
    console.log('🔍 This month\'s usage data from usage_tracking table:', monthData, 'Error:', monthError);
    
    // Check all analyses for this month
    const { data: monthAnalyses, error: monthAnalysesError } = await supabase
      .from('chart_analyses')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${currentMonth}-01T00:00:00.000Z`)
      .lt('created_at', `${currentMonth}-31T23:59:59.999Z`);
    
    console.log('🔍 This month\'s actual analyses from chart_analyses table:', monthAnalyses, 'Error:', monthAnalysesError);
    console.log('🔍 Actual monthly count from analyses:', monthAnalyses?.length || 0);
  };

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

  return (
    <div className="bg-chart-card border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Usage Statistics</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {usage.subscription_tier.charAt(0).toUpperCase() + usage.subscription_tier.slice(1)}
          </Badge>
          <button
            onClick={debugUsageData}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Debug DB
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="text-xs text-yellow-400 bg-gray-800 p-2 rounded">
        Debug: Daily {usage.daily_count}/{usage.daily_limit} | Monthly {usage.monthly_count}/{usage.monthly_limit} | Can analyze: {usage.can_analyze ? 'YES' : 'NO'} | Remaining: {usage.daily_remaining}
      </div>

      {/* Current Server Time for Usage Limits */}
      {serverTime && (
        <div className="text-xs text-gray-400 border-b border-gray-700 pb-2">
          Usage tracking time: {format(new Date(serverTime.current_utc_time), 'MMM d, yyyy h:mm:ss a')} UTC
        </div>
      )}

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
