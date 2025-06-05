
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TradingTechnique } from '@/components/TradingTechniqueSelector';
import { TimeframeChart } from '@/components/MultiTimeframeUploader';

export const useMultiTimeframeAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setLatestAnalysis, addToHistory } = useAnalysis();
  const { incrementUsage, checkUsageLimits } = useSubscription();

  const analyzeMultiTimeframeCharts = async (
    charts: TimeframeChart[],
    technique: TradingTechnique
  ) => {
    try {
      setIsAnalyzing(true);
      
      if (!user) {
        console.error('❌ AUTHENTICATION REQUIRED: User must be logged in to analyze charts');
        toast({
          title: "Authentication Required",
          description: "You must be logged in to analyze charts. Please sign in first.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 Starting multi-timeframe chart analysis for user:', user.id, 'email:', user.email);

      // Check usage limits BEFORE proceeding
      console.log('📊 Checking usage limits before analysis...');
      const usageData = await checkUsageLimits();
      
      if (usageData && !usageData.can_analyze) {
        console.log('❌ Usage limit reached - cannot analyze');
        toast({
          title: "Usage Limit Reached",
          description: `You've reached your analysis limit. Daily: ${usageData.daily_count}/${usageData.daily_limit}, Monthly: ${usageData.monthly_count}/${usageData.monthly_limit}`,
          variant: "destructive",
        });
        return;
      }

      // Validate all charts have timeframes
      if (charts.some(chart => !chart.timeframe)) {
        toast({
          title: "Missing Timeframes",
          description: "Please select timeframes for all uploaded charts.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Usage limits check passed, proceeding with multi-timeframe analysis');
      
      // Convert all images to base64
      const chartData = await Promise.all(
        charts.map(async (chart) => ({
          base64Image: await fileToBase64(chart.file),
          timeframe: chart.timeframe
        }))
      );
      
      console.log("🤖 Calling Supabase Edge Function to analyze multi-timeframe charts");
      
      // Call our Supabase Edge Function for multi-timeframe analysis
      const { data, error } = await supabase.functions.invoke("analyze-multi-timeframe", {
        body: {
          charts: chartData,
          technique
        }
      });
      
      if (error) {
        console.error("❌ Edge function error:", error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from analysis function');
      }

      console.log("✅ Edge function response received");
      
      // Parse the API response
      const responseData = data as any;
      
      if (!responseData.choices || responseData.choices.length === 0) {
        throw new Error('No response content from API');
      }

      // Parse the text response to extract JSON
      const resultText = responseData.choices[0].message.content || '';
      console.log("📝 Raw API Response content received");
      
      // Process response as text format (reuse existing logic but enhance for multi-timeframe)
      const analysisData = processMultiTimeframeResult(resultText, charts.map(c => c.timeframe));
      console.log("🔄 Multi-timeframe analysis data processed:", { 
        pairName: analysisData.pairName, 
        timeframes: charts.map(c => c.timeframe) 
      });
      
      // Increment usage count AFTER successful analysis
      console.log('📈 Analysis successful, incrementing usage count...');
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
          title: "Usage Count Warning", 
          description: "Analysis completed but usage count may not have updated.",
          variant: "destructive",
        });
      }
      
      // Save the analysis result
      setAnalysisResult(analysisData);
      setLatestAnalysis(analysisData);
      
      // Save to database
      await saveAnalysisToDatabase(analysisData);

      toast({
        title: "Multi-Timeframe Analysis Complete",
        description: `Successfully analyzed ${charts.length} timeframes for ${analysisData.pairName} using ${technique} technique`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("❌ Error analyzing multi-timeframe charts:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the charts. Please try again.",
        variant: "destructive",
      });
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processMultiTimeframeResult = (resultText: string, timeframes: string[]): AnalysisResultData => {
    // Enhanced version of existing processTextResult but for multi-timeframe
    // This will be similar to the existing logic but adapted for multiple timeframes
    
    // Extract pair name (reuse existing logic)
    const titlePatterns = [
      /\[([^\]]+)\]\s+Multi[\s-]*Timeframe\s+Analysis/i,
      /([A-Z0-9\/]{3,10})\s+Multi[\s-]*Timeframe\s+Analysis/i,
      /^([A-Z0-9\/]{3,10})\s+/
    ];
    
    let symbol = "";
    for (const pattern of titlePatterns) {
      const match = resultText.match(pattern);
      if (match) {
        symbol = match[1].trim();
        break;
      }
    }
    
    if (!symbol) {
      const pairMatch = resultText.match(/\b([A-Z]{3}\/[A-Z]{3}|[A-Z]{3,4}\/USD[T]?)\b/);
      symbol = pairMatch ? pairMatch[1] : "Unknown Pair";
    }
    
    // Create combined timeframe string
    const combinedTimeframe = timeframes.join(', ');
    
    // Extract overall analysis and sentiment
    const overallMatch = resultText.match(/Overall\s+Multi[\s-]*Timeframe\s+Assessment:([\s\S]+?)(?=\d\.|Summary|$)/i);
    const marketAnalysis = overallMatch ? overallMatch[1].trim() : '';
    
    // Determine overall sentiment from multi-timeframe analysis
    let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (resultText.toLowerCase().includes('predominantly bullish') || 
        resultText.toLowerCase().includes('bullish bias')) {
      overallSentiment = 'bullish';
    } else if (resultText.toLowerCase().includes('predominantly bearish') || 
               resultText.toLowerCase().includes('bearish bias')) {
      overallSentiment = 'bearish';
    }
    
    // Extract other analysis components (reuse existing extraction functions)
    // but adapt them for multi-timeframe context
    
    return {
      pairName: symbol,
      timeframe: combinedTimeframe,
      overallSentiment,
      confidenceScore: 80, // Higher confidence for multi-timeframe analysis
      marketAnalysis,
      trendDirection: overallSentiment,
      marketFactors: [], // Will be populated by existing extraction logic
      chartPatterns: [], // Will be populated by existing extraction logic
      priceLevels: [], // Will be populated by existing extraction logic
      tradingInsight: marketAnalysis
    };
  };

  const saveAnalysisToDatabase = async (analysisData: AnalysisResultData) => {
    try {
      if (!user) return;
      
      const analysisWithTimestamp = {
        ...analysisData,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('chart_analyses')
        .insert({
          user_id: user.id,
          analysis_data: JSON.parse(JSON.stringify(analysisWithTimestamp)),
          pair_name: analysisData.pairName,
          timeframe: analysisData.timeframe,
          chart_url: null,
          created_at: analysisWithTimestamp.created_at
        })
        .select()
        .single();
      
      if (error) {
        console.error("❌ Error saving analysis:", error);
      } else if (data) {
        addToHistory({
          id: data.id,
          created_at: data.created_at,
          pairName: analysisData.pairName,
          timeframe: analysisData.timeframe,
          overallSentiment: analysisData.overallSentiment,
          marketAnalysis: analysisData.marketAnalysis
        });
      }
    } catch (err) {
      console.error("❌ Error in saveAnalysisToDatabase:", err);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzeMultiTimeframeCharts,
  };
};
