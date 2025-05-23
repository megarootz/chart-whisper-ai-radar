
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartCandlestick, BarChart2, TrendingUp, History, Award, Zap, ArrowRight, Sparkles, Target, Shield } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-chart-bg via-gray-900 to-black overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <Header />
      
      <main className="flex-grow flex flex-col relative z-10">
        {/* Hero Section */}
        <section className={isMobile ? 'py-8 px-4 relative' : 'py-16 md:py-24 px-4 relative'}>
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-6 md:space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary font-medium animate-fade-in">
                <Sparkles className="w-4 h-4" />
                AI-Powered Trading Intelligence
              </div>
              
              {/* Main Headline */}
              <div className="space-y-4 animate-fade-in">
                <h1 className={isMobile ? 'text-3xl font-bold text-white leading-tight' : 'text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight'}>
                  Transform Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                    Trading Game
                  </span>
                </h1>
                <p className={isMobile ? 'text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed' : 'text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed'}>
                  Upload forex charts and receive instant, professional-grade technical analysis with precise entry points, stop losses, and profit targets powered by advanced AI.
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 animate-fade-in">
                <Button 
                  onClick={handleGetStartedClick}
                  size={isMobile ? "default" : "lg"}
                  className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white font-semibold px-8 py-3 rounded-full shadow-glow transition-all duration-300 hover:scale-105 group"
                >
                  Start Analyzing Now
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline"
                  size={isMobile ? "default" : "lg"}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3 rounded-full transition-all duration-300"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-12 max-w-2xl mx-auto">
                <div className="text-center space-y-2 animate-slide-in">
                  <div className="text-2xl md:text-3xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-gray-400">Accuracy Rate</div>
                </div>
                <div className="text-center space-y-2 animate-slide-in">
                  <div className="text-2xl md:text-3xl font-bold text-primary">&lt; 5s</div>
                  <div className="text-sm text-gray-400">Analysis Time</div>
                </div>
                <div className="text-center space-y-2 animate-slide-in col-span-2 md:col-span-1">
                  <div className="text-2xl md:text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-gray-400">Available</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className={isMobile ? 'py-12 px-4 bg-black/20 backdrop-blur-sm' : 'py-20 px-4 bg-black/20 backdrop-blur-sm'}>
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-800/50 rounded-full px-4 py-2 text-sm text-gray-300 mb-6">
                <Target className="w-4 h-4 text-primary" />
                Advanced Features
              </div>
              <h2 className={isMobile ? 'text-2xl font-bold text-white mb-4' : 'text-3xl md:text-4xl font-bold text-white mb-4'}>
                Professional Analysis at Your Fingertips
              </h2>
              <p className="text-gray-400 max-w-3xl mx-auto text-lg">
                Our cutting-edge AI analyzes your charts with institutional-grade precision, identifying opportunities that matter.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <FeatureCard 
                icon={<ChartCandlestick className="h-8 w-8 text-primary" />} 
                title="Smart Pattern Recognition" 
                description="Instantly identifies complex chart patterns including head & shoulders, triangles, flags, and more with 99%+ accuracy."
                delay="0"
              />
              <FeatureCard 
                icon={<BarChart2 className="h-8 w-8 text-primary" />} 
                title="Dynamic S&R Levels" 
                description="Pinpoints critical support and resistance zones with laser precision to optimize your entry and exit strategies."
                delay="100"
              />
              <FeatureCard 
                icon={<TrendingUp className="h-8 w-8 text-primary" />} 
                title="Trend Intelligence" 
                description="Advanced trend analysis reveals market direction and momentum strength to keep you ahead of the curve."
                delay="200"
              />
              <FeatureCard 
                icon={<Zap className="h-8 w-8 text-primary" />} 
                title="Precision Trading Signals" 
                description="Get exact entry triggers, calculated stop losses, and multiple take profit targets for maximum profitability."
                delay="300"
              />
              <FeatureCard 
                icon={<Shield className="h-8 w-8 text-primary" />} 
                title="Risk Management" 
                description="Built-in risk assessment with detailed R:R ratios and confidence scores to protect your capital."
                delay="400"
              />
              <FeatureCard 
                icon={<History className="h-8 w-8 text-primary" />} 
                title="Analysis Archive" 
                description="Track your trading performance with comprehensive analysis history and detailed trade records."
                delay="500"
              />
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className={isMobile ? 'py-12 px-4 relative' : 'py-20 px-4 relative'}>
          <div className="container mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-gray-700 shadow-2xl">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent"></div>
              </div>
              
              <div className={isMobile ? 'relative p-8 text-center space-y-6' : 'relative p-12 md:p-16 text-center space-y-6'}>
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm text-primary font-medium mb-4">
                  <Award className="w-4 h-4" />
                  Ready to Trade Smarter?
                </div>
                
                <h2 className={isMobile ? 'text-2xl font-bold text-white leading-tight' : 'text-3xl md:text-4xl font-bold text-white leading-tight'}>
                  Join Thousands of Successful Traders
                </h2>
                <p className={isMobile ? 'text-base text-gray-300 max-w-2xl mx-auto' : 'text-lg text-gray-300 max-w-2xl mx-auto'}>
                  Stop second-guessing your trades. Get professional-grade chart analysis in seconds and make confident trading decisions.
                </p>
                
                <div className="pt-6">
                  <Button 
                    onClick={handleGetStartedClick}
                    size={isMobile ? "default" : "lg"}
                    className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white font-semibold px-8 py-3 rounded-full shadow-glow transition-all duration-300 hover:scale-105 group"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 pt-4">
                  No credit card required • Instant analysis • Professional results
                </p>
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
  description,
  delay = "0"
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Card 
      className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 hover:border-primary/30 transition-all duration-500 hover:shadow-glow card-hover-effect group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className={isMobile ? 'p-6 space-y-4' : 'p-8 space-y-4'}>
        <div className="bg-gradient-to-br from-primary/20 to-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className={isMobile ? 'text-lg font-semibold text-white group-hover:text-primary transition-colors duration-300' : 'text-xl font-semibold text-white group-hover:text-primary transition-colors duration-300'}>
          {title}
        </h3>
        <p className={isMobile ? 'text-sm text-gray-400 leading-relaxed' : 'text-base text-gray-400 leading-relaxed'}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default HomePage;
