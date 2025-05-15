
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartCandlestick, BarChart2, TrendingUp, History, Award, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const handleGetStartedClick = () => {
    if (user) {
      navigate('/analyze');
    } else {
      navigate('/auth');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-chart-bg">
      <Header />
      
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="py-12 md:py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
              <div className="w-full md:w-1/2 space-y-6">
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                  AI-Powered Forex <span className="text-primary">Chart Analysis</span> at Your Fingertips
                </h1>
                <p className="text-lg text-gray-300">
                  Upload your forex charts and get instant, professional-level technical analysis with precise entry points, stop losses, and profit targets.
                </p>
                <div className="pt-4">
                  <Button onClick={handleGetStartedClick} size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium text-lg">
                    Get Started
                  </Button>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 md:py-20 px-4 bg-black/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Powerful Analysis Features
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Our AI trading assistant analyzes your charts with professional precision to identify key patterns and opportunities.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <FeatureCard icon={<ChartCandlestick className="h-10 w-10 text-primary" />} title="Pattern Recognition" description="Automatically detects chart patterns like head and shoulders, double tops, flags, and more." />
              <FeatureCard icon={<BarChart2 className="h-10 w-10 text-primary" />} title="Support & Resistance" description="Identifies key support and resistance levels with precision to optimize your entries and exits." />
              <FeatureCard icon={<TrendingUp className="h-10 w-10 text-primary" />} title="Trend Analysis" description="Determines the overall trend direction and strength to keep you trading with the momentum." />
              <FeatureCard icon={<Zap className="h-10 w-10 text-primary" />} title="Entry & Exit Points" description="Get precise entry triggers, stop loss levels, and multiple take profit targets for each setup." />
              <FeatureCard icon={<Award className="h-10 w-10 text-primary" />} title="Risk Assessment" description="Each analysis includes risk-reward ratios and confidence scores to prioritize the best trades." />
              <FeatureCard icon={<History className="h-10 w-10 text-primary" />} title="Analysis History" description="Save all your chart analyses to track performance and review previous setups." />
            </div>
            
            <div className="mt-12 text-center">
              <Button onClick={handleGetStartedClick} className="bg-primary hover:bg-primary/90 text-white font-medium">
                Analyze Your Chart Now
              </Button>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 md:p-10 border border-gray-700 shadow-lg">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Ready to elevate your trading decisions?
                </h2>
                <p className="text-gray-300 md:text-lg max-w-2xl mx-auto">
                  Stop guessing chart patterns and support levels. Let our AI provide you with professional-grade analysis in seconds.
                </p>
                <div className="pt-4">
                  <Button onClick={handleGetStartedClick} size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium">
                    Start Analyzing Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Card className="bg-chart-card border border-gray-800">
    <CardContent className="p-6 space-y-4">
      <div className="bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-gray-400">
        {description}
      </p>
    </CardContent>
  </Card>
);

export default HomePage;
