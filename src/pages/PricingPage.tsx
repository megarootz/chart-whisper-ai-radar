
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Crown, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { createCheckout } = useSubscription();
  const navigate = useNavigate();

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

  const plans = [
    {
      name: 'Free Plan',
      price: '$0',
      period: 'forever',
      icon: <Check className="h-5 w-5" />,
      features: [
        '3 analyses per day',
        '90 analyses per month',
        'Basic chart analysis',
        'Standard support'
      ],
      color: 'bg-gray-500',
      buttonText: user ? 'Current Plan' : 'Get Started',
      buttonAction: () => handleGetStarted(),
      disabled: false
    },
    {
      name: 'Starter Plan',
      price: '$9.99',
      period: 'month',
      icon: <Zap className="h-5 w-5" />,
      features: [
        '15 analyses per day',
        '450 analyses per month',
        'Advanced chart analysis',
        'Priority support',
        'Export analysis reports'
      ],
      color: 'bg-blue-500',
      popular: true,
      buttonText: 'Upgrade to Starter',
      buttonAction: () => handleUpgrade('starter'),
      disabled: false
    },
    {
      name: 'Pro Plan',
      price: '$18.99',
      period: 'month',
      icon: <Crown className="h-5 w-5" />,
      features: [
        '30 analyses per day',
        '900 analyses per month',
        'Premium chart analysis',
        'VIP support',
        'Advanced export options',
        'API access'
      ],
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      buttonText: 'Upgrade to Pro',
      buttonAction: () => handleUpgrade('pro'),
      disabled: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-chart-bg w-full max-w-full overflow-x-hidden">
      <Header />
      
      <main className={`flex-grow flex flex-col w-full max-w-full overflow-x-hidden ${isMobile ? 'pt-20 px-3 pb-20' : 'pt-24 px-4 pb-24'}`}>
        <div className="container mx-auto max-w-6xl w-full overflow-x-hidden">
          <div className="text-center mb-8 md:mb-12">
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold text-white mb-3 md:mb-4`}>
              Choose Your Plan
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-2">
              Start free and upgrade as you need more analyses. All plans include our AI-powered chart analysis.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`bg-chart-card border-gray-700 relative ${
                  plan.popular ? 'ring-2 ring-primary scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
                  <div className={`w-10 h-10 mx-auto rounded-full ${plan.color} flex items-center justify-center text-white mb-3`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-white text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="text-2xl font-bold text-white mb-4">
                    {plan.price}
                    {plan.period !== 'forever' && (
                      <span className="text-sm text-gray-400">/{plan.period}</span>
                    )}
                  </div>
                  
                  <ul className="space-y-2 mb-6 text-left">
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
                      plan.name === 'Free Plan' 
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
