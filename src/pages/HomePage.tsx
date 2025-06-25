
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartCandlestick, BarChart2, TrendingUp, History, Award, Brain } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TickmillBanner from '@/components/TickmillBanner';
import SpinningRadar from '@/components/SpinningRadar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { updatePageMeta, getPageSEOData } from '@/utils/seoUtils';

const HomePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  useEffect(() => {
    const seoData = getPageSEOData('/');
    updatePageMeta(seoData.title, seoData.description, seoData.url);
  }, []);

  const handleGetStartedClick = () => {
    if (user) {
      navigate('/analyze');
    } else {
      navigate('/auth');
    }
  };

  const handleViewPlansClick = () => {
    navigate('/pricing');
  };

  return (
    <div className="min-h-screen flex flex-col bg-chart-bg w-full max-w-full overflow-x-hidden">
      <Header />
      
      <main className={`flex-grow flex flex-col w-full max-w-full overflow-x-hidden ${isMobile ? 'pt-16' : 'pt-16'}`}>
        {/* Hero Section - Mobile first layout */}
        <section className={`${isMobile ? 'py-4 px-3' : 'py-12 md:py-24 px-4'} w-full max-w-full overflow-x-hidden`}>
          <div className="container mx-auto max-w-6xl w-full overflow-x-hidden">
            {isMobile ? 
              // Mobile layout: radar as background behind text
              <div className="relative flex flex-col items-center justify-center min-h-[50vh] w-full max-w-full overflow-hidden">
                {/* Background radar */}
                <SpinningRadar isBackground={true} />
                
                {/* Content overlay */}
                <div className="relative z-10 w-full space-y-4 text-center px-2 max-w-full">
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    ForexRadar7: Your ultimate <span className="text-primary">AI-Powered Deep Historical Analysis tool</span>
                  </h1>
                  <p className="text-base text-gray-300 max-w-sm mx-auto">
                    Analyze historical forex data using advanced AI techniques for comprehensive market insights.
                  </p>
                  <div className="pt-2">
                    <Button onClick={handleGetStartedClick} size="default" className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3">
                      Get Started
                    </Button>
                  </div>
                </div>
              </div> :
              // Desktop layout: side by side
              <div className="flex flex-col md:flex-row gap-6 md:gap-16 items-center w-full overflow-x-hidden">
                <div className="w-full md:w-1/2 space-y-4 md:space-y-6">
                  <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                    ForexRadar7: Your ultimate <span className="text-primary">AI-Powered Deep Historical Analysis tool</span>
                  </h1>
                  <p className="text-lg text-gray-300">
                    Analyze historical forex data using advanced AI techniques for comprehensive market insights.
                  </p>
                  <div className="pt-3 md:pt-4">
                    <Button onClick={handleGetStartedClick} size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium">
                      Get Started
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-1/2 flex justify-center items-center overflow-x-hidden">
                  <div className="w-full max-w-full overflow-x-hidden flex justify-center">
                    <SpinningRadar />
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

        {/* Banner Section */}
        <section className={`${isMobile ? 'px-3 pb-4' : 'px-4 pb-8'} w-full max-w-full overflow-x-hidden`}>
          <div className="container mx-auto max-w-6xl w-full overflow-x-hidden">
            <TickmillBanner />
          </div>
        </section>
        
        {/* Features Section */}
        <section className={`py-8 ${isMobile ? 'px-3' : 'py-12 md:py-20 px-4'} bg-black/30 w-full max-w-full overflow-x-hidden`}>
          <div className="container mx-auto max-w-6xl w-full overflow-x-hidden">
            <div className="text-center mb-8 md:mb-12">
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold text-white mb-3 md:mb-4`}>
                Powerful Deep Historical Analysis Features
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-2">
                Our AI analyzes historical forex data using advanced techniques to identify patterns and market opportunities.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <FeatureCard icon={<Brain className="h-8 w-8 md:h-10 md:w-10 text-primary" />} title="ICT Analysis" description="Inner Circle Trader methodology for identifying market structure and key levels." />
              <FeatureCard icon={<ChartCandlestick className="h-8 w-8 md:h-10 md:w-10 text-primary" />} title="Elliott Wave" description="Advanced Elliott Wave analysis to predict future market movements and cycles." />
              <FeatureCard icon={<BarChart2 className="h-8 w-8 md:h-10 md:w-10 text-primary" />} title="Support & Resistance" description="Identifies key support and resistance levels with precision across different timeframes." />
              <FeatureCard icon={<TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-primary" />} title="Fibonacci Analysis" description="Comprehensive Fibonacci retracement and extension analysis for optimal entry and exit points." />
              <FeatureCard icon={<Award className="h-8 w-8 md:h-10 md:w-10 text-primary" />} title="Volume Profile" description="Volume-based analysis to understand market participation and key price levels." />
              <FeatureCard icon={<History className="h-8 w-8 md:h-10 md:w-10 text-primary" />} title="Market Structure" description="Deep analysis of market structure including order blocks and fair value gaps." />
            </div>
            
            <div className="mt-8 md:mt-12 text-center">
              <Button onClick={handleGetStartedClick} className="bg-primary hover:bg-primary/90 text-white font-medium">
                Start Deep Analysis Now
              </Button>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className={`py-8 ${isMobile ? 'px-3 pb-16' : 'py-12 md:py-20 px-4'} w-full max-w-full overflow-x-hidden`}>
          <div className="container mx-auto max-w-4xl w-full overflow-x-hidden">
            
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
}) => {
  const isMobile = useIsMobile();
  return <Card className="bg-chart-card border border-gray-800">
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'} space-y-3 md:space-y-4`}>
        <div className="bg-gray-800/50 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-white`}>{title}</h3>
        <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      </CardContent>
    </Card>;
};

export default HomePage;
