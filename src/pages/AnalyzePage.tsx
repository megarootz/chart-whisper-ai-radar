
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
      
      <main className={`flex-grow ${isMobile ? 'pt-20 px-4 pb-20' : 'pt-24 py-6 px-6 pb-24'}`}>
        <div className={`${isMobile ? 'w-full' : 'container mx-auto max-w-7xl'}`}>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'lg:grid-cols-4 gap-8'}`}>
            <div className={isMobile ? 'order-1' : 'lg:col-span-3'}>
              <AnalysisMenu onAnalysisComplete={handleAnalysisComplete} />
              
              {currentAnalysis && (
                <div className="mt-6">
                  <AnalysisResult 
                    analysis={currentAnalysis} 
                    isDeepAnalysis={isDeepAnalysis}
                  />
                </div>
              )}
            </div>
            
            <div className={`${isMobile ? 'order-2' : 'lg:col-span-1'}`}>
              <div className="sticky top-24">
                <UsageDisplay />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default AnalyzePage;
