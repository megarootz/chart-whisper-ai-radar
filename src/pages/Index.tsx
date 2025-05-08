
import React from 'react';
import Header from '@/components/Header';
import ChartUploader from '@/components/ChartUploader';
import AnalysisResult from '@/components/AnalysisResult';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { isAnalyzing, analysisResult, analyzeChart } = useChartAnalysis();
  const isMobile = useIsMobile();
  
  const handleChartUpload = (file: File, pairName: string, timeframe: string) => {
    analyzeChart(file, pairName, timeframe);
  };

  return (
    <div className={`flex flex-col min-h-screen bg-chart-bg ${isMobile ? 'pb-24' : ''}`}>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              AI-Powered Forex Chart Analysis
            </h1>
            <p className="text-chart-text text-lg max-w-3xl">
              Upload your chart screenshot and get instant professional analysis powered by advanced AI. Identify trends, patterns, and critical price levels.
            </p>
          </div>
          
          <ChartUploader onUpload={handleChartUpload} />
          
          {analysisResult && (
            <>
              <Separator className="bg-gray-700" />
              <AnalysisResult data={analysisResult} />
            </>
          )}
        </div>
      </main>
      {!isMobile && <Footer />}
    </div>
  );
};

export default Index;
