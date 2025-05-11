
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChartCandlestick, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RadarAnimation from './RadarAnimation';

const ChartUploader = ({ onUpload }: { onUpload: (file: File, pairName: string, timeframe: string) => void }) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to results when they become available
  useEffect(() => {
    if (isUploading && resultRef.current) {
      // Scroll to the result section after starting analysis
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [isUploading]);

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
      
      // Reset any previous error state
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a chart image to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    // Call the parent's onUpload function with auto-detected placeholder values
    // The AI will detect the actual pair and timeframe from the image
    onUpload(file, "Auto-detect", "Auto-detect");
  };

  return (
    <Card className="w-full bg-chart-card border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ChartCandlestick className="h-6 w-6 text-primary" /> 
          Chart Analysis
        </CardTitle>
        <CardDescription className="text-chart-text">
          Upload a chart screenshot to get AI-powered trading insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="chart-upload" className="text-white">Chart Image</Label>
            <div className="border-2 border-dashed border-gray-700 rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors">
              <input 
                type="file" 
                id="chart-upload" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <label htmlFor="chart-upload" className="cursor-pointer flex flex-col items-center justify-center">
                {previewUrl ? (
                  <div className="w-full">
                    <img 
                      src={previewUrl} 
                      alt="Chart preview" 
                      className="max-h-[300px] mx-auto rounded-md mb-2 object-contain" 
                    />
                    <p className="text-sm text-chart-text">Click to change image</p>
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-white font-medium">Drop your chart image here</p>
                    <p className="text-sm text-chart-text mt-1">or click to browse files</p>
                    <p className="text-xs text-chart-text mt-3">Supported formats: JPG, PNG, GIF</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {isUploading && (
            <div ref={resultRef} className="py-4">
              <RadarAnimation />
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-900/40 rounded-full p-1 mr-3">
                <ChartCandlestick className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-blue-400 font-medium mb-1">Auto-Detection Enabled</h4>
                <p className="text-gray-400 text-sm">
                  Trading pair and timeframe will be automatically detected from your chart image. No manual entry needed.
                </p>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          onClick={handleSubmit} 
          className="w-full" 
          disabled={isUploading || !file}
        >
          {isUploading ? "Analyzing Chart..." : "Analyze Chart"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChartUploader;
