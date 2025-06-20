
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartCandlestick, Upload, Crown, Star, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Badge } from './ui/badge';

interface ChartUploaderProps {
  onUpload: (file: File, pairName: string, timeframe: string) => void;
}

const ChartUploader = ({ onUpload }: ChartUploaderProps) => {
  const { toast } = useToast();
  const { usage } = useSubscription();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

    if (!pairName.trim()) {
      toast({
        title: "Error",
        description: "Please enter the trading pair (e.g., EUR/USD, XAU/USD)",
        variant: "destructive"
      });
      return;
    }

    if (!timeframe.trim()) {
      toast({
        title: "Error",
        description: "Please select the timeframe",
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
    
    // Call the parent's onUpload function with pair and timeframe
    onUpload(file, pairName.trim(), timeframe);
  };

  // Determine button text and disabled state
  const getButtonState = () => {
    if (isUploading) return { text: "Analyzing Chart...", disabled: true };
    if (!file || !pairName.trim() || !timeframe) return { text: "Complete all fields to analyze", disabled: true };
    
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
    
    return { text: "Analyze Chart", disabled: false };
  };

  const getPlanBadge = () => {
    if (!usage) return null;
    
    switch (usage.subscription_tier) {
      case 'pro':
        return (
          <Badge variant="outline" className="text-yellow-400 border-yellow-400 bg-yellow-400/10 text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        );
      case 'starter':
        return (
          <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-400/10 text-xs">
            <Star className="h-3 w-3 mr-1" />
            Starter
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-400 border-gray-400 bg-gray-400/10 text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Free
          </Badge>
        );
    }
  };

  const buttonState = getButtonState();

  return (
    <Card className="w-full bg-chart-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <ChartCandlestick className="h-6 w-6 text-primary" /> 
            Chart Analysis
          </CardTitle>
          <div className="flex items-center gap-3">
            {getPlanBadge()}
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
          {/* Trading Pair and Timeframe Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pair-name" className="text-white">Trading Pair</Label>
              <Input
                id="pair-name"
                type="text"
                placeholder="e.g., EUR/USD, XAU/USD, BTC/USD"
                value={pairName}
                onChange={(e) => setPairName(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe" className="text-white">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="1 Minute">1 Minute</SelectItem>
                  <SelectItem value="5 Minutes">5 Minutes</SelectItem>
                  <SelectItem value="15 Minutes">15 Minutes</SelectItem>
                  <SelectItem value="30 Minutes">30 Minutes</SelectItem>
                  <SelectItem value="1 Hour">1 Hour</SelectItem>
                  <SelectItem value="4 Hours">4 Hours</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chart Upload */}
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
          disabled={buttonState.disabled}
        >
          {buttonState.text}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChartUploader;
