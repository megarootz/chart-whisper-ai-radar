
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnalysisMenu from '@/components/AnalysisMenu';
import AnalysisResult from '@/components/AnalysisResult';
import UsageDisplay from '@/components/UsageDisplay';
import { useIsMobile } from '@/hooks/use-mobile';

const AnalyzePage = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [isDeepAnalysis, setIsDeepAnalysis] = useState(false);
  const isMobile = useIsMobile();

  const handleAnalysisComplete = (analysis: any, isDeep: boolean = false) => {
    setCurrentAnalysis(analysis);
    setIsDeepAnalysis(isDeep);
  };

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow pt-20 ${isMobile ? 'px-3 pb-20' : 'py-6 px-6 pb-24'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
        <div className={`${isMobile ? 'w-full' : 'container mx-auto max-w-6xl'}`}>
          <div className={`mb-4 md:mb-6 ${isMobile ? 'px-1' : 'px-0'}`}>
            <h1 
              className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2" 
              style={{ color: '#ffffff', fontWeight: 'bold', fontSize: isMobile ? '1.25rem' : '1.5rem' }}
            >
              Deep Historical Analysis
            </h1>
            <p 
              className="text-gray-400 text-sm md:text-base"
              style={{ color: '#9ca3af' }}
            >
              Analyze historical forex data with advanced AI techniques
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <AnalysisMenu onAnalysisComplete={handleAnalysisComplete} />
              
              {currentAnalysis && (
                <AnalysisResult 
                  analysis={currentAnalysis} 
                  isDeepAnalysis={isDeepAnalysis}
                />
              )}
            </div>
            
            <div className="lg:col-span-1">
              <UsageDisplay />
            </div>
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default AnalyzePage;
