
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData, MarketFactor, ChartPattern, PriceLevel, TradingSetup } from '@/components/AnalysisResult';
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
      
      const analysisData = processDeepSeekResult(resultText, pairName, timeframe);
      console.log("🔄 DeepSeek analysis data processed:", { pairName: analysisData.pairName, timeframe: analysisData.timeframe });
      
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
        description: `Successfully analyzed ${analysisData.pairName} on ${analysisData.timeframe} timeframe using real-time market data`,
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

  const processDeepSeekResult = (resultText: string, pairName: string, timeframe: string): AnalysisResultData => {
    // Extract current market data section
    const currentMarketMatch = resultText.match(/1\.\s+CURRENT\s+MARKET\s+DATA:([\s\S]+?)(?=2\.\s+TECHNICAL\s+ANALYSIS|$)/i);
    const currentMarketData = currentMarketMatch ? currentMarketMatch[1].trim() : '';
    
    // Extract technical analysis section
    const technicalMatch = resultText.match(/2\.\s+TECHNICAL\s+ANALYSIS:([\s\S]+?)(?=3\.\s+FUNDAMENTAL\s+ANALYSIS|$)/i);
    const technicalAnalysis = technicalMatch ? technicalMatch[1].trim() : '';
    
    // Extract fundamental analysis section
    const fundamentalMatch = resultText.match(/3\.\s+FUNDAMENTAL\s+ANALYSIS:([\s\S]+?)(?=4\.\s+TRADING\s+INSIGHTS|$)/i);
    const fundamentalAnalysis = fundamentalMatch ? fundamentalMatch[1].trim() : '';
    
    // Extract trading insights section
    const tradingMatch = resultText.match(/4\.\s+TRADING\s+INSIGHTS:([\s\S]+?)(?=5\.\s+MARKET\s+OUTLOOK|$)/i);
    const tradingInsights = tradingMatch ? tradingMatch[1].trim() : '';
    
    // Extract market outlook section
    const outlookMatch = resultText.match(/5\.\s+MARKET\s+OUTLOOK:([\s\S]+?)$/i);
    const marketOutlook = outlookMatch ? outlookMatch[1].trim() : '';
    
    // Combine all sections for market analysis
    const marketAnalysis = [currentMarketData, technicalAnalysis, fundamentalAnalysis].filter(Boolean).join('\n\n');
    
    // Determine overall sentiment
    const textLower = resultText.toLowerCase();
    let overallSentiment: 'bullish' | 'bearish' | 'neutral' | 'mildly bullish' | 'mildly bearish' = 'neutral';
    
    if (textLower.includes('bullish outlook') || textLower.includes('upward trend') || textLower.includes('buy signal')) {
      overallSentiment = 'bullish';
    } else if (textLower.includes('bearish outlook') || textLower.includes('downward trend') || textLower.includes('sell signal')) {
      overallSentiment = 'bearish';
    } else if (textLower.includes('mildly bullish') || textLower.includes('cautiously bullish')) {
      overallSentiment = 'mildly bullish';
    } else if (textLower.includes('mildly bearish') || textLower.includes('cautiously bearish')) {
      overallSentiment = 'mildly bearish';
    }
    
    // Extract price levels
    const priceLevels = extractPriceLevelsFromText(technicalAnalysis);
    
    // Extract market factors from fundamental analysis
    const marketFactors = extractMarketFactorsFromText(fundamentalAnalysis);
    
    // Extract chart patterns
    const chartPatterns = extractChartPatternsFromText(technicalAnalysis);
    
    // Create trading setup from insights
    const tradingSetup = extractTradingSetupFromText(tradingInsights, timeframe);
    
    return {
      pairName,
      timeframe,
      overallSentiment,
      confidenceScore: 85, // Higher confidence due to real-time data
      marketAnalysis,
      trendDirection: overallSentiment as any,
      marketFactors,
      chartPatterns,
      priceLevels,
      tradingSetup,
      tradingInsight: [tradingInsights, marketOutlook].filter(Boolean).join('\n\n')
    };
  };

  const extractPriceLevelsFromText = (text: string): PriceLevel[] => {
    const levels: PriceLevel[] = [];
    
    // Extract support levels
    const supportMatches = text.match(/support[^0-9]*([0-9,.]+)/gi);
    if (supportMatches) {
      supportMatches.forEach((match, index) => {
        const priceMatch = match.match(/([0-9,.]+)/);
        if (priceMatch) {
          levels.push({
            name: `Support Level ${index + 1}`,
            price: priceMatch[1],
            direction: 'down'
          });
        }
      });
    }
    
    // Extract resistance levels
    const resistanceMatches = text.match(/resistance[^0-9]*([0-9,.]+)/gi);
    if (resistanceMatches) {
      resistanceMatches.forEach((match, index) => {
        const priceMatch = match.match(/([0-9,.]+)/);
        if (priceMatch) {
          levels.push({
            name: `Resistance Level ${index + 1}`,
            price: priceMatch[1],
            direction: 'up'
          });
        }
      });
    }
    
    return levels;
  };

  const extractMarketFactorsFromText = (text: string): MarketFactor[] => {
    const factors: MarketFactor[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        const cleanLine = line.replace(/[•\-*]/, '').trim();
        if (cleanLine) {
          let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          const lineLower = cleanLine.toLowerCase();
          
          if (lineLower.includes('positive') || lineLower.includes('bullish') || lineLower.includes('supportive')) {
            sentiment = 'bullish';
          } else if (lineLower.includes('negative') || lineLower.includes('bearish') || lineLower.includes('pressure')) {
            sentiment = 'bearish';
          }
          
          factors.push({
            name: 'Economic Factor',
            description: cleanLine,
            sentiment
          });
        }
      }
    });
    
    return factors;
  };

  const extractChartPatternsFromText = (text: string): ChartPattern[] => {
    const patterns: ChartPattern[] = [];
    const patternTypes = [
      'double top', 'double bottom', 'head and shoulders', 'triangle', 
      'flag', 'pennant', 'wedge', 'channel', 'breakout'
    ];
    
    patternTypes.forEach(pattern => {
      if (text.toLowerCase().includes(pattern)) {
        let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        const contextIndex = text.toLowerCase().indexOf(pattern);
        const context = text.substring(Math.max(0, contextIndex - 100), contextIndex + pattern.length + 100).toLowerCase();
        
        if (context.includes('bullish') || context.includes('upward')) {
          signal = 'bullish';
        } else if (context.includes('bearish') || context.includes('downward')) {
          signal = 'bearish';
        }
        
        patterns.push({
          name: pattern.charAt(0).toUpperCase() + pattern.slice(1),
          confidence: 80,
          signal,
          status: context.includes('forming') ? 'forming' : 'complete'
        });
      }
    });
    
    return patterns;
  };

  const extractTradingSetupFromText = (text: string, timeframe: string): TradingSetup | undefined => {
    const bullishMatch = text.match(/bullish\s+scenario[^:]*:([\s\S]+?)(?=bearish\s+scenario|$)/i);
    const bearishMatch = text.match(/bearish\s+scenario[^:]*:([\s\S]+?)(?=bullish\s+scenario|$)/i);
    
    if (bullishMatch) {
      const bullishText = bullishMatch[1];
      const stopMatch = bullishText.match(/stop[\s-]*loss[^0-9]*([0-9,.]+)/i);
      const targetMatch = bullishText.match(/target[^0-9]*([0-9,.]+)/i);
      
      return {
        type: 'long',
        description: bullishText.trim(),
        confidence: 80,
        timeframe,
        stopLoss: stopMatch ? stopMatch[1] : undefined,
        takeProfits: targetMatch ? [targetMatch[1]] : [],
        riskRewardRatio: "1:2"
      };
    } else if (bearishMatch) {
      const bearishText = bearishMatch[1];
      const stopMatch = bearishText.match(/stop[\s-]*loss[^0-9]*([0-9,.]+)/i);
      const targetMatch = bearishText.match(/target[^0-9]*([0-9,.]+)/i);
      
      return {
        type: 'short',
        description: bearishText.trim(),
        confidence: 80,
        timeframe,
        stopLoss: stopMatch ? stopMatch[1] : undefined,
        takeProfits: targetMatch ? [targetMatch[1]] : [],
        riskRewardRatio: "1:2"
      };
    }
    
    return undefined;
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzePair,
  };
};
