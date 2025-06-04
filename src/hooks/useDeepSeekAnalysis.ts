
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
  const [streamingContent, setStreamingContent] = useState<string>('');
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
      setStreamingContent('');
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

      console.log('🔍 Starting DeepSeek streaming analysis for authenticated user:', user.id, 'pair:', pairName, 'timeframe:', timeframe);

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
      
      console.log('✅ Usage limits check passed, proceeding with DeepSeek streaming analysis');
      
      console.log("🤖 Calling DeepSeek Streaming Supabase Edge Function");
      
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

      // Handle streaming response
      if (data && data instanceof ReadableStream) {
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content;
                    fullContent += content;
                    setStreamingContent(fullContent);
                    
                    // Update the analysis result with streaming content
                    const streamingAnalysis: AnalysisResultData = {
                      pairName,
                      timeframe,
                      overallSentiment: 'neutral',
                      confidenceScore: 95,
                      marketAnalysis: fullContent,
                      trendDirection: 'neutral',
                      marketFactors: [],
                      chartPatterns: [],
                      priceLevels: [],
                      tradingInsight: fullContent
                    };
                    setAnalysisResult(streamingAnalysis);
                  }
                } catch (parseError) {
                  console.log('Could not parse chunk:', data);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Create final analysis data
        const finalAnalysisData: AnalysisResultData = {
          pairName,
          timeframe,
          overallSentiment: 'neutral',
          confidenceScore: 95,
          marketAnalysis: fullContent,
          trendDirection: 'neutral',
          marketFactors: [],
          chartPatterns: [],
          priceLevels: [],
          tradingInsight: fullContent
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
        
        setLatestAnalysis(finalAnalysisData);
        await saveAnalysisToDatabase(finalAnalysisData);

        toast({
          title: "Analysis Complete",
          description: `Successfully analyzed ${finalAnalysisData.pairName} on ${finalAnalysisData.timeframe} timeframe using DeepSeek's real-time search analysis`,
          variant: "default",
        });
      } else {
        throw new Error('No streaming response from DeepSeek analysis function');
      }
      
    } catch (error) {
      console.error("❌ Error analyzing pair with DeepSeek:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the currency pair. Please try again.",
        variant: "destructive",
      });
      setAnalysisResult(null);
      setStreamingContent('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analysisResult,
    streamingContent,
    analyzePair,
  };
};
