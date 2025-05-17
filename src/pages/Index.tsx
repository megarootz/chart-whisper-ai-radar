
import React, { useState } from 'react';
import Header from '@/components/Header';
import ChartUploader from '@/components/ChartUploader';
import AnalysisResult from '@/components/AnalysisResult';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Index = () => {
  const { isAnalyzing, analysisResult, analyzeChart } = useChartAnalysis();
  const isMobile = useIsMobile();
  const [pairName, setPairName] = useState('');
  const [timeframe, setTimeframe] = useState('');
  
  const handleChartUpload = (file: File) => {
    // Use the user-provided pair name and timeframe instead of "Auto-detect"
    const finalPairName = pairName.trim() || "Unknown Pair";
    const finalTimeframe = timeframe.trim() || "Unknown Timeframe";
    
    analyzeChart(file, finalPairName, finalTimeframe);
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
          
          {/* Chart information inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pair-name" className="text-white">Trading Pair (required)</Label>
              <Input 
                id="pair-name" 
                placeholder="e.g. EUR/USD, BTCUSD, XAU/USD" 
                value={pairName} 
                onChange={e => setPairName(e.target.value)} 
                className="bg-chart-card text-white border-gray-700 focus:border-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe" className="text-white">Timeframe (required)</Label>
              <Input 
                id="timeframe" 
                placeholder="e.g. 1H, 4H, Daily, Weekly" 
                value={timeframe} 
                onChange={e => setTimeframe(e.target.value)} 
                className="bg-chart-card text-white border-gray-700 focus:border-primary"
                required
              />
            </div>
          </div>
          
          <ChartUploader onUpload={handleChartUpload} />
          
          {isAnalyzing && (
            <div className="text-center py-6">
              <p className="text-white text-lg">Analyzing your chart...</p>
            </div>
          )}
          
          {analysisResult && <AnalysisResult data={analysisResult} />}
        </div>
      </main>
      {!isMobile && <Footer />}
    </div>
  );
};

export default Index;
