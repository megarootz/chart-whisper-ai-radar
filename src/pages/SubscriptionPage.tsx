
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';

const SubscriptionPage = () => {
  const isMobile = useIsMobile();
  const { subscription, usage, loading, createCheckout, openCustomerPortal, refreshSubscription } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    // Check for success/cancel parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
      toast({
        title: "Payment Successful!",
        description: "Your subscription has been activated. Please refresh to see updated limits.",
        variant: "default",
      });
      refreshSubscription();
    } else if (urlParams.get('canceled')) {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. You can try again anytime.",
        variant: "default",
      });
    }
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '$0',
      period: 'forever',
      icon: <Check className="h-6 w-6" />,
      features: [
        '3 analyses per day',
        '90 analyses per month',
        'Basic chart analysis',
        'Standard support'
      ],
      dailyLimit: 3,
      monthlyLimit: 90,
      color: 'bg-gray-500'
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '$9.99',
      period: 'month',
      icon: <Zap className="h-6 w-6" />,
      features: [
        '15 analyses per day',
        '450 analyses per month',
        'Advanced chart analysis',
        'Priority support',
        'Export analysis reports'
      ],
      dailyLimit: 15,
      monthlyLimit: 450,
      color: 'bg-blue-500'
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$18.99',
      period: 'month',
      icon: <Crown className="h-6 w-6" />,
      features: [
        '30 analyses per day',
        '900 analyses per month',
        'Premium chart analysis',
        'VIP support',
        'Advanced export options',
        'API access'
      ],
      dailyLimit: 30,
      monthlyLimit: 900,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      popular: true
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') return;
    if (planId === 'starter' || planId === 'pro') {
      await createCheckout(planId as 'starter' | 'pro');
    }
  };

  const currentTier = subscription?.subscription_tier || 'free';

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow pt-20 ${isMobile ? 'px-3 pb-20' : 'py-6 px-6 pb-24'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
        <div className={`${isMobile ? 'w-full' : 'container mx-auto max-w-6xl'}`}>
          <div className={`mb-6 text-center ${isMobile ? 'px-1' : 'px-0'}`}>
            <h1 
              className="text-2xl md:text-3xl font-bold text-white mb-2" 
              style={{ color: '#ffffff', fontWeight: 'bold' }}
            >
              Choose Your Plan
            </h1>
            <p 
              className="text-gray-400 text-base md:text-lg"
              style={{ color: '#9ca3af' }}
            >
              Unlock more analyses with our subscription plans
            </p>
          </div>

          {/* Current Usage Display */}
          {usage && (
            <div className={`mb-6 ${isMobile ? 'mx-0' : 'mx-0'}`}>
              <Card className="bg-chart-card border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Current Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Daily: {usage.daily_count}/{usage.daily_limit}</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min((usage.daily_count / usage.daily_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400">Monthly: {usage.monthly_count}/{usage.monthly_limit}</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min((usage.monthly_count / usage.monthly_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Plans Grid */}
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'} mb-8`}>
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`bg-chart-card border-gray-700 relative ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                } ${currentTier === plan.id ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                {currentTier === plan.id && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500 text-white">Current Plan</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 mx-auto rounded-full ${plan.color} flex items-center justify-center text-white mb-3`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-white">
                    {plan.price}
                    {plan.period !== 'forever' && (
                      <span className="text-sm text-gray-400">/{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full"
                    variant={currentTier === plan.id ? "secondary" : "default"}
                    disabled={currentTier === plan.id && plan.id !== 'free'}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {currentTier === plan.id 
                      ? 'Current Plan' 
                      : plan.id === 'free' 
                        ? 'Free Forever' 
                        : 'Subscribe Now'
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Manage Subscription Button */}
          {subscription?.subscribed && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={openCustomerPortal}
                className="text-white border-gray-700 hover:bg-gray-800"
              >
                Manage Subscription
              </Button>
            </div>
          )}
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default SubscriptionPage;
