
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Brain } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const PricingPage = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { subscription, usage, loading, createCheckout, openCustomerPortal, refreshSubscription, checkUsageLimits } = useSubscription();
  const navigate = useNavigate();
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

  // Force refresh usage data when component mounts to ensure latest data
  useEffect(() => {
    if (user) {
      checkUsageLimits();
    }
  }, [user]);

  const handleGetStarted = () => {
    if (!user) {
      navigate('/auth');
    }
  };

  const handleUpgrade = async (plan: 'starter' | 'pro') => {
    if (!user) {
      navigate('/auth');
      return;
    }
    await createCheckout(plan);
  };

  // Show loading state while subscription data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-chart-bg w-full max-w-full overflow-x-hidden">
        <Header />
        
        <main className={`flex-grow flex flex-col w-full max-w-full overflow-x-hidden ${isMobile ? 'pt-20 px-3 pb-20' : 'pt-24 px-4 pb-24'}`}>
          <div className="container mx-auto max-w-6xl w-full overflow-x-hidden">
            <div className="text-center mb-8">
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold text-white mb-3`}>
                Choose Your Plan
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-2">
                Unlock more deep analyses with our subscription plans
              </p>
            </div>

            {/* Loading Current Usage Section */}
            {user && (
              <div className="mb-8">
                <Card className="bg-chart-card border-gray-700 max-w-2xl mx-auto">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg text-center">Current Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Daily</span>
                          <div className="h-4 w-16 bg-gray-600 animate-pulse rounded"></div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gray-600 h-2 rounded-full animate-pulse w-1/2"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Monthly</span>
                          <div className="h-4 w-16 bg-gray-600 animate-pulse rounded"></div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gray-600 h-2 rounded-full animate-pulse w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Loading Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
              {[1, 2, 3].map((index) => (
                <Card key={index} className="bg-chart-card border-gray-700 relative">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-600 animate-pulse mb-3"></div>
                    <div className="h-6 w-32 bg-gray-600 animate-pulse rounded mx-auto mb-2"></div>
                    <div className="h-8 w-24 bg-gray-600 animate-pulse rounded mx-auto"></div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      {[1, 2, 3, 4].map((featureIndex) => (
                        <div key={featureIndex} className="flex items-center">
                          <div className="h-4 w-4 bg-gray-600 animate-pulse rounded mr-2"></div>
                          <div className="h-4 w-full bg-gray-600 animate-pulse rounded"></div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="w-full h-10 bg-gray-600 animate-pulse rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center text-gray-400 text-sm">
              <p>All plans include secure payment processing and can be cancelled anytime.</p>
            </div>
          </div>
        </main>
        
        {!isMobile && <Footer />}
      </div>
    );
  }

  const currentTier = subscription?.subscription_tier || 'free';

  const plans = [
    {
      name: 'Free Plan',
      price: '$0',
      period: '',
      icon: <Check className="h-6 w-6" />,
      features: [
        '1 deep analysis per day',
        '30 deep analyses per month',
        'Basic historical analysis',
        'Standard support'
      ],
      color: 'bg-gray-500',
      buttonText: user ? 'Free Forever' : 'Get Started',
      buttonAction: () => handleGetStarted(),
      disabled: false,
      current: currentTier === 'free'
    },
    {
      name: 'Starter Plan',
      price: '$9.99',
      period: '/month',
      icon: <Brain className="h-6 w-6" />,
      features: [
        '5 deep analyses per day',
        '150 deep analyses per month',
        'Advanced historical analysis',
        'Priority support',
        'Export analysis reports'
      ],
      color: 'bg-blue-500',
      popular: true,
      buttonText: currentTier === 'starter' ? 'Current Plan' : 'Subscribe Now',
      buttonAction: () => handleUpgrade('starter'),
      disabled: currentTier === 'starter',
      current: currentTier === 'starter'
    },
    {
      name: 'Pro Plan',
      price: '$18.99',
      period: '/month',
      icon: <Crown className="h-6 w-6" />,
      features: [
        '15 deep analyses per day',
        '450 deep analyses per month',
        'Premium historical analysis',
        'VIP support',
        'Advanced export options',
        'API access'
      ],
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      buttonText: currentTier === 'pro' ? 'Current Plan' : 'Subscribe Now',
      buttonAction: () => handleUpgrade('pro'),
      disabled: currentTier === 'pro',
      current: currentTier === 'pro'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-chart-bg w-full max-w-full overflow-x-hidden">
      <Header />
      
      <main className={`flex-grow flex flex-col w-full max-w-full overflow-x-hidden ${isMobile ? 'pt-20 px-3 pb-20' : 'pt-24 px-4 pb-24'}`}>
        <div className="container mx-auto max-w-6xl w-full overflow-x-hidden">
          <div className="text-center mb-8">
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold text-white mb-3`}>
              Choose Your Plan
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-2">
              Unlock more deep analyses with our subscription plans
            </p>
          </div>

          {/* Current Usage Section */}
          {usage && user && (
            <div className="mb-8">
              <Card className="bg-chart-card border-gray-700 max-w-2xl mx-auto">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg text-center">Current Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Daily</span>
                        <span className="text-white">{usage.deep_analysis_daily_count}/{usage.deep_analysis_daily_limit}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min((usage.deep_analysis_daily_count / usage.deep_analysis_daily_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Monthly</span>
                        <span className="text-white">{usage.deep_analysis_monthly_count}/{usage.deep_analysis_monthly_limit}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min((usage.deep_analysis_monthly_count / usage.deep_analysis_monthly_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`bg-chart-card border-gray-700 relative transition-all duration-200 hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                } ${plan.current ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {plan.current && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 mx-auto rounded-full ${plan.color} flex items-center justify-center text-white mb-3`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-white text-xl mb-2">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-white">
                    {plan.price}
                    {plan.period && (
                      <span className="text-sm text-gray-400">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-300 text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={plan.buttonAction}
                    disabled={plan.disabled}
                    className={`w-full ${
                      plan.current 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : plan.name === 'Free Plan'
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center text-gray-400 text-sm">
            <p>All plans include secure payment processing and can be cancelled anytime.</p>
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default PricingPage;
