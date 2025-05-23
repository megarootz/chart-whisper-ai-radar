import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData, MarketFactor, ChartPattern, PriceLevel, TradingSetup } from '@/components/AnalysisResult';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { uploadChartImage } from '@/utils/storageUtils';
import { Json } from '@/integrations/supabase/types';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { formatTradingPair } from '@/utils/tradingPairUtils';

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setLatestAnalysis, addToHistory } = useAnalysis();

  // Save analysis to database
  const saveAnalysisToDatabase = async (analysisData: AnalysisResultData, chartUrl?: string) => {
    try {
      if (!user) {
        console.log("User not logged in, cannot save analysis");
        return;
      }
      
      // Convert AnalysisResultData to a JSON-compatible object
      const analysisDataJson: Json = JSON.parse(JSON.stringify(analysisData));
      
      console.log("Saving analysis to database:", {
        user_id: user.id,
        analysis_data: analysisDataJson,
        pair_name: analysisData.pairName,
        timeframe: analysisData.timeframe,
        chart_url: chartUrl
      });
      
      const { data, error } = await supabase
        .from('chart_analyses')
        .insert({
          user_id: user.id,
          analysis_data: analysisDataJson,
          pair_name: analysisData.pairName,
          timeframe: analysisData.timeframe,
          chart_url: chartUrl
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error saving analysis to database:", error);
        toast({
          title: "Error",
          description: "Failed to save analysis to history",
          variant: "destructive",
        });
      } else {
        console.log("Analysis saved to database successfully", data);
        
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
      console.error("Error in saveAnalysisToDatabase:", err);
      toast({
        title: "Error",
        description: "Failed to save analysis to history",
        variant: "destructive",
      });
    }
  };

  // Initialize storage bucket if it doesn't exist
  const initializeStorage = async (userId?: string) => {
    try {
      if (!userId) return false;
      
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        return false;
      }
      
      if (!buckets?.find(bucket => bucket.name === 'chart_images')) {
        console.log("Creating chart_images bucket...");
        const { error: createError } = await supabase.storage.createBucket('chart_images', {
          public: true
        });
        
        if (createError) {
          console.error("Error creating bucket:", createError);
          return false;
        }
        
        console.log("chart_images bucket created successfully");
      } else {
        console.log("chart_images bucket already exists");
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing storage:", error);
      return false;
    }
  };

  const analyzeChart = async (file: File, pairName: string, timeframe: string) => {
    try {
      setIsAnalyzing(true);
      
      if (!user) {
        throw new Error('You must be logged in to analyze charts');
      }
      
      const base64Image = await fileToBase64(file);
      
      let chartUrl: string | undefined;
      try {
        await initializeStorage(user.id);
        chartUrl = await uploadChartImage(file, user.id);
        console.log('Chart image uploaded successfully:', chartUrl);
      } catch (uploadError) {
        console.error('Failed to upload chart image:', uploadError);
      }
      
      console.log("Calling optimized Supabase Edge Function");
      
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: {
          base64Image,
          pairName,
          timeframe
        }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from analysis function');
      }

      console.log("Edge function response received:", data);
      
      const responseData = data as any;
      
      if (!responseData.choices || responseData.choices.length === 0) {
        throw new Error('No response content from API');
      }

      const resultText = responseData.choices[0].message.content || '';
      console.log("Optimized API Response content:", resultText);
      
      const analysisData = processOptimizedTextResult(resultText, pairName, timeframe);
      
      setAnalysisResult(analysisData);
      setLatestAnalysis(analysisData);
      
      await saveAnalysisToDatabase(analysisData, chartUrl);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed the ${analysisData.pairName} chart`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error analyzing chart:", error);
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

  // Optimized processing function for the new compact format
  const processOptimizedTextResult = (resultText: string, pairName: string, timeframe: string): AnalysisResultData => {
    console.log("Processing optimized analysis result:", resultText);
    
    // Extract trend
    const trendMatch = resultText.match(/TREND:\s*([^\n]+)/i);
    const trendDirection = trendMatch ? 
      (trendMatch[1].toLowerCase().includes('bullish') ? 'bullish' : 
       trendMatch[1].toLowerCase().includes('bearish') ? 'bearish' : 'neutral') : 
      'neutral';
    
    // Extract support levels
    const supportSection = resultText.match(/SUPPORT:([\s\S]*?)(?=RESISTANCE:|$)/i);
    const supportLevels: PriceLevel[] = [];
    if (supportSection) {
      const supportMatches = supportSection[1].match(/\d+\.\s*([0-9.]+)/g);
      supportMatches?.forEach((match, index) => {
        const price = match.match(/([0-9.]+)/)?.[1];
        if (price && supportLevels.length < 3) {
          supportLevels.push({
            name: `Support Level ${index + 1}`,
            price: price,
            direction: 'down'
          });
        }
      });
    }
    
    // Extract resistance levels
    const resistanceSection = resultText.match(/RESISTANCE:([\s\S]*?)(?=PATTERN:|$)/i);
    const resistanceLevels: PriceLevel[] = [];
    if (resistanceSection) {
      const resistanceMatches = resistanceSection[1].match(/\d+\.\s*([0-9.]+)/g);
      resistanceMatches?.forEach((match, index) => {
        const price = match.match(/([0-9.]+)/)?.[1];
        if (price && resistanceLevels.length < 3) {
          resistanceLevels.push({
            name: `Resistance Level ${index + 1}`,
            price: price,
            direction: 'up'
          });
        }
      });
    }
    
    const priceLevels = [...supportLevels, ...resistanceLevels];
    
    // Extract pattern
    const patternMatch = resultText.match(/PATTERN:\s*([^\n]+)/i);
    const chartPatterns: ChartPattern[] = [];
    if (patternMatch && !patternMatch[1].toLowerCase().includes('none')) {
      chartPatterns.push({
        name: patternMatch[1].trim(),
        confidence: 70,
        signal: trendDirection as any,
        status: 'complete'
      });
    }
    
    // Extract indicators
    const indicatorsMatch = resultText.match(/INDICATORS:\s*([^\n]+)/i);
    const technicalIndicators: MarketFactor[] = [];
    if (indicatorsMatch) {
      technicalIndicators.push({
        name: 'Technical Indicators',
        description: indicatorsMatch[1].trim(),
        sentiment: trendDirection as any
      });
    }
    
    // Extract trade setup
    const tradeMatch = resultText.match(/TRADE:\s*Entry\s*([0-9.]+).*?Stop\s*([0-9.]+).*?Target\s*([0-9.]+)/i);
    let tradingSetup: TradingSetup | undefined;
    if (tradeMatch) {
      tradingSetup = {
        type: trendDirection === 'bullish' ? 'long' : trendDirection === 'bearish' ? 'short' : 'neutral',
        description: `${trendDirection} setup based on chart analysis`,
        confidence: 75,
        timeframe,
        entryPrice: tradeMatch[1],
        stopLoss: tradeMatch[2],
        takeProfits: [tradeMatch[3]],
        riskRewardRatio: "1:2",
      };
    }
    
    return {
      pairName: formatTradingPair(pairName),
      timeframe: timeframe,
      overallSentiment: trendDirection as any,
      confidenceScore: 75,
      marketAnalysis: indicatorsMatch?.[1] || 'Technical analysis completed',
      trendDirection: trendDirection as any,
      marketFactors: technicalIndicators,
      chartPatterns,
      priceLevels,
      tradingSetup,
      tradingInsight: 'Analysis based on key support/resistance levels and trend direction'
    };
  };

  // Helper function to convert file to base64
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
    analyzeChart,
    showApiKeyModal: false,
    setShowApiKeyModal: () => {},
    saveApiKey: () => {},
  };
};
