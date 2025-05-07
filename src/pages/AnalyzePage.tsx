
import React, { useState } from 'react';
import { Cloud, Upload, Camera, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';

const AnalyzePage = () => {
  const { isAnalyzing, analysisResult, analyzeChart } = useChartAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pairName, setPairName] = useState('');
  const [timeframe, setTimeframe] = useState('');
  
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
      analyzeChart(file, pairName || 'Unknown Pair', timeframe || 'Unknown Timeframe');
    }
  };

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-chart-card border border-gray-700 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Upload Chart Image</h2>
                
                <div 
                  className="border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center p-8 transition-colors cursor-pointer hover:border-primary"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                  <Cloud className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-white text-center mb-2">Drag and drop your chart image here</p>
                  <p className="text-gray-400 text-center text-sm mb-4">Supports: PNG, JPG, JPEG</p>
                  <Button className="bg-primary text-white hover:bg-primary/90">
                    Browse files
                  </Button>
                </div>
                
                <div className="text-center">or</div>
                
                <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800 text-white">
                  <Camera className="mr-2 h-4 w-4" />
                  Capture with Camera
                </Button>
                
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <h3 className="text-white font-medium">Image Requirements</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 mt-1"></div>
                      <p className="text-gray-400 text-sm">Clear, high-resolution chart images</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 mt-1"></div>
                      <p className="text-gray-400 text-sm">Candlestick patterns should be visible</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 mt-1"></div>
                      <p className="text-gray-400 text-sm">Include time frame if possible</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 mt-1"></div>
                      <p className="text-gray-400 text-sm">Include indicators if relevant</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={!file || isAnalyzing}
                  onClick={handleUpload}
                >
                  {isAnalyzing ? 'Analyzing...' : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> 
                      Analyze Chart
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-gray-400">
                  Upload a chart image to enable analysis
                </p>
              </div>
              
              {/* Preview Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Chart Preview</h2>
                
                <div className="bg-black rounded-lg border border-gray-800 h-72 flex items-center justify-center">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Chart Preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <svg className="h-16 w-16 text-gray-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="12 4"/>
                      </svg>
                      <p className="text-white mb-1">Your chart preview will appear here</p>
                      <p className="text-gray-400 text-sm">Upload a candlestick chart to begin analysis</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-yellow-400 font-medium mb-1">Analysis Tips</h4>
                        <ul className="text-gray-400 text-sm space-y-2">
                          <li>• For best results, ensure candlesticks are clearly visible</li>
                          <li>• Images with price labels help improve accuracy</li>
                          <li>• Our AI works with all major currency pairs and timeframes</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-blue-400 font-medium mb-1">Ready to Analyze?</h4>
                        <p className="text-gray-400 text-sm">
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
          <div className="bg-chart-card border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-8">Analysis Results</h2>
            
            {analysisResult ? (
              // Show analysis results here
              <div>
                {/* We'll utilize the existing AnalysisResult component */}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-800 p-4 rounded-full mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-white font-medium mb-2">No Analysis Yet</h3>
                <p className="text-gray-400 text-center max-w-md">
                  Upload a chart image and click "Analyze Chart" to get detailed technical analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AnalyzePage;
