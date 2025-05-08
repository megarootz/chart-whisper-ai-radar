
import React, { useState } from 'react';
import { Cloud, Upload, Camera, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import AnalysisResult from '@/components/AnalysisResult';
import { useIsMobile } from '@/hooks/use-mobile';

const AnalyzePage = () => {
  const {
    isAnalyzing,
    analysisResult,
    analyzeChart
  } = useChartAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="space-y-5">
                <h2 className="text-lg md:text-xl font-bold text-white">Upload Chart Image</h2>
                
                <div className="border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center p-5 md:p-8 transition-colors cursor-pointer hover:border-primary" onClick={() => document.getElementById('file-upload')?.click()}>
                  <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <Cloud className="h-8 w-8 md:h-12 md:w-12 text-gray-500 mb-3 md:mb-4" />
                  <p className="text-white text-center mb-1 md:mb-2">Drag and drop your chart image here</p>
                  <p className="text-gray-400 text-center text-sm mb-3 md:mb-4">Supports: PNG, JPG, JPEG</p>
                  <Button className="bg-primary text-white hover:bg-primary/90 text-sm">
                    Browse files
                  </Button>
                </div>
                
                <div className="text-center text-sm">or</div>
                
                <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 space-y-2">
                  <h3 className="text-white font-medium text-sm md:text-base">Image Requirements</h3>
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
              
              {/* Preview Section */}
              <div className="space-y-5">
                <h2 className="text-lg md:text-xl font-bold text-white">Chart Preview</h2>
                
                <div className="bg-black rounded-lg border border-gray-800 h-60 md:h-72 flex items-center justify-center">
                  {previewUrl ? <img src={previewUrl} alt="Chart Preview" className="max-h-full max-w-full object-contain" /> : <div className="text-center p-4 md:p-6">
                      <svg className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-3 md:mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="12 4" />
                      </svg>
                      <p className="text-white text-sm md:text-base mb-1">Your chart preview will appear here</p>
                      <p className="text-gray-400 text-xs md:text-sm">Upload a candlestick chart to begin analysis</p>
                    </div>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                  
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 md:p-4">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-blue-400 font-medium text-sm md:text-base mb-1">Ready to Analyze?</h4>
                        <p className="text-gray-400 text-xs md:text-sm">
                          Get detailed analysis including pattern recognition, support/resistance levels, and trend predictions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Analysis Results */}
          <div className="bg-chart-card border border-gray-700 rounded-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-6 md:mb-8">Analysis Results</h2>
            
            {analysisResult ? (
              <AnalysisResult data={analysisResult} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 md:py-16">
                <div className="bg-gray-800 p-3 md:p-4 rounded-full mb-3 md:mb-4">
                  <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                </div>
                <h3 className="text-white font-medium mb-2">No Analysis Yet</h3>
                <p className="text-gray-400 text-center text-sm md:text-base max-w-md">
                  Upload a chart image and click "Analyze Chart" to get detailed technical analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>;
};
export default AnalyzePage;
