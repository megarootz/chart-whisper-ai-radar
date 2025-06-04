
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const useDeepSeekAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setLatestAnalysis, addToHistory } = useAnalysis();
  const { incrementUsage, checkUsageLimits } = useSubscription();

  const saveAnalysisToDatabase = async (analysisData: AnalysisResultData) => {
    try {
      if (!user) {
        console.log("❌ User not logged in, cannot save analysis");
        return;
      }
      
      console.log("💾 Saving DeepSeek analysis to database for user:", user.id, user.email);
      
      const analysisWithTimestamp = {
        ...analysisData,
        created_at: new Date().toISOString()
      };
      
      const analysisDataJson: Json = JSON.parse(JSON.stringify(analysisWithTimestamp));
      
      const { data, error } = await supabase
        .from('chart_analyses')
        .insert({
          user_id: user.id,
          analysis_data: analysisDataJson,
          pair_name: analysisData.pairName,
          timeframe: analysisData.timeframe,
          chart_url: null,
          created_at: analysisWithTimestamp.created_at
        })
        .select()
        .single();
      
      if (error) {
        console.error("❌ Error saving analysis to database:", error);
        toast({
          title: "Error",
          description: "Failed to save analysis to history",
          variant: "destructive",
        });
      } else {
        console.log("✅ Analysis saved to database successfully", data);
        
        if (data) {
          addToHistory({
            id: data.id,
            created_at: data.created_at,
            pairName: analysisData.pairName,
            timeframe: analysisData.timeframe,
            overallSentiment: analysisData.overallSentiment,
            marketAnalysis: analysisData.marketAnalysis
          });
        }
        
        toast({
          title: "Success",
          description: "Analysis saved to your history",
          variant: "default",
        });
      }
    } catch (err) {
      console.error("❌ Error in saveAnalysisToDatabase:", err);
      toast({
        title: "Error",
        description: "Failed to save analysis to history",
        variant: "destructive",
      });
    }
  };

  const analyzePair = async (pairName: string, timeframe: string) => {
    try {
      setIsAnalyzing(true);
      
      if (!user) {
        console.error('❌ AUTHENTICATION REQUIRED: User must be logged in to analyze pairs');
        toast({
          title: "Authentication Required",
          description: "You must be logged in to analyze currency pairs. Please sign in first.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 Starting DeepSeek analysis for authenticated user:', user.id, 'pair:', pairName, 'timeframe:', timeframe);

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
      
      console.log('✅ Usage limits check passed, proceeding with DeepSeek analysis');
      
      console.log("🤖 Calling DeepSeek Supabase Edge Function");
      
      const { data, error } = await supabase.functions.invoke("analyze-pair", {
        body: {
          pairName,
          timeframe
        }
      });
      
      if (error) {
        console.error("❌ Edge function error:", error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from DeepSeek analysis function');
      }

      console.log("✅ DeepSeek edge function response received");
      
      const responseData = data as any;
      
      if (!responseData.choices || responseData.choices.length === 0) {
        throw new Error('No response content from DeepSeek API');
      }

      const resultText = responseData.choices[0].message.content || '';
      console.log("📝 Raw DeepSeek Response content received");
      
      // Create analysis data with the raw DeepSeek response in a chat format
      const analysisData: AnalysisResultData = {
        pairName,
        timeframe,
        overallSentiment: 'neutral',
        confidenceScore: 95,
        marketAnalysis: resultText,
        trendDirection: 'neutral',
        marketFactors: [],
        chartPatterns: [],
        priceLevels: [],
        tradingInsight: resultText
      };
      
      console.log('📈 Analysis successful, incrementing usage count...');
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          console.error('❌ User session expired during analysis');
          throw new Error('User session expired. Please sign in again.');
        }
        
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
        console.error('❌ CRITICAL Error incrementing usage:', usageError);
        toast({
          title: "Usage Count Error", 
          description: "Analysis completed but usage count failed to update. Please contact support if this continues.",
          variant: "destructive",
        });
      }
      
      setAnalysisResult(analysisData);
      setLatestAnalysis(analysisData);
      await saveAnalysisToDatabase(analysisData);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${analysisData.pairName} on ${analysisData.timeframe} timeframe using DeepSeek's real-time analysis`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("❌ Error analyzing pair with DeepSeek:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the currency pair. Please try again.",
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
