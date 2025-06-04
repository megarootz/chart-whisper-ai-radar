
import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnalysisResult from '@/components/AnalysisResult';
import PairSelector from '@/components/PairSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import TickmillBanner from '@/components/TickmillBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useDeepSeekAnalysis } from '@/hooks/useDeepSeekAnalysis';

const AnalyzePage = () => {
  const {
    isAnalyzing,
    analysisResult,
    analyzePair,
  } = useDeepSeekAnalysis();
  
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
  const isMobile = useIsMobile();
  const analysisResultRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (analysisResult && analysisResultRef.current) {
      setTimeout(() => {
        const resultRect = analysisResultRef.current.getBoundingClientRect();
        const headerOffset = 80;
        const scrollPosition = window.scrollY + resultRect.top - headerOffset;
        
        window.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }, 500);
    }
  }, [analysisResult]);
  
  const handleAnalyze = async () => {
    if (selectedPair && selectedTimeframe) {
      console.log("Starting DeepSeek analysis...");
      
      if (!user) {
        console.log("User not logged in, cannot analyze pair");
        return;
      }
      
      analyzePair(selectedPair, selectedTimeframe);
    }
  };
  
  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow pt-20 ${isMobile ? 'px-0 pb-20' : 'px-4 md:py-8 md:px-6'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
        <div className={`${isMobile ? 'w-full px-4' : 'container mx-auto max-w-6xl'}`}>
          <div className="space-y-6">
            <PairSelector
              selectedPair={selectedPair}
              selectedTimeframe={selectedTimeframe}
              onPairChange={setSelectedPair}
              onTimeframeChange={setSelectedTimeframe}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
            
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
                      Select a currency pair and timeframe, then click "Analyze Pair" to get comprehensive market analysis with real-time data
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default AnalyzePage;
