
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

const UsageDebug = () => {
  const { usage, checkUsageLimits } = useSubscription();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const resetUsage = async () => {
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-usage');
      
      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Daily usage has been reset",
      });

      // Refresh usage data
      await checkUsageLimits();
    } catch (error) {
      console.error('Error resetting usage:', error);
      toast({
        title: "Error",
        description: "Failed to reset usage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const getDebugInfo = async () => {
    try {
      const { data, error } = await supabase.rpc('check_usage_limits', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (error) {
        console.error('Debug error:', error);
      } else {
        setDebugInfo(data);
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return (
    <Card className="bg-chart-card border-gray-700 mt-4">
      <CardHeader>
        <CardTitle className="text-white text-sm">Usage Debug (Development Only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            size="sm" 
            variant="outline"
            onClick={resetUsage}
            disabled={isResetting}
            className="text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
            Reset Daily Usage
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={getDebugInfo}
            className="text-xs"
          >
            Get Debug Info
          </Button>
        </div>
        
        {usage && (
          <div className="text-xs text-gray-400 space-y-1">
            <div>Current: {usage.daily_count}/{usage.daily_limit} daily</div>
            <div>Monthly: {usage.monthly_count}/{usage.monthly_limit}</div>
            <div>Can Analyze: {usage.can_analyze ? 'Yes' : 'No'}</div>
            <div>Tier: {usage.subscription_tier}</div>
          </div>
        )}
        
        {debugInfo && (
          <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageDebug;
