
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Info, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import AnalysisResult from '@/components/AnalysisResult';
import { useIsMobile } from '@/hooks/use-mobile';
import TickmillBanner from '@/components/TickmillBanner';
import RadarAnimation from '@/components/RadarAnimation';
import { useAuth } from '@/contexts/AuthContext';
import TradingPairSelector from '@/components/TradingPairSelector';
import TimeframeSelector from '@/components/TimeframeSelector';
import { dataUrlToFile } from '@/utils/screenshotUtils';

const AnalyzePage = () => {
  const {
    isAnalyzing,
    analysisResult,
    analyzeChart,
  } = useChartAnalysis();
  
  const [selectedPair, setSelectedPair] = useState('OANDA:EURUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const analysisResultRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Effect to check for screenshot data from chart page
  useEffect(() => {
    const checkForScreenshotData = () => {
      const screenshotData = sessionStorage.getItem('chartScreenshot');
      const chartSymbol = sessionStorage.getItem('chartSymbol');
      const chartInterval = sessionStorage.getItem('chartInterval');
      
      if (screenshotData && chartSymbol && chartInterval) {
        console.log('📸 Found screenshot data from chart page, starting analysis...');
        
        // Clear the session storage
        sessionStorage.removeItem('chartScreenshot');
        sessionStorage.removeItem('chartSymbol');
        sessionStorage.removeItem('chartInterval');
        
        // Convert the data URL back to a file
        const file = dataUrlToFile(screenshotData, `${chartSymbol}-${chartInterval}.png`);
        
        // Start the analysis
        analyzeChart(file, chartSymbol.replace('OANDA:', ''), chartInterval);
      }
    };
    
    checkForScreenshotData();
  }, [analyzeChart]);
  
  // Effect to scroll to results when they become available
  useEffect(() => {
    if (analysisResult && analysisResultRef.current) {
      // Add a small delay to ensure DOM is updated before scrolling
      setTimeout(() => {
        // Calculate scroll position to ensure the trading pair is visible
        const resultRect = analysisResultRef.current.getBoundingClientRect();
        const headerOffset = 80; // Estimated header height
        const scrollPosition = window.scrollY + resultRect.top - headerOffset;
        
        // Scroll to the calculated position to ensure trading pair is visible at the top
        window.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }, 500);
    }
  }, [analysisResult]);
  
  const handleLiveAnalysis = async () => {
    if (!user) {
      console.log("User not logged in, cannot analyze chart");
      return;
    }
    
    console.log('🚀 Starting live chart analysis for:', selectedPair, selectedTimeframe);
    
    // Navigate to chart page with auto-capture parameters
    const chartUrl = `/chart?symbol=${encodeURIComponent(selectedPair)}&interval=${encodeURIComponent(selectedTimeframe)}&autoCapture=true&returnTo=${encodeURIComponent('/analyze')}`;
    navigate(chartUrl);
  };
  
  return <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow pt-20 ${isMobile ? 'px-0 pb-20' : 'px-4 md:py-8 md:px-6'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
        <div className={`${isMobile ? 'w-full' : 'container mx-auto max-w-6xl'}`}>
          
          {/* Live Chart Analysis Section */}
          <div className="mb-6">
            <div className="bg-chart-card border border-gray-700 rounded-lg p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 
                  className="text-lg md:text-xl font-bold text-white flex items-center gap-2"
                  style={{ color: '#ffffff', fontWeight: 'bold', fontSize: isMobile ? '1.125rem' : '1.25rem' }}
                >
                  <Zap className="h-5 w-5 text-primary" />
                  Live Chart Analysis
                </h2>
              </div>
              
              {/* Selection Interface */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TradingPairSelector
                    value={selectedPair}
                    onChange={setSelectedPair}
                    disabled={isAnalyzing}
                  />
                  
                  <TimeframeSelector
                    value={selectedTimeframe}
                    onChange={setSelectedTimeframe}
                    disabled={isAnalyzing}
                  />
                </div>
                
                {/* Live Analysis Benefits */}
                <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-3 md:p-4">
                  <div className="flex items-start">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-green-400 font-medium text-sm md:text-base mb-1">Live Chart Analysis</h4>
                      <ul className="text-gray-300 text-xs md:text-sm space-y-1">
                        <li>• Real-time market data and current prices</li>
                        <li>• High-quality chart screenshots automatically captured</li>
                        <li>• No manual image upload required</li>
                        <li>• Analysis based on latest market conditions</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Selection Preview */}
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-blue-400 font-medium text-sm md:text-base">Selected Configuration</h4>
                      <p className="text-gray-300 text-xs md:text-sm mt-1">
                        {selectedPair.replace('OANDA:', '')} • {selectedTimeframe === '60' ? '1H' : selectedTimeframe === '240' ? '4H' : selectedTimeframe}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Live TradingView Chart</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white" 
                  disabled={isAnalyzing || !user} 
                  onClick={handleLiveAnalysis}
                >
                  {isAnalyzing ? 'Analyzing...' : <>
                    <TrendingUp className="mr-2 h-4 w-4" /> 
                    Analyze Live Chart
                  </>}
                </Button>
                
                {!user && (
                  <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 md:p-4">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-yellow-400 font-medium text-sm md:text-base mb-1">Login Required</h4>
                        <p className="text-gray-400 text-xs md:text-sm">
                          Please sign in to access live chart analysis features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Process Info */}
          <div className="mb-6">
            <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
              <h3 className="text-white font-medium text-sm md:text-base mb-3">How Live Analysis Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex items-start space-x-2">
                  <div className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <p className="text-white text-xs font-medium">Select Pair & Timeframe</p>
                    <p className="text-gray-400 text-xs">Choose your trading setup</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <p className="text-white text-xs font-medium">Load Live Chart</p>
                    <p className="text-gray-400 text-xs">Real-time TradingView data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <p className="text-white text-xs font-medium">Auto Screenshot</p>
                    <p className="text-gray-400 text-xs">High-quality capture</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <p className="text-white text-xs font-medium">AI Analysis</p>
                    <p className="text-gray-400 text-xs">GPT-4.1-mini Vision</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Radar Animation Modal when analyzing */}
          {isAnalyzing && <RadarAnimation />}
          
          {/* Analysis Results */}
          <div className="space-y-6" ref={analysisResultRef}>
            {analysisResult ? (
              <>
                <AnalysisResult data={analysisResult} />
                <TickmillBanner />
              </>
            ) : !isAnalyzing && (
              <div className="bg-chart-card border border-gray-700 rounded-lg p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-white mb-6 md:mb-8">Analysis Results</h2>
                <div className="flex flex-col items-center justify-center py-12 md:py-16">
                  <div className="bg-gray-800 p-3 md:p-4 rounded-full mb-3 md:mb-4">
                    <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">No Analysis Yet</h3>
                  <p className="text-gray-400 text-center text-sm md:text-base max-w-md">
                    Select a trading pair and timeframe above to get live chart analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>;
};

export default AnalyzePage;
