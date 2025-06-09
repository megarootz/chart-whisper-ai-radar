
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData, MarketFactor, ChartPattern, PriceLevel, TradingSetup } from '@/components/AnalysisResult';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { formatTradingPair } from '@/utils/tradingPairUtils';

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setLatestAnalysis, addToHistory } = useAnalysis();
  const { incrementUsage, checkUsageLimits } = useSubscription();

  // Save analysis to database with client timestamp
  const saveAnalysisToDatabase = async (analysisData: AnalysisResultData) => {
    try {
      if (!user) {
        console.log("❌ User not logged in, cannot save analysis");
        return;
      }
      
      console.log("💾 Saving analysis to database for user:", user.id, user.email);
      
      // Add client timestamp to analysis data
      const analysisWithTimestamp = {
        ...analysisData,
        created_at: new Date().toISOString()
      };
      
      // Convert AnalysisResultData to a JSON-compatible object
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

  const analyzeChart = async (file: File, pairName: string, timeframe: string) => {
    try {
      setIsAnalyzing(true);
      
      // CRITICAL: Check authentication first
      if (!user) {
        console.error('❌ AUTHENTICATION REQUIRED: User must be logged in to analyze charts');
        toast({
          title: "Authentication Required",
          description: "You must be logged in to analyze charts. Please sign in first.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 Starting enhanced chart analysis for authenticated user:', user.id, 'email:', user.email);
      console.log('📊 Analysis parameters:', { 
        pairName, 
        timeframe, 
        fileName: file.name, 
        fileSize: file.size,
        fileType: file.type 
      });

      // Check usage limits BEFORE proceeding
      console.log('📊 Checking usage limits before analysis...');
      const usageData = await checkUsageLimits();
      console.log('📊 Current usage status:', usageData);
      
      if (usageData) {
        console.log('📊 Detailed usage check:', {
          tier: usageData.subscription_tier,
          daily: `${usageData.daily_count}/${usageData.daily_limit}`,
          monthly: `${usageData.monthly_count}/${usageData.monthly_limit}`,
          can_analyze: usageData.can_analyze,
          daily_remaining: usageData.daily_remaining,
          monthly_remaining: usageData.monthly_remaining
        });

        if (!usageData.can_analyze) {
          console.log('❌ Usage limit reached - cannot analyze');
          toast({
            title: "Usage Limit Reached",
            description: `You've reached your analysis limit. Daily: ${usageData.daily_count}/${usageData.daily_limit}, Monthly: ${usageData.monthly_count}/${usageData.monthly_limit}`,
            variant: "destructive",
          });
          return;
        }

        if (usageData.daily_count >= usageData.daily_limit) {
          console.log('❌ Daily limit specifically reached');
          toast({
            title: "Daily Limit Reached",
            description: `You've used all ${usageData.daily_limit} analyses for today. Please wait until tomorrow or upgrade your plan.`,
            variant: "destructive",
          });
          return;
        }

        if (usageData.monthly_count >= usageData.monthly_limit) {
          console.log('❌ Monthly limit specifically reached');
          toast({
            title: "Monthly Limit Reached",
            description: `You've used all ${usageData.monthly_limit} analyses for this month. Please upgrade your plan.`,
            variant: "destructive",
          });
          return;
        }
      }
      
      console.log('✅ Usage limits check passed, proceeding with enhanced analysis');
      
      // Convert image to base64
      console.log('🔄 Converting image to base64...');
      const base64Image = await fileToBase64(file);
      console.log('✅ Base64 conversion complete, length:', base64Image.length, 'characters');
      
      // Log the first few characters of the base64 to verify it's a real image
      const base64Header = base64Image.substring(0, 50);
      console.log('🖼️ Base64 header:', base64Header);
      
      console.log("🤖 Calling Enhanced Supabase Edge Function to analyze chart");
      console.log('📤 Sending data:', {
        pairName,
        timeframe,
        base64Length: base64Image.length,
        hasValidImageHeader: base64Image.startsWith('data:image/')
      });
      
      // Call our enhanced Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: {
          base64Image,
          pairName,
          timeframe
        }
      });
      
      if (error) {
        console.error("❌ Edge function error:", error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from enhanced analysis function');
      }

      console.log("✅ Enhanced edge function response received");
      console.log('📥 Raw response type:', typeof data);
      
      // Parse the API response
      const responseData = data as any;
      
      if (!responseData.choices || responseData.choices.length === 0) {
        console.error('❌ Invalid response structure:', responseData);
        throw new Error('No response content from API');
      }

      // Parse the enhanced text response
      const resultText = responseData.choices[0].message.content || '';
      console.log("📝 Enhanced API Response content length:", resultText.length);
      console.log("📝 First 300 chars of enhanced response:", resultText.substring(0, 300));
      
      // Process enhanced response with provided parameters
      console.log('🔄 Processing enhanced text result with provided parameters:', { pairName, timeframe });
      const analysisData = processEnhancedTextResult(resultText, pairName, timeframe);
      console.log("🎯 Enhanced analysis data processed:", { 
        pairName: analysisData.pairName, 
        timeframe: analysisData.timeframe,
        overallSentiment: analysisData.overallSentiment
      });
      
      // CRITICAL: Increment usage count AFTER successful analysis
      console.log('📈 Enhanced analysis successful, incrementing usage count...');
      try {
        console.log('📈 Current user state:', { id: user.id, email: user.email, isAuthenticated: !!user });
        
        // Double-check user is still authenticated
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
        } else {
          console.error('❌ incrementUsage returned null/undefined');
          toast({
            title: "Usage Count Warning", 
            description: "Analysis completed but usage count may not have updated. Please refresh the page.",
            variant: "destructive",
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
      
      // Save the enhanced analysis result
      setAnalysisResult(analysisData);
      
      // Update the latest analysis in the context
      setLatestAnalysis(analysisData);
      
      // Save the analysis to Supabase
      await saveAnalysisToDatabase(analysisData);

      toast({
        title: "Enhanced Analysis Complete",
        description: `Successfully analyzed the ${analysisData.pairName} chart on ${analysisData.timeframe} timeframe with institutional-grade analysis`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("❌ Error analyzing chart:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the chart. Please try again.",
        variant: "destructive",
      });
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processEnhancedTextResult = (resultText: string, providedPairName?: string, providedTimeframe?: string): AnalysisResultData => {
    // Always use provided parameters when available (from automated analysis)
    let symbol = "";
    let timeframe = "";
    
    console.log('🎯 processEnhancedTextResult called with:', { 
      providedPairName, 
      providedTimeframe, 
      resultTextLength: resultText.length 
    });
    
    // If we have provided parameters (from automated analysis), use them directly
    if (providedPairName && providedPairName.trim() !== "") {
      symbol = providedPairName.trim();
      console.log("✅ Using provided pair name:", symbol);
    }
    
    if (providedTimeframe && providedTimeframe.trim() !== "") {
      timeframe = providedTimeframe.trim();
      console.log("✅ Using provided timeframe:", timeframe);
    }
    
    // Only try to detect from text if parameters weren't provided (manual upload case)
    if (!symbol || !timeframe) {
      console.log("🔍 No provided parameters, attempting to detect from enhanced text...");
      
      // Enhanced regex patterns for accurate pair detection
      const titlePatterns = [
        // Professional Technical Analysis format
        /([A-Z0-9\/]{3,10})\s+Professional\s+Technical\s+Analysis\s+\(\s*([^\)]+)\s*Chart\)/i,
        
        // Standard format in brackets with Technical Analysis
        /\[([^\]]+)\]\s+Technical\s+Analysis\s+\(\s*([^\)]+)\s*Chart\)/i,
        
        // Standard format without brackets
        /([A-Z0-9\/]{3,10})\s+Technical\s+Analysis\s+\(\s*([^\)]+)\s*Chart\)/i,
      ];
      
      // Try each pattern to extract pair and timeframe
      for (const pattern of titlePatterns) {
        const match = resultText.match(pattern);
        if (match) {
          if (!symbol) symbol = match[1].trim();
          if (!timeframe && match[2]) {
            timeframe = match[2].trim();
          }
          break;
        }
      }
      
      // If still no pair found, use fallback extraction methods
      if (!symbol) {
        const pairMatch = resultText.match(/\b([A-Z]{3}\/[A-Z]{3}|[A-Z]{3,4}\/USD[T]?|[A-Z0-9]{3,6}\/[A-Z0-9]{3,6})\b/);
        if (pairMatch) {
          symbol = pairMatch[1];
        }
      }
      
      // If still no timeframe found, look for standard timeframes
      if (!timeframe) {
        const timeframeMatch = resultText.match(/\b(1[mh]|5[mh]|15[mh]|30[mh]|1h|4h|daily|weekly|monthly)\b/i);
        if (timeframeMatch) {
          timeframe = timeframeMatch[1];
        }
      }
    }
    
    // Default values if nothing is found
    if (!symbol) {
      symbol = "Unknown Pair";
      console.log("⚠️ No symbol detected, using default");
    }
    
    if (!timeframe) {
      timeframe = "Unknown Timeframe";
      console.log("⚠️ No timeframe detected, using default");
    }
    
    // Format the pair correctly using our utility function
    symbol = formatTradingPair(symbol);
    
    // Ensure correct capitalization for timeframe
    timeframe = timeframe.charAt(0).toUpperCase() + timeframe.slice(1).toLowerCase();
    
    console.log("🎯 Final processed values:", { symbol, timeframe });
    
    // Extract Market Structure & Trend Analysis
    const marketStructureMatch = resultText.match(/\*\*1\.\s+Market\s+Structure\s+&\s+Trend\s+Analysis:\*\*([\s\S]+?)(?=\*\*2\.|$)/i);
    let marketAnalysis = "";
    let trendDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    
    if (marketStructureMatch) {
      marketAnalysis = marketStructureMatch[1].trim();
      
      // Extract trend from market structure
      const trendMatch = marketAnalysis.match(/Primary\s+Trend:\s*([^\n]+)/i);
      if (trendMatch) {
        const trendText = trendMatch[1].toLowerCase();
        if (trendText.includes('bullish')) {
          trendDirection = 'bullish';
        } else if (trendText.includes('bearish')) {
          trendDirection = 'bearish';
        }
      }
    }
    
    // Extract Critical Support & Resistance Levels
    const supportResistanceMatch = resultText.match(/\*\*2\.\s+Critical\s+Support\s+&\s+Resistance\s+Levels:\*\*([\s\S]+?)(?=\*\*3\.|$)/i);
    const priceLevels = supportResistanceMatch ? extractEnhancedPriceLevels(supportResistanceMatch[1]) : [];
    
    // Extract Chart Patterns & Formations
    const patternsMatch = resultText.match(/\*\*4\.\s+Chart\s+Patterns\s+&\s+Formations:\*\*([\s\S]+?)(?=\*\*5\.|$)/i);
    const chartPatterns = patternsMatch ? extractEnhancedChartPatterns(patternsMatch[1]) : [];
    
    // Extract Technical Indicators Synthesis
    const indicatorsMatch = resultText.match(/\*\*5\.\s+Technical\s+Indicators\s+Synthesis:\*\*([\s\S]+?)(?=\*\*6\.|$)/i);
    const technicalIndicators = indicatorsMatch ? extractEnhancedMarketFactors(indicatorsMatch[1]) : [];
    
    // Extract Detailed Trading Setups
    const tradingSetupsMatch = resultText.match(/\*\*7\.\s+Detailed\s+Trading\s+Setups:\*\*([\s\S]+?)(?=\*\*8\.|$)/i);
    let tradingSetup: TradingSetup | undefined;
    
    if (tradingSetupsMatch) {
      const setupsText = tradingSetupsMatch[1];
      
      // Extract bullish scenario
      const bullishMatch = setupsText.match(/\*\*BULLISH\s+SCENARIO[^:]*:\*\*([\s\S]+?)(?=\*\*BEARISH\s+SCENARIO|$)/i);
      // Extract bearish scenario
      const bearishMatch = setupsText.match(/\*\*BEARISH\s+SCENARIO[^:]*:\*\*([\s\S]+?)(?=\*\*|$)/i);
      
      if (bullishMatch && trendDirection !== 'bearish') {
        const bullishText = bullishMatch[1];
        const entryMatch = bullishText.match(/Precise\s+Entry\s+Zone:\s*([^\n]+)/i);
        const stopMatch = bullishText.match(/Stop\s+Loss:\s*([^\n]+)/i);
        const tp1Match = bullishText.match(/Take\s+Profit\s+1:\s*([^\n]+)/i);
        const tp2Match = bullishText.match(/Take\s+Profit\s+2:\s*([^\n]+)/i);
        const rrMatch = bullishText.match(/Risk-Reward\s+Ratio:\s*([^\n]+)/i);
        
        tradingSetup = {
          type: 'long',
          description: bullishText.trim(),
          confidence: 80,
          timeframe,
          entryPrice: entryMatch ? entryMatch[1].trim() : undefined,
          stopLoss: stopMatch ? stopMatch[1].trim() : undefined,
          takeProfits: [tp1Match, tp2Match].filter(Boolean).map(m => m![1].trim()),
          riskRewardRatio: rrMatch ? rrMatch[1].trim() : "1:2",
        };
      } else if (bearishMatch && trendDirection !== 'bullish') {
        const bearishText = bearishMatch[1];
        const entryMatch = bearishText.match(/Precise\s+Entry\s+Zone:\s*([^\n]+)/i);
        const stopMatch = bearishText.match(/Stop\s+Loss:\s*([^\n]+)/i);
        const tp1Match = bearishText.match(/Take\s+Profit\s+1:\s*([^\n]+)/i);
        const tp2Match = bearishText.match(/Take\s+Profit\s+2:\s*([^\n]+)/i);
        const rrMatch = bearishText.match(/Risk-Reward\s+Ratio:\s*([^\n]+)/i);
        
        tradingSetup = {
          type: 'short',
          description: bearishText.trim(),
          confidence: 80,
          timeframe,
          entryPrice: entryMatch ? entryMatch[1].trim() : undefined,
          stopLoss: stopMatch ? stopMatch[1].trim() : undefined,
          takeProfits: [tp1Match, tp2Match].filter(Boolean).map(m => m![1].trim()),
          riskRewardRatio: rrMatch ? rrMatch[1].trim() : "1:2",
        };
      }
    }
    
    // Extract Risk Management Framework
    const riskManagementMatch = resultText.match(/\*\*8\.\s+Risk\s+Management\s+Framework:\*\*([\s\S]+?)(?=\*\*9\.|$)/i);
    const riskManagement = riskManagementMatch ? riskManagementMatch[1].trim() : '';
    
    // Extract Market Outlook
    const outlookMatch = resultText.match(/\*\*9\.\s+Market\s+Outlook\s+&\s+Key\s+Levels\s+to\s+Watch:\*\*([\s\S]+?)(?=\*\*10\.|$)/i);
    const marketOutlook = outlookMatch ? outlookMatch[1].trim() : '';
    
    // Extract Trade Management
    const tradeManagementMatch = resultText.match(/\*\*10\.\s+Trade\s+Management\s+&\s+Contingencies:\*\*([\s\S]+?)$/i);
    const tradeManagement = tradeManagementMatch ? tradeManagementMatch[1].trim() : '';
    
    // Combine insights
    const tradingInsight = [riskManagement, marketOutlook, tradeManagement].filter(Boolean).join('\n\n');
    
    // Determine overall sentiment from trend direction
    let overallSentiment: 'bullish' | 'bearish' | 'neutral' | 'mildly bullish' | 'mildly bearish' = trendDirection;
    
    // Check for strength indicators
    if (marketAnalysis.toLowerCase().includes('strong bullish')) {
      overallSentiment = 'bullish';
    } else if (marketAnalysis.toLowerCase().includes('weak bullish')) {
      overallSentiment = 'mildly bullish';
    } else if (marketAnalysis.toLowerCase().includes('strong bearish')) {
      overallSentiment = 'bearish';
    } else if (marketAnalysis.toLowerCase().includes('weak bearish')) {
      overallSentiment = 'mildly bearish';
    }
    
    return {
      pairName: symbol,
      timeframe: timeframe,
      overallSentiment,
      confidenceScore: 85,
      marketAnalysis,
      trendDirection,
      marketFactors: technicalIndicators,
      chartPatterns,
      priceLevels,
      tradingSetup,
      tradingInsight
    };
  };
  
  const extractEnhancedPriceLevels = (text: string): PriceLevel[] => {
    const levels: PriceLevel[] = [];
    
    // Extract support levels
    const supportMatch = text.match(/Primary\s+Support:\s*([^\n-]+)(?:\s*-\s*([^\n]+))?/i);
    if (supportMatch) {
      levels.push({
        name: `Primary Support: ${supportMatch[2] || 'Key level'}`,
        price: supportMatch[1].trim(),
        direction: 'down'
      });
    }
    
    const secondarySupportMatch = text.match(/Secondary\s+Support:\s*([^\n-]+)(?:\s*-\s*([^\n]+))?/i);
    if (secondarySupportMatch) {
      levels.push({
        name: `Secondary Support: ${secondarySupportMatch[2] || 'Key level'}`,
        price: secondarySupportMatch[1].trim(),
        direction: 'down'
      });
    }
    
    // Extract resistance levels
    const resistanceMatch = text.match(/Primary\s+Resistance:\s*([^\n-]+)(?:\s*-\s*([^\n]+))?/i);
    if (resistanceMatch) {
      levels.push({
        name: `Primary Resistance: ${resistanceMatch[2] || 'Key level'}`,
        price: resistanceMatch[1].trim(),
        direction: 'up'
      });
    }
    
    const secondaryResistanceMatch = text.match(/Secondary\s+Resistance:\s*([^\n-]+)(?:\s*-\s*([^\n]+))?/i);
    if (secondaryResistanceMatch) {
      levels.push({
        name: `Secondary Resistance: ${secondaryResistanceMatch[2] || 'Key level'}`,
        price: secondaryResistanceMatch[1].trim(),
        direction: 'up'
      });
    }
    
    return levels;
  };
  
  const extractEnhancedChartPatterns = (text: string): ChartPattern[] => {
    const patterns: ChartPattern[] = [];
    
    // Extract primary pattern
    const primaryPatternMatch = text.match(/Primary\s+Pattern:\s*([^\n]+)/i);
    if (primaryPatternMatch) {
      const patternText = primaryPatternMatch[1].toLowerCase();
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      
      if (patternText.includes('bullish') || patternText.includes('ascending') || patternText.includes('inverse')) {
        signal = 'bullish';
      } else if (patternText.includes('bearish') || patternText.includes('descending') || patternText.includes('head and shoulders')) {
        signal = 'bearish';
      }
      
      patterns.push({
        name: primaryPatternMatch[1].trim(),
        confidence: 85,
        signal,
        status: patternText.includes('forming') ? 'forming' : 'complete'
      });
    }
    
    return patterns;
  };
  
  const extractEnhancedMarketFactors = (text: string): MarketFactor[] => {
    const marketFactors: MarketFactor[] = [];
    
    // Extract different analysis sections
    const sections = [
      { pattern: /Price\s+Action\s+Signals:\s*([^\n]+)/i, name: 'Price Action' },
      { pattern: /Moving\s+Average\s+Analysis:\s*([^\n]+)/i, name: 'Moving Averages' },
      { pattern: /Oscillator\s+Analysis:\s*([^\n]+)/i, name: 'Oscillators' },
      { pattern: /Fibonacci\s+Analysis:\s*([^\n]+)/i, name: 'Fibonacci' }
    ];
    
    sections.forEach(section => {
      const match = text.match(section.pattern);
      if (match) {
        const description = match[1].trim();
        let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        
        if (description.toLowerCase().includes('bullish') || description.toLowerCase().includes('positive') || description.toLowerCase().includes('oversold')) {
          sentiment = 'bullish';
        } else if (description.toLowerCase().includes('bearish') || description.toLowerCase().includes('negative') || description.toLowerCase().includes('overbought')) {
          sentiment = 'bearish';
        }
        
        marketFactors.push({
          name: section.name,
          description,
          sentiment
        });
      }
    });
    
    return marketFactors;
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        console.log('📄 File converted to base64, size:', file.size, 'bytes -> base64 length:', result.length);
        resolve(result);
      };
      reader.onerror = error => {
        console.error('❌ Error converting file to base64:', error);
        reject(error);
      };
    });
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzeChart,
    showApiKeyModal: false,
    setShowApiKeyModal: () => {},
    saveApiKey: () => {},
  };
};
