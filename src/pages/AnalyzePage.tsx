
import React, { useState, useRef, useEffect } from 'react';
import { Cloud, Upload, Camera, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import { useMultiTimeframeAnalysis } from '@/hooks/useMultiTimeframeAnalysis';
import AnalysisResult from '@/components/AnalysisResult';
import { useIsMobile } from '@/hooks/use-mobile';
import TickmillBanner from '@/components/TickmillBanner';
import RadarAnimation from '@/components/RadarAnimation';
import { useAuth } from '@/contexts/AuthContext';
import AnalysisModeSelector from '@/components/AnalysisModeSelector';
import TradingTechniqueSelector, { TradingTechnique } from '@/components/TradingTechniqueSelector';
import MultiTimeframeUploader, { TimeframeChart } from '@/components/MultiTimeframeUploader';

const AnalyzePage = () => {
  const {
    isAnalyzing: isSingleAnalyzing,
    analysisResult: singleAnalysisResult,
    analyzeChart,
  } = useChartAnalysis();
  
  const {
    isAnalyzing: isMultiAnalyzing,
    analysisResult: multiAnalysisResult,
    analyzeMultiTimeframeCharts,
  } = useMultiTimeframeAnalysis();
  
  const [analysisMode, setAnalysisMode] = useState<'single' | 'multi'>('single');
  const [tradingTechnique, setTradingTechnique] = useState<TradingTechnique>('general');
  const [multiCharts, setMultiCharts] = useState<TimeframeChart[]>([]);
  
  // Single chart upload states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const isMobile = useIsMobile();
  const analysisResultRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Determine which analysis is running and which result to show
  const isAnalyzing = isSingleAnalyzing || isMultiAnalyzing;
  const analysisResult = analysisMode === 'single' ? singleAnalysisResult : multiAnalysisResult;
  
  // Effect to scroll to results when they become available
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
  
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const handleSingleUpload = async () => {
    if (file && user) {
      console.log("Starting single chart analysis with technique:", tradingTechnique);
      analyzeChart(file, "", "", tradingTechnique);
    }
  };
  
  const handleMultiUpload = async () => {
    if (multiCharts.length > 0 && user) {
      console.log("Starting multi-timeframe analysis with technique:", tradingTechnique);
      analyzeMultiTimeframeCharts(multiCharts, tradingTechnique);
    }
  };
  
  // Reset states when switching modes
  useEffect(() => {
    if (analysisMode === 'single') {
      setMultiCharts([]);
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  }, [analysisMode]);
  
  const canAnalyze = analysisMode === 'single' 
    ? file && !isAnalyzing
    : multiCharts.length > 0 && multiCharts.every(chart => chart.timeframe) && !isAnalyzing;
  
  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow pt-20 ${isMobile ? 'px-0 pb-20' : 'px-4 md:py-8 md:px-6'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
        <div className={`${isMobile ? 'w-full px-4' : 'container mx-auto max-w-6xl'}`}>
          
          {/* Analysis Mode Selector */}
          <AnalysisModeSelector 
            selectedMode={analysisMode}
            onModeChange={setAnalysisMode}
          />
          
          {/* Trading Technique Selector */}
          <TradingTechniqueSelector
            selectedTechnique={tradingTechnique}
            onTechniqueChange={setTradingTechnique}
          />
          
          <div className="bg-chart-card border border-gray-700 rounded-lg p-4 md:p-6 mb-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-white">
                {analysisMode === 'single' ? 'Single Chart Analysis' : 'Multi-Timeframe Chart Analysis'}
              </h2>
            </div>
            
            {analysisMode === 'single' ? (
              // Single Chart Upload Interface
              <div className="space-y-5">
                <div 
                  className={`border-2 ${previewUrl ? 'border-none' : 'border-dashed border-gray-700'} rounded-lg flex flex-col items-center justify-center ${previewUrl ? 'p-0' : 'p-5 md:p-8'} transition-colors cursor-pointer hover:border-primary`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  style={previewUrl ? {minHeight: '300px'} : {}}
                >
                  <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleSingleFileChange} />
                  
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Chart Preview" 
                      className="max-w-full rounded-lg object-contain" 
                      style={{maxHeight: '60vh'}}
                    />
                  ) : (
                    <>
                      <Cloud className="h-8 w-8 md:h-12 md:w-12 text-gray-500 mb-3 md:mb-4" />
                      <p className="text-white text-center mb-1 md:mb-2">Drag and drop your chart image here</p>
                      <p className="text-gray-400 text-center text-sm mb-3 md:mb-4">Supports: PNG, JPG, JPEG</p>
                      <Button className="bg-primary text-white hover:bg-primary/90 text-sm">
                        Browse files
                      </Button>
                    </>
                  )}
                </div>
                
                {previewUrl && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Click the image to upload a different one</p>
                  </div>
                )}
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white" 
                  disabled={!canAnalyze} 
                  onClick={handleSingleUpload}
                >
                  {isAnalyzing ? 'Analyzing...' : <>
                    <Upload className="mr-2 h-4 w-4" /> 
                    Analyze Chart
                  </>}
                </Button>
              </div>
            ) : (
              // Multi-Timeframe Upload Interface
              <div className="space-y-5">
                <MultiTimeframeUploader
                  charts={multiCharts}
                  onChartsChange={setMultiCharts}
                  maxCharts={3}
                />
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white" 
                  disabled={!canAnalyze} 
                  onClick={handleMultiUpload}
                >
                  {isAnalyzing ? 'Analyzing Multiple Timeframes...' : <>
                    <Upload className="mr-2 h-4 w-4" /> 
                    Analyze Multi-Timeframe Charts
                  </>}
                </Button>
              </div>
            )}
            
            {/* Analysis Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                <h3 className="text-white font-medium text-sm md:text-base mb-2">Image Requirements</h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500 mt-1"></div>
                    <p className="text-gray-400 text-xs md:text-sm">Clear, high-resolution chart images</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500 mt-1"></div>
                    <p className="text-gray-400 text-xs md:text-sm">Candlestick patterns should be visible</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500 mt-1"></div>
                    <p className="text-gray-400 text-xs md:text-sm">Include time frame if possible</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 md:p-4">
                <div className="flex items-start">
                  <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-medium text-sm md:text-base mb-1">
                      {analysisMode === 'single' ? 'Auto-Detection' : 'Multi-Timeframe Benefits'}
                    </h4>
                    <p className="text-gray-400 text-xs md:text-sm">
                      {analysisMode === 'single' 
                        ? 'Trading pair and timeframe will be automatically detected from your chart image.'
                        : 'Analyze multiple timeframes for better confluence and higher probability setups.'
                      }
                    </p>
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
                    {analysisMode === 'single' 
                      ? 'Upload a chart image and click "Analyze Chart" to get detailed technical analysis'
                      : 'Upload multiple timeframe charts and click "Analyze Multi-Timeframe Charts" for comprehensive analysis'
                    }
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
