
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartCandlestick } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import ImageUpload from './ImageUpload';
import UploadButton from './UploadButton';
import PlanBadge from './PlanBadge';

interface ChartUploaderFormProps {
  onUpload: (file: File, pairName: string, timeframe: string) => void;
}

const ChartUploaderForm = ({ onUpload }: ChartUploaderFormProps) => {
  const { toast } = useToast();
  const { usage } = useSubscription();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (selectedFile: File, preview: string) => {
    setFile(selectedFile);
    setPreviewUrl(preview);
    setIsUploading(false);
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

    // STRICT enforcement for free users
    if (usage && usage.subscription_tier === 'free') {
      if (usage.daily_count >= 3) {
        toast({
          title: "Free Plan Daily Limit Reached",
          description: "You can only analyze 3 charts per day with the free plan. Upgrade to Starter or Pro for more analyses, or wait until tomorrow.",
          variant: "destructive"
        });
        return;
      }
      
      if (usage.monthly_count >= 90) {
        toast({
          title: "Free Plan Monthly Limit Reached",
          description: "You can only analyze 90 charts per month with the free plan. Upgrade to Starter or Pro for unlimited monthly analyses.",
          variant: "destructive"
        });
        return;
      }
    }

    // General can_analyze check for all users
    if (usage && !usage.can_analyze) {
      const isFreeUser = usage.subscription_tier === 'free';
      const limitMessage = isFreeUser ? 
        "Free plan: 3 analyses per day, 90 per month. Please upgrade to continue or wait until tomorrow." :
        "You've reached your analysis limit. Please upgrade your plan to continue.";
        
      toast({
        title: "Usage Limit Reached",
        description: limitMessage,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    // AI will auto-detect both pair and timeframe
    onUpload(file, "AUTO_DETECT", "AUTO_DETECT");
  };

  // Determine button text and disabled state
  const getButtonState = () => {
    if (isUploading) return { text: "Analyzing Chart...", disabled: true };
    if (!file) return { text: "Upload a chart image to analyze", disabled: true };
    
    if (usage && usage.subscription_tier === 'free') {
      if (usage.daily_count >= 3) {
        return { text: "Daily Limit Reached (3/3)", disabled: true };
      }
      if (usage.monthly_count >= 90) {
        return { text: "Monthly Limit Reached (90/90)", disabled: true };
      }
      const remaining = 3 - usage.daily_count;
      return { text: `Analyze Chart (${remaining} left today)`, disabled: false };
    }
    
    if (usage && !usage.can_analyze) {
      return { text: "Usage Limit Reached", disabled: true };
    }
    
    return { text: "Analyze Chart with AI", disabled: false };
  };

  const buttonState = getButtonState();

  return (
    <Card className="w-full bg-chart-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <ChartCandlestick className="h-6 w-6 text-primary" /> 
            AI Chart Analysis
          </CardTitle>
          <div className="flex items-center gap-3">
            <PlanBadge usage={usage} />
            {usage && (
              <div className="text-xs text-gray-400">
                {usage.daily_count}/{usage.daily_limit} today
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chart Upload - Primary Action */}
          <ImageUpload
            previewUrl={previewUrl}
            onFileChange={handleFileChange}
          />

          {/* AI Detection Info */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              🤖 AI Auto-Detection
            </h3>
            <p className="text-xs text-gray-400">
              Our AI will automatically detect the trading pair and timeframe from your chart image. 
              Just upload your chart and let the AI do the rest!
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <UploadButton
          onClick={handleSubmit}
          buttonState={buttonState}
        />
      </CardFooter>
    </Card>
  );
};

export default ChartUploaderForm;
