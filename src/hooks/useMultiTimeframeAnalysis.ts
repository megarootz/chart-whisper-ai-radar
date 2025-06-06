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
      
      console.log('✅ Usage limits check passed, proceeding with multi-timeframe analysis');
      
      // Convert all images to base64
      const chartData = await Promise.all(
        charts.map(async (chart, index) => ({
          base64Image: await fileToBase64(chart.file),
          chartNumber: index + 1
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

      // Parse the text response to extract structured data
      const resultText = responseData.choices[0].message.content || '';
      console.log("📝 Raw API Response content received");
      
      // Process response with improved parsing
      const analysisData = processMultiTimeframeResult(resultText, charts.length);
      console.log("🔄 Multi-timeframe analysis data processed:", { 
        pairName: analysisData.pairName, 
        chartCount: charts.length 
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
        description: `Successfully analyzed ${charts.length} charts using ${technique} technique`,
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

  const processMultiTimeframeResult = (resultText: string, chartCount: number): AnalysisResultData => {
    console.log("🔍 Processing multi-timeframe result:", resultText.substring(0, 200));
    
    // Extract pair name
    const pairMatch = resultText.match(/\*\*PAIR:\*\*\s*([A-Z\/]+)/i) || 
                     resultText.match(/pair:\s*([A-Z\/]+)/i) ||
                     resultText.match(/\b([A-Z]{3}\/[A-Z]{3})\b/);
    const symbol = pairMatch ? pairMatch[1] : "Multi-Timeframe Analysis";
    
    // Extract trend with brief description
    const trendMatch = resultText.match(/\*\*TREND:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let trendDescription = "";
    
    if (trendMatch) {
      const trendText = trendMatch[1].trim();
      trendDescription = trendText;
      if (trendText.toLowerCase().includes('bullish')) {
        overallSentiment = 'bullish';
      } else if (trendText.toLowerCase().includes('bearish')) {
        overallSentiment = 'bearish';
      }
    }
    
    // Extract support levels
    const supportMatch = resultText.match(/\*\*SUPPORT:\*\*\s*([^\n\*]+)/i);
    const supportLevels = [];
    if (supportMatch) {
      const supportText = supportMatch[1];
      const prices = supportText.match(/[\d.]+/g);
      if (prices) {
        prices.forEach((price, index) => {
          supportLevels.push({
            name: `Support Level ${index + 1}`,
            price: price,
            direction: 'up' as const
          });
        });
      }
    }
    
    // Extract resistance levels
    const resistanceMatch = resultText.match(/\*\*RESISTANCE:\*\*\s*([^\n\*]+)/i);
    const resistanceLevels = [];
    if (resistanceMatch) {
      const resistanceText = resistanceMatch[1];
      const prices = resistanceText.match(/[\d.]+/g);
      if (prices) {
        prices.forEach((price, index) => {
          resistanceLevels.push({
            name: `Resistance Level ${index + 1}`,
            price: price,
            direction: 'down' as const
          });
        });
      }
    }
    
    // Extract patterns
    const patternMatch = resultText.match(/\*\*PATTERNS:\*\*\s*([^\n\*]+)/i);
    const chartPatterns = [];
    if (patternMatch) {
      const patternText = patternMatch[1];
      const parts = patternText.split(' - ');
      if (parts.length >= 3) {
        const confidenceMatch = parts[1].match(/(\d+)%/);
        const signal = parts[2].toLowerCase().includes('bullish') ? 'bullish' : 
                      parts[2].toLowerCase().includes('bearish') ? 'bearish' : 'neutral';
        chartPatterns.push({
          name: parts[0],
          confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 75,
          signal: signal as 'bullish' | 'bearish' | 'neutral'
        });
      }
    }
    
    // Extract indicators
    const indicatorMatch = resultText.match(/\*\*INDICATORS:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const marketFactors = [];
    if (indicatorMatch) {
      const indicatorText = indicatorMatch[1];
      const lines = indicatorText.split('\n').filter(line => line.trim() && line.includes(':'));
      lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const sentiment = line.toLowerCase().includes('bullish') ? 'bullish' : 
                           line.toLowerCase().includes('bearish') ? 'bearish' : 'neutral';
          marketFactors.push({
            name: parts[0].trim(),
            description: parts[1].trim(),
            sentiment: sentiment as 'bullish' | 'bearish' | 'neutral'
          });
        }
      });
    }
    
    // Only return data if we have meaningful content, otherwise return minimal structure
    const hasContent = supportLevels.length > 0 || resistanceLevels.length > 0 || 
                      chartPatterns.length > 0 || marketFactors.length > 0 || 
                      trendDescription.length > 0;
    
    if (!hasContent) {
      return {
        pairName: symbol,
        timeframe: `${chartCount} charts analyzed`,
        overallSentiment: 'neutral',
        confidenceScore: 50,
        marketAnalysis: "Multi-timeframe analysis completed. Please check the charts for clearer patterns or try uploading higher quality images.",
        trendDirection: 'neutral',
        marketFactors: [],
        chartPatterns: [],
        priceLevels: [],
        tradingInsight: "Analysis requires clearer chart patterns to provide specific insights."
      };
    }
    
    return {
      pairName: symbol,
      timeframe: `${chartCount} charts analyzed`,
      overallSentiment,
      confidenceScore: 85,
      marketAnalysis: trendDescription || resultText.substring(0, 500),
      trendDirection: overallSentiment,
      marketFactors,
      chartPatterns,
      priceLevels: [...supportLevels, ...resistanceLevels],
      tradingInsight: resultText
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
