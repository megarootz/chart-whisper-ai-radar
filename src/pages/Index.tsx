
import React from 'react';
import Header from '@/components/Header';
import ChartUploader from '@/components/ChartUploader';
import AnalysisResult from '@/components/AnalysisResult';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { isAnalyzing, analysisResult, analyzeChart } = useChartAnalysis();
  const isMobile = useIsMobile();
  
  const handleChartUpload = (file: File) => {
    // Use empty strings for pair name and timeframe to allow AI detection
    analyzeChart(file, '', '');
  };

  return (
    <div className={`flex flex-col min-h-screen bg-chart-bg ${isMobile ? 'pb-24' : ''}`}>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              AI-Powered Chart Analysis
            </h1>
            <p className="text-chart-text text-lg max-w-3xl">
              Upload a chart screenshot to get AI-powered trading insights in a detailed chat format.
            </p>
          </div>
          
          <ChartUploader onUpload={handleChartUpload} />
          
          {isAnalyzing && (
            <div className="text-center py-6">
              <p className="text-white text-lg">Analyzing your chart...</p>
            </div>
          )}
          
          {analysisResult && (
            <div>
              <AnalysisResult data={analysisResult} />
            </div>
          )}
        </div>
      </main>
      {!isMobile && <Footer />}
    </div>
  );
};

export default Index;
