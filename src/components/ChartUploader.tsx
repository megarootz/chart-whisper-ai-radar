
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartCandlestick, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChartUploader = ({ onUpload }: { onUpload: (file: File, pairName: string, timeframe: string) => void }) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pairName, setPairName] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

    if (!pairName) {
      toast({
        title: "Error",
        description: "Please enter the trading pair name",
        variant: "destructive"
      });
      return;
    }

    if (!timeframe) {
      toast({
        title: "Error",
        description: "Please enter the chart timeframe",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    // Call the parent onUpload function
    onUpload(file, pairName, timeframe);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsUploading(false);
    }, 2000);
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pair-name" className="text-white">Trading Pair</Label>
              <Input
                id="pair-name"
                placeholder="e.g. EUR/USD, BTC/USD, XAU/USD"
                value={pairName}
                onChange={(e) => setPairName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe" className="text-white">Timeframe</Label>
              <Input
                id="timeframe"
                placeholder="e.g. 1H, 4H, Daily"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
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
