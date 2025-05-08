
import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, Upload, LineChart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AnalysisResultData } from '@/components/AnalysisResult';
import { useIsMobile } from '@/hooks/use-mobile';
import TickmillBanner from '@/components/TickmillBanner';

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-chart-card border border-gray-700 rounded-lg p-6 hover:border-primary transition-colors">
    <div className="bg-gray-800 p-4 rounded-lg inline-block mb-4">
      {icon}
    </div>
    <h3 className="text-white text-xl font-medium mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

type AnalysisCardProps = {
  pairName: string;
  timeframe: string;
  date: string;
  sentiment: string;
  description: string;
  index: number;
};

const AnalysisCard = ({ pairName, timeframe, date, sentiment, description, index }: AnalysisCardProps) => (
  <div className="bg-chart-card border border-gray-700 rounded-lg overflow-hidden">
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-white font-medium">{pairName}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">{timeframe}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">{date}</span>
          </div>
        </div>
        <div className={`px-3 py-1 text-xs font-medium rounded-full ${
          sentiment.toLowerCase().includes('bullish') ? 'bg-green-900 text-green-400' : 
          sentiment.toLowerCase().includes('bearish') ? 'bg-red-900 text-red-400' : 
          'bg-yellow-900 text-yellow-400'}`}>
          {sentiment}
        </div>
      </div>
      
      <p className="text-gray-400 text-sm line-clamp-3 mb-4">{description}</p>
      
      <div className="flex justify-between items-center">
        <Link 
          to={`/analysis/${index}`}
          className="text-primary hover:underline flex items-center text-sm"
        >
          View Details <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
        <div className="flex space-x-2">
          <button className="text-gray-400 hover:text-gray-300 p-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-gray-300 p-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResultData[]>([]);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Load analysis history from localStorage
    const storedHistory = localStorage.getItem('chartAnalysisHistory');
    if (storedHistory) {
      const parsedHistory = JSON.parse(storedHistory);
      // Show at most 2 recent analyses
      setRecentAnalyses(parsedHistory.slice(0, 2)); 
    }
  }, []);

  const features = [
    {
      icon: <Upload className="h-6 w-6 text-primary" />,
      title: "Easy Image Upload",
      description: "Upload chart images directly from your device or capture them using your camera for instant analysis."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Pattern Recognition",
      description: "Identify key candlestick patterns like engulfing, doji, and hammer with confidence ratings."
    },
    {
      icon: <LineChart className="h-6 w-6 text-primary" />,
      title: "Support & Resistance",
      description: "Get key support and resistance levels with entry and exit point recommendations."
    }
  ];

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow ${isMobile ? 'pb-24' : ''}`}>
        {/* Hero Section */}
        <section className="py-16 px-6">
          <div className="container mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Professional Candlestick Chart Analysis
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Upload or capture your candlestick charts and get AI-powered analysis with pattern
              recognition, trend identification, and trading suggestions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white">
                <Link to="/analyze">
                  <Upload className="mr-2 h-5 w-5" /> Analyze Chart
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="border-gray-700 bg-gray-800 hover:bg-gray-700 text-white"
              >
                <Link to="/history">
                  View History
                </Link>
              </Button>
            </div>
            
            {/* Tickmill Banner */}
            <div className="max-w-3xl mx-auto mt-10">
              <TickmillBanner />
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 px-6 bg-black/30">
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Powerful Chart Analysis Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard 
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Recent Analyses Section */}
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Recent Analyses</h2>
              <Link to="/history" className="text-primary hover:underline flex items-center">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            {recentAnalyses.length === 0 ? (
              <div className="text-center py-12 bg-chart-card border border-gray-700 rounded-lg">
                <p className="text-gray-400">No analysis history found. Start by analyzing a chart!</p>
                <Button asChild className="mt-4">
                  <Link to="/analyze">Analyze a Chart</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentAnalyses.map((analysis, index) => (
                  <AnalysisCard 
                    key={index}
                    index={index}
                    pairName={analysis.pairName}
                    timeframe={analysis.timeframe}
                    date={analysis.timestamp || analysis.date || new Date().toLocaleString()}
                    sentiment={analysis.overallSentiment}
                    description={analysis.marketAnalysis}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default HomePage;
