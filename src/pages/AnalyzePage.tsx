
import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnalysisResult from '@/components/AnalysisResult';
import PairSelector from '@/components/PairSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import TickmillBanner from '@/components/TickmillBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useN8nAnalysis } from '@/hooks/useN8nAnalysis';

const AnalyzePage = () => {
  const {
    isAnalyzing,
    analysisResult,
    analyzePair,
  } = useN8nAnalysis();
  
  const [selectedPair, setSelectedPair] = useState<string>('');
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
    if (selectedPair.trim()) {
      console.log("Starting n8n real-time analysis...");
      
      if (!user) {
        console.log("User not logged in, cannot analyze pair");
        return;
      }
      
      analyzePair(selectedPair.trim());
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
              onPairChange={setSelectedPair}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
            
            {/* Analysis Results */}
            <div className="space-y-6" ref={analysisResultRef}>
              {analysisResult ? (
                <>
                  <AnalysisResult 
                    data={analysisResult} 
                    isStreaming={false}
                  />
                  <TickmillBanner />
                </>
              ) : !isAnalyzing && (
                <div className="bg-gradient-to-br from-chart-card to-gray-900/50 border border-gray-700/50 rounded-lg p-6 md:p-8 backdrop-blur-sm">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-6 md:mb-8">Analysis Results</h2>
                  <div className="flex flex-col items-center justify-center py-12 md:py-16">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 md:p-5 rounded-full mb-4 md:mb-5 shadow-lg">
                      <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                    </div>
                    <h3 className="text-white font-medium mb-3 text-lg">Ready for Analysis</h3>
                    <p className="text-gray-400 text-center text-sm md:text-base max-w-md leading-relaxed">
                      Enter a currency pair above and click "Analyze Pair" to get comprehensive real-time market analysis powered by n8n workflows
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
