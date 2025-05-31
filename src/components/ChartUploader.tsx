
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChartCandlestick, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import UsageDisplay from './UsageDisplay';

const ChartUploader = ({ onUpload }: { onUpload: (file: File) => void }) => {
  const { toast } = useToast();
  const { usage } = useSubscription();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

    if (usage && !usage.can_analyze) {
      const isFreeUser = usage.subscription_tier === 'free';
      const limitMessage = isFreeUser ? 
        "You've reached your daily limit of 3 analyses or monthly limit of 90 analyses. Please upgrade your plan or wait until tomorrow." :
        "You've reached your analysis limit. Please upgrade your plan to continue.";
        
      toast({
        title: "Usage Limit Reached",
        description: limitMessage,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    // Call the parent's onUpload function
    onUpload(file);
  };

  return (
    <div className="space-y-6">
      <UsageDisplay />
      
      <Card className="w-full bg-chart-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ChartCandlestick className="h-6 w-6 text-primary" /> 
            Chart Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="chart-upload" className="text-white">Upload Chart Image</Label>
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
                    </div>
                  )}
                </label>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={isUploading || !file || (usage && !usage.can_analyze)}
          >
            {isUploading ? "Analyzing Chart..." : 
             usage && !usage.can_analyze ? (
               usage.subscription_tier === 'free' ? "Daily/Monthly Limit Reached" : "Usage Limit Reached"
             ) : 
             "Analyze Chart"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChartUploader;
