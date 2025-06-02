import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: 'free' | 'starter' | 'pro';
  subscription_end: string | null;
}

interface UsageData {
  daily_count: number;
  monthly_count: number;
  daily_limit: number;
  monthly_limit: number;
  daily_remaining: number;
  monthly_remaining: number;
  can_analyze: boolean;
  subscription_tier: string;
}

interface ServerTimeData {
  current_utc_time: string;
  next_reset_utc: string;
  time_until_reset_ms: number;
  time_until_reset: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  current_date_utc: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  usage: UsageData | null;
  serverTime: ServerTimeData | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  checkUsageLimits: () => Promise<UsageData | null>;
  incrementUsage: () => Promise<UsageData | null>;
  refreshServerTime: () => Promise<void>;
  createCheckout: (plan: 'starter' | 'pro') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [serverTime, setServerTime] = useState<ServerTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const refreshServerTime = async () => {
    try {
      console.log('⏰ Fetching server time...');
      const { data, error } = await supabase.functions.invoke('get-server-time');
      
      if (error) {
        console.error('❌ Error fetching server time:', error);
        return;
      }

      console.log('⏰ Server time response:', data);
      setServerTime(data);
    } catch (error) {
      console.error('❌ Error in refreshServerTime:', error);
    }
  };

  const refreshSubscription = async () => {
    if (!user) {
      console.log('👤 No user, clearing subscription data');
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('💳 Checking subscription for user:', user.id);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('❌ Error checking subscription:', error);
        return;
      }

      console.log('💳 Subscription data:', data);
      setSubscription(data);
    } catch (error) {
      console.error('❌ Error in refreshSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUsageLimits = async (): Promise<UsageData | null> => {
    if (!user) {
      console.log('❌ No user logged in for usage check');
      return null;
    }

    try {
      console.log('📊 Checking usage limits for user:', user.id, 'email:', user.email);
      
      // Verify user session is still valid
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        console.error('❌ User session invalid:', authError);
        return null;
      }
      
      // CRITICAL FIX: Let's also get direct count from usage_tracking table to verify
      const today = new Date().toISOString().split('T')[0];
      const { data: directUsageData, error: directError } = await supabase
        .from('usage_tracking')
        .select('daily_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (directError) {
        console.error('❌ Error getting direct usage data:', directError);
      } else {
        console.log('📊 Direct usage data from table:', directUsageData);
      }
      
      const { data, error } = await supabase.rpc('check_usage_limits', {
        p_user_id: user.id
      });

      if (error) {
        console.error('❌ Error checking usage limits:', error);
        console.error('❌ Error details:', error.message, error.code, error.details);
        return null;
      }

      console.log('📊 Raw RPC usage limits response:', data);
      
      // Type cast the Json response to UsageData via unknown
      const usageData = data as unknown as UsageData;
      
      console.log('📊 Parsed usage data:', {
        daily_count: usageData.daily_count,
        daily_limit: usageData.daily_limit,
        monthly_count: usageData.monthly_count,
        monthly_limit: usageData.monthly_limit,
        can_analyze: usageData.can_analyze,
        subscription_tier: usageData.subscription_tier,
        daily_remaining: usageData.daily_remaining,
        monthly_remaining: usageData.monthly_remaining
      });

      // CRITICAL FIX: Double-check the can_analyze logic
      const actualCanAnalyze = (usageData.daily_count < usageData.daily_limit) && 
                              (usageData.monthly_count < usageData.monthly_limit);
      
      console.log('📊 Can analyze calculation check:', {
        daily_check: `${usageData.daily_count} < ${usageData.daily_limit} = ${usageData.daily_count < usageData.daily_limit}`,
        monthly_check: `${usageData.monthly_count} < ${usageData.monthly_limit} = ${usageData.monthly_count < usageData.monthly_limit}`,
        final_result: actualCanAnalyze,
        rpc_returned: usageData.can_analyze
      });

      // Override the can_analyze if there's a discrepancy
      const correctedUsageData = {
        ...usageData,
        can_analyze: actualCanAnalyze
      };

      if (actualCanAnalyze !== usageData.can_analyze) {
        console.log('⚠️ CORRECTING can_analyze value from', usageData.can_analyze, 'to', actualCanAnalyze);
      }
      
      setUsage(correctedUsageData);
      
      // Refresh server time when checking usage to keep countdown accurate
      await refreshServerTime();
      
      return correctedUsageData;
    } catch (error) {
      console.error('❌ Error in checkUsageLimits:', error);
      return null;
    }
  };

  const incrementUsage = async (): Promise<UsageData | null> => {
    if (!user) {
      console.error('❌ CRITICAL: No user logged in for usage increment');
      return null;
    }

    try {
      console.log('📈 STARTING USAGE INCREMENT - User:', user.id, 'Email:', user.email);
      
      // CRITICAL: Verify user session is still valid before incrementing
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        console.error('❌ CRITICAL: User session invalid during increment:', authError);
        throw new Error('User session expired. Please sign in again.');
      }
      
      if (currentUser.id !== user.id) {
        console.error('❌ CRITICAL: User ID mismatch during increment');
        throw new Error('User session mismatch. Please sign in again.');
      }
      
      console.log('✅ User session verified, proceeding with increment');
      
      // Call the RPC function with explicit parameters
      const { data, error } = await supabase.rpc('increment_usage_count', {
        p_user_id: user.id,
        p_email: user.email || ''
      });

      if (error) {
        console.error('❌ RPC Error incrementing usage:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Try to provide more context about the error
        if (error.message.includes('unique constraint')) {
          console.error('❌ Unique constraint violation - possible duplicate entry for today');
        }
        
        throw new Error(`Failed to increment usage: ${error.message}`);
      }

      console.log('📈 Raw usage increment response:', data);
      
      if (!data) {
        console.error('❌ incrementUsage returned null data');
        throw new Error('No data returned from increment_usage_count');
      }
      
      // Type cast the Json response to UsageData via unknown
      const usageData = data as unknown as UsageData;
      
      console.log('✅ USAGE SUCCESSFULLY INCREMENTED:', {
        before_daily: usageData.daily_count - 1,
        after_daily: usageData.daily_count,
        monthly: usageData.monthly_count,
        tier: usageData.subscription_tier,
        can_analyze: usageData.can_analyze,
        user_id: user.id,
        email: user.email
      });
      
      setUsage(usageData);
      
      // Refresh server time after incrementing usage
      await refreshServerTime();
      
      return usageData;
    } catch (error) {
      console.error('❌ CRITICAL Error in incrementUsage:', error);
      
      // Additional debugging information
      console.error('❌ User context:', {
        user_id: user?.id,
        user_email: user?.email,
        user_object: user
      });
      
      throw error; // Re-throw to let the caller handle it
    }
  };

  const createCheckout = async (plan: 'starter' | 'pro') => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Auto-refresh usage data every minute to catch daily resets
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkUsageLimits();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  // Initialize data when user logs in
  useEffect(() => {
    if (user) {
      console.log('👤 User logged in, checking subscription, usage, and server time');
      refreshSubscription();
      checkUsageLimits();
      refreshServerTime();
    } else {
      console.log('👤 No user, clearing subscription, usage, and server time data');
      setSubscription(null);
      setUsage(null);
      setServerTime(null);
      setLoading(false);
    }
  }, [user]);

  // Refresh server time every 10 seconds to keep countdown accurate
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshServerTime();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      usage,
      serverTime,
      loading,
      refreshSubscription,
      checkUsageLimits,
      incrementUsage,
      refreshServerTime,
      createCheckout,
      openCustomerPortal,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
