
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

  // Extract trading pair and timeframe from analysis text
  const extractTradingInfo = (analysisText: string) => {
    // Look for patterns in the Market Context & Trend Detection section
    const marketContextMatch = analysisText.match(/1\.\s*Market Context.*?Detection[\s\S]*?(?=2\.|$)/i);
    
    if (marketContextMatch) {
      const marketContextText = marketContextMatch[0];
      
      // Look for specific patterns like "Gold Spot priced in U.S. Dollars on the 1-hour timeframe"
      const goldMatch = marketContextText.match(/Gold\s+Spot\s+priced\s+in\s+U\.S\.\s+Dollars?\s+on\s+the\s+([\w\-]+)\s+timeframe/i);
      if (goldMatch) {
        return {
          pair: 'XAU/USD',
          timeframe: goldMatch[1]
        };
      }
      
      // Look for other currency pair patterns
      const pairMatch = marketContextText.match(/(EUR\/USD|GBP\/USD|USD\/JPY|AUD\/USD|USD\/CAD|NZD\/USD|EUR\/GBP|EUR\/JPY|GBP\/JPY|XAU\/USD|XAG\/USD|BTC\/USD|ETH\/USD)/gi);
      const timeframeMatch = marketContextText.match(/(?:on\s+the\s+|timeframe[:\s]+)(1-hour|4-hour|daily|weekly|monthly|15-minute|30-minute|1h|4h|1d|1w|1m)/gi);
      
      if (pairMatch && timeframeMatch) {
        return {
          pair: pairMatch[0].toUpperCase(),
          timeframe: timeframeMatch[0].replace(/^(?:on\s+the\s+|timeframe[:\s]+)/i, '')
        };
      }
      
      // Fallback: look for any mention of pairs and timeframes
      if (pairMatch) {
        return {
          pair: pairMatch[0].toUpperCase(),
          timeframe: 'Unknown Timeframe'
        };
      }
    }

    // Fallback patterns
    const pairMatch = analysisText.match(/(?:Gold|XAU|EUR|USD|GBP|JPY|CHF|CAD|AUD|NZD|BTC|ETH)[\/\s]*(?:USD|EUR|JPY|GBP|CHF|CAD|AUD|NZD|USDT)/gi);
    const timeframeMatch = analysisText.match(/(?:1|4|15|30)\s*(?:Hour|Minute|Min|H|M)|Daily|Weekly|Monthly/gi);
    
    return {
      pair: pairMatch ? pairMatch[0] : 'Unknown Pair',
      timeframe: timeframeMatch ? timeframeMatch[0] : 'Unknown Timeframe'
    };
  };

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
          // Pass the complete analysis data with additional properties
          addToHistory({
            ...analysisData,
            id: data.id,
            created_at: data.created_at
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

  // Validate image file
  const validateImageFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image file (PNG, JPG, JPEG)",
        variant: "destructive",
      });
      return false;
    }

    // Check file size (max 10MB)
    const maxSizeInMB = 10;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: `Please upload an image smaller than ${maxSizeInMB}MB`,
        variant: "destructive",
      });
      return false;
    }

    return true;
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

      // Validate the image file
      if (!validateImageFile(file)) {
        return;
      }

      console.log('🔍 Starting chart analysis for authenticated user:', user.id, 'email:', user.email);
      console.log('📊 Analysis parameters:', { 
        pairName, 
        timeframe, 
        fileName: file.name, 
        fileSize: Math.round(file.size / 1024) + "KB",
        fileType: file.type 
      });

      // Check usage limits BEFORE proceeding
      const usageData = await checkUsageLimits();
      if (usageData && !usageData.can_analyze) {
        toast({
          title: "Usage Limit Reached",
          description: `You've reached your analysis limit. Daily: ${usageData.daily_count}/${usageData.daily_limit}, Monthly: ${usageData.monthly_count}/${usageData.monthly_limit}`,
          variant: "destructive",
        });
        return;
      }
      
      // Convert image to base64 with enhanced quality verification
      console.log('🔄 Converting image to base64...');
      const base64Image = await fileToBase64(file);
      console.log('✅ Base64 conversion complete, length:', base64Image.length, 'characters');
      
      // Enhanced validation for image content
      if (!base64Image.startsWith('data:image/')) {
        throw new Error('Invalid image format after base64 conversion');
      }
      
      if (base64Image.length < 20000) {
        throw new Error('Image appears to be too small or corrupted. Please ensure the chart is fully loaded.');
      }
      
      // Log image details for debugging
      console.log("📤 Sending image to AI analysis:", {
        pairName,
        timeframe,
        base64Length: base64Image.length,
        imageType: file.type,
        imageSizeKB: Math.round(file.size / 1024),
        base64Preview: base64Image.substring(0, 100) + "..."
      });
      
      // Call our Supabase Edge Function with detailed logging
      console.log("🤖 Calling AI analysis edge function...");
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: {
          base64Image,
          pairName,
          timeframe
        }
      });
      
      if (error) {
        console.error("❌ Edge function error:", error);
        throw new Error(`Analysis failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response received from AI analysis');
      }

      console.log("✅ AI analysis response received");
      console.log('📥 Response structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasContent: !!data.choices?.[0]?.message?.content
      });
      
      // Parse the API response
      const responseData = data as any;
      
      if (!responseData.choices || responseData.choices.length === 0) {
        console.error('❌ Invalid response structure:', responseData);
        throw new Error('Invalid response from AI analysis');
      }

      // Get the analysis text
      const rawAnalysisText = responseData.choices[0].message.content || '';
      console.log("📝 Raw Analysis Preview:", rawAnalysisText.substring(0, 500) + "...");
      
      // Validate analysis content
      if (!rawAnalysisText.trim()) {
        throw new Error('Empty analysis received from AI');
      }

      // Check if the response indicates the AI couldn't see the image
      const failureIndicators = [
        "i cannot analyze images",
        "i'm unable to analyze images", 
        "i don't have the ability to analyze images",
        "i cannot see the image",
        "i'm not able to see",
        "however, i can help you understand how to analyze"
      ];
      
      const hasFailureIndicator = failureIndicators.some(indicator => 
        rawAnalysisText.toLowerCase().includes(indicator)
      );
      
      if (hasFailureIndicator) {
        console.error('❌ AI failed to analyze the image:', rawAnalysisText.substring(0, 300));
        throw new Error('The AI was unable to analyze the chart image. This might be due to the image not loading properly or being corrupted. Please try again.');
      }
      
      // Extract trading info from the analysis text
      const { pair, timeframe: detectedTimeframe } = extractTradingInfo(rawAnalysisText);
      
      // Create analysis data structure with extracted information
      const analysisData: AnalysisResultData = {
        pairName: formatTradingPair(pair),
        timeframe: detectedTimeframe,
        overallSentiment: 'neutral',
        confidenceScore: 90,
        marketAnalysis: rawAnalysisText,
        trendDirection: 'neutral',
        marketFactors: [],
        chartPatterns: [],
        priceLevels: [],
        tradingInsight: rawAnalysisText
      };
      
      console.log("🎯 Analysis data prepared:", { 
        pairName: analysisData.pairName, 
        timeframe: analysisData.timeframe,
        analysisLength: rawAnalysisText.length
      });
      
      // Increment usage count AFTER successful analysis
      try {
        const updatedUsage = await incrementUsage();
        if (updatedUsage) {
          console.log('✅ Usage incremented successfully');
        }
      } catch (usageError) {
        console.error('❌ Error incrementing usage:', usageError);
      }
      
      // Save the analysis result
      setAnalysisResult(analysisData);
      setLatestAnalysis(analysisData);
      await saveAnalysisToDatabase(analysisData);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed the ${analysisData.pairName} chart`,
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

  // Enhanced helper function to convert file to base64 with validation
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        
        // Validate the result
        if (!result || !result.startsWith('data:image/')) {
          reject(new Error('Invalid base64 conversion result'));
          return;
        }
        
        console.log('📄 File converted to base64:', {
          originalSize: file.size + " bytes",
          base64Length: result.length + " characters",
          imageType: file.type,
          base64Start: result.substring(0, 50)
        });
        resolve(result);
      };
      reader.onerror = error => {
        console.error('❌ Error converting file to base64:', error);
        reject(new Error('Failed to convert image to base64 format'));
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
