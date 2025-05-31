
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

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  usage: UsageData | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  checkUsageLimits: () => Promise<UsageData | null>;
  incrementUsage: () => Promise<UsageData | null>;
  createCheckout: (plan: 'starter' | 'pro') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error in refreshSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUsageLimits = async (): Promise<UsageData | null> => {
    if (!user) return null;

    try {
      console.log('Checking usage limits for user:', user.id);
      
      const { data, error } = await supabase.rpc('check_usage_limits', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error checking usage limits:', error);
        return null;
      }

      console.log('Usage limits response:', data);
      
      // Type cast the Json response to UsageData via unknown
      const usageData = data as unknown as UsageData;
      
      // Ensure strict enforcement for free users (3 daily, 90 monthly)
      const correctedUsageData = {
        ...usageData,
        // For free users, enforce strict limits
        daily_limit: usageData.subscription_tier === 'free' ? 3 : usageData.daily_limit,
        monthly_limit: usageData.subscription_tier === 'free' ? 90 : usageData.monthly_limit,
        daily_remaining: usageData.subscription_tier === 'free' ? 
          Math.max(0, 3 - usageData.daily_count) : 
          Math.max(0, usageData.daily_limit - usageData.daily_count),
        monthly_remaining: usageData.subscription_tier === 'free' ? 
          Math.max(0, 90 - usageData.monthly_count) : 
          Math.max(0, usageData.monthly_limit - usageData.monthly_count),
        // Free users: strict enforcement - no analysis if daily >= 3 OR monthly >= 90
        can_analyze: usageData.subscription_tier === 'free' ? 
          (usageData.daily_count < 3 && usageData.monthly_count < 90) :
          (usageData.daily_count < usageData.daily_limit && usageData.monthly_count < usageData.monthly_limit)
      };
      
      console.log('Corrected usage data with strict free user limits:', correctedUsageData);
      setUsage(correctedUsageData);
      return correctedUsageData;
    } catch (error) {
      console.error('Error in checkUsageLimits:', error);
      return null;
    }
  };

  const incrementUsage = async (): Promise<UsageData | null> => {
    if (!user) return null;

    try {
      console.log('Incrementing usage for user:', user.id);
      
      const { data, error } = await supabase.rpc('increment_usage_count', {
        p_user_id: user.id,
        p_email: user.email
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        return null;
      }

      console.log('Usage increment response:', data);
      
      // Type cast the Json response to UsageData via unknown
      const usageData = data as unknown as UsageData;
      
      // Ensure strict enforcement after increment for free users
      const correctedUsageData = {
        ...usageData,
        // For free users, enforce strict limits
        daily_limit: usageData.subscription_tier === 'free' ? 3 : usageData.daily_limit,
        monthly_limit: usageData.subscription_tier === 'free' ? 90 : usageData.monthly_limit,
        daily_remaining: usageData.subscription_tier === 'free' ? 
          Math.max(0, 3 - usageData.daily_count) : 
          Math.max(0, usageData.daily_limit - usageData.daily_count),
        monthly_remaining: usageData.subscription_tier === 'free' ? 
          Math.max(0, 90 - usageData.monthly_count) : 
          Math.max(0, usageData.monthly_limit - usageData.monthly_count),
        // Free users: strict enforcement after increment
        can_analyze: usageData.subscription_tier === 'free' ? 
          (usageData.daily_count < 3 && usageData.monthly_count < 90) :
          (usageData.daily_count < usageData.daily_limit && usageData.monthly_count < usageData.monthly_limit)
      };
      
      setUsage(correctedUsageData);
      return correctedUsageData;
    } catch (error) {
      console.error('Error in incrementUsage:', error);
      return null;
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

  useEffect(() => {
    if (user) {
      console.log('User logged in, checking subscription and usage');
      refreshSubscription();
      checkUsageLimits();
    } else {
      console.log('No user, clearing subscription and usage data');
      setSubscription(null);
      setUsage(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      usage,
      loading,
      refreshSubscription,
      checkUsageLimits,
      incrementUsage,
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
