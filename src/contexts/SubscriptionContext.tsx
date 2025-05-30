
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
      setUsage(usageData);
      return usageData;
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
      setUsage(usageData);
      return usageData;
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
