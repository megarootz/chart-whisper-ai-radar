
import React, { useState, useRef, useEffect } from 'react';
import { Cloud, Upload, Camera, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import AnalysisResult from '@/components/AnalysisResult';
import { useIsMobile } from '@/hooks/use-mobile';
import TickmillBanner from '@/components/TickmillBanner';
import RadarAnimation from '@/components/RadarAnimation';

const AnalyzePage = () => {
  const {
    isAnalyzing,
    analysisResult,
    analyzeChart
  } = useChartAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const analysisResultRef = useRef<HTMLDivElement>(null);
  
  // Effect to scroll to results when they become available
  useEffect(() => {
    if (analysisResult && analysisResultRef.current) {
      // Add a small delay to ensure DOM is updated before scrolling
      setTimeout(() => {
        analysisResultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
    }
  }, [analysisResult]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const handleUpload = () => {
    if (file) {
      // Use "Auto-detect" as placeholder - the AI will detect from the image
      analyzeChart(file, "Auto-detect", "Auto-detect");
    }
  };
  
  return <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow py-4 px-4 md:py-8 md:px-6 ${isMobile ? 'pb-20' : ''}`}>
        <div className="container mx-auto max-w-6xl">
          <div className="bg-chart-card border border-gray-700 rounded-lg p-4 md:p-6 mb-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-white">Chart Analysis</h2>
            </div>
            
            {/* Combined Upload and Preview Section */}
            <div className="space-y-5">
              <div 
                className={`border-2 ${previewUrl ? 'border-none' : 'border-dashed border-gray-700'} rounded-lg flex flex-col items-center justify-center ${previewUrl ? 'p-0' : 'p-5 md:p-8'} transition-colors cursor-pointer hover:border-primary`}
                onClick={() => document.getElementById('file-upload')?.click()}
                style={previewUrl ? {minHeight: '300px'} : {}}
              >
                <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                
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
                    
                    <div className="text-center text-sm text-gray-400 mt-4">or</div>
                  </>
                )}
              </div>
              
              {previewUrl && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Click the image to upload a different one</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Requirements */}
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
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500 mt-1"></div>
                      <p className="text-gray-400 text-xs md:text-sm">Include indicators if relevant</p>
                    </div>
                  </div>
                </div>
                
                {/* Analysis Tips */}
                <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 md:p-4">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-400 font-medium text-sm md:text-base mb-1">Analysis Tips</h4>
                      <ul className="text-gray-400 text-xs md:text-sm space-y-1 md:space-y-2">
                        <li>• For best results, ensure candlesticks are clearly visible</li>
                        <li>• Images with price labels help improve accuracy</li>
                        <li>• Our AI works with all major currency pairs and timeframes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Auto-Detection Info */}
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 md:p-4">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-blue-400 font-medium text-sm md:text-base mb-1">Auto-Detection Enabled</h4>
                      <p className="text-gray-400 text-xs md:text-sm">
                        Trading pair and timeframe will be automatically detected from your chart image. No manual entry needed.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Timeframe Info */}
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 md:p-4">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-blue-400 font-medium text-sm md:text-base mb-1">Timeframe Info</h4>
                      <p className="text-gray-400 text-xs md:text-sm">
                        The AI will adapt stop loss and take profit levels based on the detected timeframe of your chart.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white" 
                disabled={!file || isAnalyzing} 
                onClick={handleUpload}
              >
                {isAnalyzing ? 'Analyzing...' : <>
                  <Upload className="mr-2 h-4 w-4" /> 
                  Analyze Chart
                </>}
              </Button>
            </div>
          </div>
          
          {/* Radar Animation when analyzing */}
          {isAnalyzing && (
            <div className="bg-chart-card border border-gray-700 rounded-lg p-4 md:p-6 mb-6">
              <div className="flex flex-col items-center justify-center py-8">
                <RadarAnimation />
                <h3 className="text-white font-medium mt-4">Analyzing Chart</h3>
                <p className="text-gray-400 text-center text-sm md:text-base max-w-md mt-2">
                  Our AI is processing your chart to identify patterns, support & resistance levels, and trading opportunities
                </p>
              </div>
            </div>
          )}
          
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
                    Upload a chart image and click "Analyze Chart" to get detailed technical analysis
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
