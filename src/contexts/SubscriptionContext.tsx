
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

  const getActualUsageCounts = async (): Promise<{ dailyCount: number; monthlyCount: number }> => {
    if (!user) return { dailyCount: 0, monthlyCount: 0 };

    try {
      // Get today's date in UTC
      const today = new Date().toISOString().split('T')[0];
      
      // Get this month's start and end dates
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth(); // 0-indexed
      
      // First day of current month
      const monthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
      // First day of next month (to use as exclusive end)
      const monthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 1));

      console.log('📅 Date range calculation:', {
        today,
        currentYear,
        currentMonth: currentMonth + 1, // Display as 1-indexed
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString()
      });

      // Count actual analyses from chart_analyses table for today
      const { data: dailyAnalyses, error: dailyError } = await supabase
        .from('chart_analyses')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (dailyError) {
        console.error('❌ Error fetching daily analyses:', dailyError);
        return { dailyCount: 0, monthlyCount: 0 };
      }

      // Count actual analyses from chart_analyses table for this month
      const { data: monthlyAnalyses, error: monthlyError } = await supabase
        .from('chart_analyses')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString());

      if (monthlyError) {
        console.error('❌ Error fetching monthly analyses:', monthlyError);
        return { dailyCount: dailyAnalyses?.length || 0, monthlyCount: 0 };
      }

      const actualDailyCount = dailyAnalyses?.length || 0;
      const actualMonthlyCount = monthlyAnalyses?.length || 0;

      console.log('📊 ACTUAL usage counts from chart_analyses:', {
        daily: actualDailyCount,
        monthly: actualMonthlyCount,
        today,
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
        dailyAnalyses: dailyAnalyses?.map(a => a.id),
        monthlyAnalyses: monthlyAnalyses?.map(a => a.id)
      });

      return { 
        dailyCount: actualDailyCount, 
        monthlyCount: actualMonthlyCount 
      };
    } catch (error) {
      console.error('❌ Error getting actual usage counts:', error);
      return { dailyCount: 0, monthlyCount: 0 };
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
      
      // Get actual usage counts from chart_analyses table
      const { dailyCount: actualDailyCount, monthlyCount: actualMonthlyCount } = await getActualUsageCounts();
      
      // Get subscription tier and limits
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscribers')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) {
        console.error('❌ Error fetching subscription:', subError);
      }

      const subscriptionTier = subscriptionData?.subscription_tier || 'free';
      
      // Set limits based on subscription tier
      let dailyLimit: number;
      let monthlyLimit: number;
      
      switch (subscriptionTier) {
        case 'starter':
          dailyLimit = 15;
          monthlyLimit = 450;
          break;
        case 'pro':
          dailyLimit = 30;
          monthlyLimit = 900;
          break;
        default: // 'free'
          dailyLimit = 3;
          monthlyLimit = 90;
      }

      // Calculate remaining counts
      const dailyRemaining = Math.max(0, dailyLimit - actualDailyCount);
      const monthlyRemaining = Math.max(0, monthlyLimit - actualMonthlyCount);
      
      // Determine if user can analyze (both daily and monthly limits must allow)
      const canAnalyze = (actualDailyCount < dailyLimit) && (actualMonthlyCount < monthlyLimit);
      
      console.log('📊 CORRECTED usage data:', {
        actual_daily_count: actualDailyCount,
        actual_monthly_count: actualMonthlyCount,
        daily_limit: dailyLimit,
        monthly_limit: monthlyLimit,
        subscription_tier: subscriptionTier,
        can_analyze: canAnalyze,
        daily_remaining: dailyRemaining,
        monthly_remaining: monthlyRemaining
      });

      const correctedUsageData: UsageData = {
        daily_count: actualDailyCount,
        monthly_count: actualMonthlyCount,
        daily_limit: dailyLimit,
        monthly_limit: monthlyLimit,
        subscription_tier: subscriptionTier,
        daily_remaining: dailyRemaining,
        monthly_remaining: monthlyRemaining,
        can_analyze: canAnalyze
      };
      
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
      
      // After incrementing, get the actual corrected usage data
      const correctedUsageData = await checkUsageLimits();
      
      console.log('✅ USAGE SUCCESSFULLY INCREMENTED and corrected:', correctedUsageData);
      
      // Refresh server time after incrementing usage
      await refreshServerTime();
      
      return correctedUsageData;
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
