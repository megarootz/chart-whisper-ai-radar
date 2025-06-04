
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { WebhookService } from '@/services/webhookService';
import { formatTradingPair } from '@/utils/tradingPairUtils';

export const useN8nAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setLatestAnalysis } = useAnalysis();
  const { incrementUsage, checkUsageLimits } = useSubscription();

  const analyzePair = async (pairName: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      
      if (!user) {
        console.error('❌ AUTHENTICATION REQUIRED: User must be logged in to analyze pairs');
        toast({
          title: "Authentication Required",
          description: "You must be logged in to analyze currency pairs. Please sign in first.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 Starting n8n analysis for authenticated user:', user.id, 'pair:', pairName);

      const usageData = await checkUsageLimits();
      console.log('📊 Current usage status:', usageData);
      
      if (usageData && !usageData.can_analyze) {
        console.log('❌ Usage limit reached - cannot analyze');
        toast({
          title: "Usage Limit Reached",
          description: `You've reached your analysis limit. Daily: ${usageData.daily_count}/${usageData.daily_limit}, Monthly: ${usageData.monthly_count}/${usageData.monthly_limit}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Usage limits check passed, proceeding with n8n analysis');
      
      // Format the trading pair
      const formattedPair = formatTradingPair(pairName);
      
      // Send request to n8n webhook
      const webhookResponse = await WebhookService.sendAnalysisRequest({
        pairName: formattedPair,
        userId: user.id,
        userEmail: user.email || ''
      });

      if (!webhookResponse.success) {
        throw new Error(webhookResponse.error || 'Failed to send analysis request to n8n');
      }

      // Create mock analysis result for now (n8n will provide real data later)
      const mockAnalysisResult: AnalysisResultData = {
        pairName: formattedPair,
        timeframe: 'Real-time',
        overallSentiment: 'neutral',
        confidenceScore: 85,
        marketAnalysis: `Analysis request for ${formattedPair} has been sent to n8n for real-time processing. The system will gather live market data, technical indicators, and sentiment analysis to provide comprehensive insights.`,
        trendDirection: 'neutral',
        marketFactors: [
          {
            name: 'n8n Integration',
            description: 'Successfully connected to n8n workflow for real-time analysis',
            sentiment: 'bullish'
          }
        ],
        chartPatterns: [],
        priceLevels: [],
        tradingInsight: 'n8n workflow is processing your analysis request with live market data sources.'
      };

      console.log('📈 Analysis request successful, incrementing usage count...');
      try {
        const updatedUsage = await incrementUsage();
        
        if (updatedUsage) {
          console.log('✅ Usage incremented successfully:', {
            daily: `${updatedUsage.daily_count}/${updatedUsage.daily_limit}`,
            monthly: `${updatedUsage.monthly_count}/${updatedUsage.monthly_limit}`,
            tier: updatedUsage.subscription_tier,
            can_analyze: updatedUsage.can_analyze
          });
        }
      } catch (usageError) {
        console.error('❌ Error incrementing usage:', usageError);
        toast({
          title: "Usage Count Error", 
          description: "Analysis completed but usage count failed to update.",
          variant: "destructive",
        });
      }
      
      setAnalysisResult(mockAnalysisResult);
      setLatestAnalysis(mockAnalysisResult);

      toast({
        title: "Analysis Request Sent",
        description: `Successfully sent ${formattedPair} analysis request to n8n workflow for real-time processing`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("❌ Error analyzing pair with n8n:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to send analysis request. Please try again.",
        variant: "destructive",
      });
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzePair,
  };
};
