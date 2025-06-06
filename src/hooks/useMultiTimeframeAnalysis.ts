
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

      // Get the natural analysis text
      const analysisText = responseData.choices[0].message.content || '';
      console.log("📝 Raw API Response content received");
      
      // Process the natural language response
      const analysisData = processNaturalAnalysis(analysisText, charts.length, technique);
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

  const processNaturalAnalysis = (analysisText: string, chartCount: number, technique: string): AnalysisResultData => {
    console.log("🔍 Processing natural language analysis:", analysisText.substring(0, 200));
    
    // Extract trading pair - look for common forex pairs
    const pairPatterns = [
      /\b([A-Z]{3}\/[A-Z]{3})\b/g,
      /\b(EUR|USD|GBP|JPY|AUD|NZD|CAD|CHF|XAU|XAG|BTC|ETH)[A-Z]{3}\b/gi
    ];
    
    let symbol = "Multi-Timeframe Analysis";
    for (const pattern of pairPatterns) {
      const matches = analysisText.match(pattern);
      if (matches && matches.length > 0) {
        symbol = matches[0].toUpperCase();
        if (!symbol.includes('/') && symbol.length === 6) {
          // Add slash for standard pairs like EURUSD -> EUR/USD
          symbol = `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
        }
        break;
      }
    }
    
    // Determine overall sentiment from the text
    let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    const bullishWords = ['bullish', 'uptrend', 'buy', 'long', 'rise', 'higher', 'support', 'breakout upward'];
    const bearishWords = ['bearish', 'downtrend', 'sell', 'short', 'fall', 'lower', 'resistance', 'breakdown'];
    
    const lowerText = analysisText.toLowerCase();
    const bullishCount = bullishWords.filter(word => lowerText.includes(word)).length;
    const bearishCount = bearishWords.filter(word => lowerText.includes(word)).length;
    
    if (bullishCount > bearishCount) {
      overallSentiment = 'bullish';
    } else if (bearishCount > bullishCount) {
      overallSentiment = 'bearish';
    }
    
    // Extract support and resistance levels
    const pricePattern = /(\d{1,2}[,.]?\d{2,4})/g;
    const priceMatches = analysisText.match(pricePattern) || [];
    const supportLevels = [];
    const resistanceLevels = [];
    
    // Look for support mentions
    const supportSections = analysisText.match(/support[^.]*?(\d{1,2}[,.]?\d{2,4})/gi) || [];
    supportSections.forEach((section, index) => {
      const priceMatch = section.match(/(\d{1,2}[,.]?\d{2,4})/);
      if (priceMatch) {
        supportLevels.push({
          name: `Support Level ${index + 1}`,
          price: priceMatch[1],
          direction: 'up' as const
        });
      }
    });
    
    // Look for resistance mentions
    const resistanceSections = analysisText.match(/resistance[^.]*?(\d{1,2}[,.]?\d{2,4})/gi) || [];
    resistanceSections.forEach((section, index) => {
      const priceMatch = section.match(/(\d{1,2}[,.]?\d{2,4})/);
      if (priceMatch) {
        resistanceLevels.push({
          name: `Resistance Level ${index + 1}`,
          price: priceMatch[1],
          direction: 'down' as const
        });
      }
    });
    
    // Extract chart patterns
    const patternKeywords = ['triangle', 'flag', 'pennant', 'head and shoulders', 'double top', 'double bottom', 'wedge', 'channel'];
    const chartPatterns = [];
    
    patternKeywords.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        const patternContext = lowerText.substring(
          Math.max(0, lowerText.indexOf(pattern) - 50),
          Math.min(lowerText.length, lowerText.indexOf(pattern) + pattern.length + 50)
        );
        
        if (bullishWords.some(word => patternContext.includes(word))) {
          signal = 'bullish';
        } else if (bearishWords.some(word => patternContext.includes(word))) {
          signal = 'bearish';
        }
        
        chartPatterns.push({
          name: pattern.charAt(0).toUpperCase() + pattern.slice(1),
          confidence: 75,
          signal,
          status: 'complete' as const
        });
      }
    });
    
    // Extract technical indicators
    const indicators = ['RSI', 'MACD', 'moving average', 'stochastic', 'volume'];
    const marketFactors = [];
    
    indicators.forEach(indicator => {
      const regex = new RegExp(indicator + '[^.]*?[.]', 'gi');
      const matches = analysisText.match(regex);
      if (matches) {
        matches.forEach(match => {
          let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          if (bullishWords.some(word => match.toLowerCase().includes(word))) {
            sentiment = 'bullish';
          } else if (bearishWords.some(word => match.toLowerCase().includes(word))) {
            sentiment = 'bearish';
          }
          
          marketFactors.push({
            name: indicator.toUpperCase(),
            description: match.trim(),
            sentiment
          });
        });
      }
    });
    
    // Create a confidence score based on analysis quality
    const confidenceScore = Math.min(95, 60 + (chartPatterns.length * 5) + (marketFactors.length * 3) + (priceMatches.length * 2));
    
    return {
      pairName: symbol,
      timeframe: `${chartCount} Timeframes`,
      overallSentiment,
      confidenceScore,
      marketAnalysis: analysisText,
      trendDirection: overallSentiment,
      marketFactors,
      chartPatterns,
      priceLevels: [...supportLevels, ...resistanceLevels],
      tradingInsight: analysisText
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
