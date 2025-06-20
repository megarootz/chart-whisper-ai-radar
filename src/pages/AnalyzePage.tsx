
import React, { useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import AnalysisResult from '@/components/AnalysisResult';
import { useIsMobile } from '@/hooks/use-mobile';
import TickmillBanner from '@/components/TickmillBanner';
import RadarAnimation from '@/components/RadarAnimation';
import AnalysisMenu from '@/components/AnalysisMenu';

const AnalyzePage = () => {
  const {
    isAnalyzing,
    analysisResult,
    analyzeChart,
  } = useChartAnalysis();
  
  const isMobile = useIsMobile();
  const analysisResultRef = useRef<HTMLDivElement>(null);
  
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
  
  const handleChartUpload = (file: File) => {
    // Use empty strings for pair name and timeframe to allow AI detection
    analyzeChart(file, '', '');
  };
  
  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow pt-20 ${isMobile ? 'px-0 pb-20' : 'px-4 md:py-8 md:px-6'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
        <div className={`${isMobile ? 'w-full px-4' : 'container mx-auto max-w-6xl'}`}>
          
          {/* Title Section */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              AI-Powered Trading Analysis
            </h1>
            <p className="text-chart-text text-lg max-w-3xl">
              Choose between instant chart analysis or deep historical data exploration.
            </p>
          </div>
          
          {/* Analysis Menu */}
          <div className="mb-6">
            <AnalysisMenu onChartUpload={handleChartUpload} />
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
                    Select Chart Analysis and upload an image to get AI-powered insights
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default AnalyzePage;
