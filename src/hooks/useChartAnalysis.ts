import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { uploadChartImage } from '@/utils/storageUtils';
import { Json } from '@/integrations/supabase/types';
import { useAnalysis } from '@/contexts/AnalysisContext';

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setLatestAnalysis, addToHistory } = useAnalysis();

  // Helper function to calculate distance in pips properly
  const calculateDistanceInPips = (currentPrice: number, level: number, isForex: boolean, pairName: string) => {
    // Determine pip multiplier based on pair type
    let pipMultiplier;
    if (isForex) {
      // For JPY pairs, a pip is 0.01, for other forex pairs, a pip is 0.0001
      pipMultiplier = pairName.includes('JPY') ? 0.01 : 0.0001;
    } else {
      // For non-forex (crypto, indices, stocks), use 0.01 as default
      pipMultiplier = 0.01;
    }
    
    // Calculate the distance in pips
    const priceDifference = Math.abs(level - currentPrice);
    const pips = Math.round(priceDifference / pipMultiplier);
    
    return pips;
  };

  // Helper function to validate if the stop loss and take profit levels are appropriate for the timeframe
  const validateAndAdjustLevels = (
    tradingSetup: any, 
    timeframe: string, 
    currentPrice: number | null
  ) => {
    if (!tradingSetup || !currentPrice) return tradingSetup;
    
    // Define minimum pip distances based on timeframe
    const minPipDistances: {[key: string]: number} = {
      'M1': 5,
      'M5': 10, 
      'M15': 15,
      'H1': 20,
      'H4': 50,
      'D1': 100,
      'Daily': 100,
      'W1': 200,
      'Weekly': 200,
      'MN': 300,
      'Monthly': 300
    };
    
    // Get the normalized timeframe key
    const normalizedTimeframe = timeframe.toUpperCase().replace('MINUTE', 'M').replace('HOUR', 'H').replace('DAY', 'D');
    
    // Default minimum distance if timeframe is not recognized
    let minDistance = 20;
    
    // Find the appropriate minimum distance based on timeframe
    Object.keys(minPipDistances).forEach(key => {
      if (normalizedTimeframe.includes(key)) {
        minDistance = minPipDistances[key];
      }
    });
    
    // Create a copy of the trading setup to modify
    const adjustedSetup = { ...tradingSetup };
    
    // Check if stop loss distance is too small
    if (adjustedSetup.stopLoss) {
      const stopLossValue = parseFloat(adjustedSetup.stopLoss);
      const stopLossPips = Math.abs(currentPrice - stopLossValue) * 10000;
      
      if (stopLossPips < minDistance) {
        // Adjust stop loss to meet minimum distance
        const adjustment = (minDistance / 10000) * (stopLossValue < currentPrice ? -1 : 1);
        adjustedSetup.stopLoss = (currentPrice + adjustment).toFixed(5);
        console.log(`Adjusted stop loss from ${stopLossValue} to ${adjustedSetup.stopLoss} to meet minimum distance`);
      }
    }
    
    // Check if take profit targets are too close
    if (Array.isArray(adjustedSetup.takeProfits) && adjustedSetup.takeProfits.length > 0) {
      const adjustedTakeProfits = adjustedSetup.takeProfits.map((tp: string) => {
        const tpValue = parseFloat(tp);
        if (isNaN(tpValue)) return tp;
        
        const tpPips = Math.abs(currentPrice - tpValue) * 10000;
        
        if (tpPips < minDistance * 1.5) { // Take profit should be at least 1.5x the min distance
          // Adjust take profit to meet minimum distance
          const adjustment = (minDistance * 1.5 / 10000) * (tpValue < currentPrice ? -1 : 1);
          return (currentPrice + adjustment).toFixed(5);
        }
        
        return tp;
      });
      
      adjustedSetup.takeProfits = adjustedTakeProfits;
    }
    
    return adjustedSetup;
  };

  // Helper function to clean up risk-reward ratio format for proper JSON parsing
  const cleanRiskRewardRatio = (text: string) => {
    // Replace "riskRewardRatio": 1:3 with "riskRewardRatio": "1:3"
    let cleanedText = text.replace(/("riskRewardRatio"\s*:\s*)(\d+:\d+)([,}])/g, '$1"$2"$3');
    
    return cleanedText;
  };

  // Save analysis to database
  const saveAnalysisToDatabase = async (analysisData: AnalysisResultData, chartUrl?: string) => {
    try {
      if (!user) {
        console.log("User not logged in, cannot save analysis");
        return;
      }
      
      // Convert AnalysisResultData to a JSON-compatible object
      // This fixes the type error by ensuring the data matches the Json type expected by Supabase
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
        
        // Add the newly saved analysis to the history context
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
      
      // Check if chart_images bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        return false;
      }
      
      // If bucket doesn't exist, create it
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
      
      // Check if user is logged in
      if (!user) {
        throw new Error('You must be logged in to analyze charts');
      }
      
      // Convert image to base64
      const base64Image = await fileToBase64(file);
      
      // Upload image to Supabase storage
      let chartUrl: string | undefined;
      try {
        // Initialize storage bucket if needed
        await initializeStorage(user.id);
        
        chartUrl = await uploadChartImage(file, user.id);
        console.log('Chart image uploaded successfully:', chartUrl);
      } catch (uploadError) {
        console.error('Failed to upload chart image:', uploadError);
        // Continue with analysis even if image upload fails
      }
      
      console.log("Calling Supabase Edge Function to analyze chart");
      
      // Call our Supabase Edge Function instead of making the API call directly
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
      
      // Parse the API response
      const responseData = data as any;
      
      if (!responseData.choices || responseData.choices.length === 0) {
        throw new Error('No response content from API');
      }

      // Parse the text response to extract JSON
      const resultText = responseData.choices[0].message.content || '';
      console.log("Raw API Response content:", resultText.substring(0, 100) + "...");
      
      // Process response as text format using the new template structure
      const analysisData = processTextResult(resultText, pairName, timeframe);
      
      // Save the analysis result
      setAnalysisResult(analysisData);
      
      // Update the latest analysis in the context
      setLatestAnalysis(analysisData);
      
      // Save the analysis to Supabase
      await saveAnalysisToDatabase(analysisData, chartUrl);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed the ${analysisData.pairName} chart on ${analysisData.timeframe} timeframe`,
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

  // Process result in the new text format based on the updated template
  const processTextResult = (resultText: string, defaultPairName: string, defaultTimeframe: string): AnalysisResultData => {
    // Parse text format - extract symbol and timeframe from title if possible
    const titleMatch = resultText.match(/\[([^\]]+)\]\s+Technical\s+Analysis\s+\(\s*([^\)]+)\s*Chart\)/i);
    const symbol = titleMatch ? titleMatch[1] : defaultPairName;
    const timeframe = titleMatch ? titleMatch[2] : defaultTimeframe;
    
    // Extract trend direction
    const trendMatch = resultText.match(/(?:Overall\s+trend|Trend\s+Direction):\s*([^\.\n]+)/i);
    const trendDirection = trendMatch ? 
      (trendMatch[1].toLowerCase().includes('bullish') ? 'bullish' : 
       trendMatch[1].toLowerCase().includes('bearish') ? 'bearish' : 'neutral') : 
      'neutral';
      
    // Extract overall sentiment based on trading bias if present
    const biasMatch = resultText.match(/Trading\s+Bias[:\s]+([^\s\n]+)/i);
    const overallSentiment = biasMatch ? 
      (biasMatch[1].toLowerCase().includes('bullish') ? 'bullish' : 
       biasMatch[1].toLowerCase().includes('bearish') ? 'bearish' : 'neutral') : 
      trendDirection;
      
    // Extract support levels
    const supportSection = resultText.match(/Key\s+Support\s+Levels:([\s\S]+?)(?:Key\s+Resistance\s+Levels:|Chart\s+Patterns:|$)/i);
    const supportLevels = supportSection ? extractPriceLevels(supportSection[1], false) : [];
    
    // Extract resistance levels
    const resistanceSection = resultText.match(/Key\s+Resistance\s+Levels:([\s\S]+?)(?:Chart\s+Patterns:|Technical\s+Indicators|$)/i);
    const resistanceLevels = resistanceSection ? extractPriceLevels(resistanceSection[1], true) : [];
    
    // Combine all price levels
    const priceLevels = [...supportLevels, ...resistanceLevels];
    
    // Extract chart patterns
    const patternSection = resultText.match(/Chart\s+Patterns:([\s\S]+?)(?:Technical\s+Indicators|Trading\s+Insights|$)/i);
    const chartPatterns = patternSection ? extractChartPatterns(patternSection[1]) : [];
    
    // Extract trading insights
    const insightSection = resultText.match(/Trading\s+Insights:([\s\S]+?)(?:Summary\s+Table|$)/i);
    const tradingInsight = insightSection ? insightSection[1].trim() : '';
    
    // Create a simplified trading setup from the insights
    const bullishScenario = resultText.match(/Bullish\s+Scenario:([^\n]+(?:\n[^\n]+)*?)(?:Bearish\s+Scenario:|Neutral|$)/i);
    const bearishScenario = resultText.match(/Bearish\s+Scenario:([^\n]+(?:\n[^\n]+)*?)(?:Neutral|Bullish|$)/i);
    
    // Extract potential targets and stop loss levels
    const targetMatch = resultText.match(/could\s+(?:resume|target|reach)\s+(?:the\s+)?(?:uptrend\s+)?(?:towards|at)\s+([0-9.,]+)/i);
    const stopLossMatch = resultText.match(/Stop\s+loss\s+(?:can|should)\s+be\s+placed\s+[^0-9]+([0-9.,]+)/i);
    
    // Create trading setup based on the trend direction
    const tradingSetup = {
      type: trendDirection === 'bullish' ? 'long' : trendDirection === 'bearish' ? 'short' : 'neutral',
      description: trendDirection === 'bullish' ? 
        (bullishScenario ? bullishScenario[1].trim() : 'Bullish bias based on trend analysis') :
        (bearishScenario ? bearishScenario[1].trim() : 'Bearish bias based on trend analysis'),
      confidence: 60, // Default confidence
      timeframe: timeframe,
      entryPrice: undefined, // Not specified in the new format
      stopLoss: stopLossMatch ? stopLossMatch[1] : undefined,
      takeProfits: targetMatch ? [targetMatch[1]] : [],
      riskRewardRatio: "1:2", // Default risk-reward ratio
      entryTrigger: undefined, // Not specified in the new format
    };
    
    // Create market analysis from the trend description
    const trendSection = resultText.match(/(?:Overall\s+trend|Trend\s+Direction)[^:]*:([^\n]+(?:\n[^\n]+)*?)(?:\d+\.\s+Key|$)/i);
    const marketAnalysis = trendSection ? trendSection[1].trim() : 'Analysis not available';
    
    // Create market factors from technical indicators
    const indicatorSection = resultText.match(/Technical\s+Indicators[^:]*:([^\n]+(?:\n[^\n]+)*?)(?:\d+\.\s+Trading|$)/i);
    const marketFactors = [];
    if (indicatorSection) {
      const lines = indicatorSection[1].split('\n').filter(line => line.trim().length > 0);
      lines.forEach(line => {
        const sentiment = line.toLowerCase().includes('bullish') ? 'bullish' : 
                         line.toLowerCase().includes('bearish') ? 'bearish' : 'neutral';
        marketFactors.push({
          name: line.split(':')[0] || 'Technical Factor',
          description: line.trim(),
          sentiment
        });
      });
    }
    
    // If no market factors were extracted, create a default one
    if (marketFactors.length === 0) {
      marketFactors.push({
        name: 'Trend Analysis',
        description: marketAnalysis,
        sentiment: trendDirection
      });
    }
    
    return {
      pairName: symbol,
      timeframe: timeframe,
      overallSentiment: overallSentiment as any,
      confidenceScore: 70, // Default confidence score
      marketAnalysis,
      trendDirection: trendDirection as any,
      marketFactors,
      chartPatterns,
      priceLevels,
      tradingSetup: tradingSetup as any,
      tradingInsight
    };
  };
  
  // Helper function to extract price levels from text
  const extractPriceLevels = (text: string, isResistance: boolean): any[] => {
    const levels: any[] = [];
    const levelRegex = /([0-9.,]+):\s*([^\n]+)/g;
    let match;
    
    // First try to find price levels in format "1.2345: description"
    while ((match = levelRegex.exec(text)) !== null) {
      const price = match[1].trim();
      const description = match[2].trim();
      
      levels.push({
        name: isResistance ? `Resistance: ${description}` : `Support: ${description}`,
        price: price,
        distance: "0 pips", // We don't have enough info to calculate
        direction: isResistance ? 'up' : 'down'
      });
    }
    
    // If no matches found with first regex, try alternative formats
    if (levels.length === 0) {
      // Try finding price numbers with descriptions
      const altRegex = /\[([^:]+)(?::\s*([0-9.,]+))?\]|([0-9.,]+)/g;
      while ((match = altRegex.exec(text)) !== null) {
        const levelName = match[1]?.trim() || (isResistance ? 'Resistance' : 'Support');
        let price = match[2]?.trim() || match[3]?.trim();
        
        // If we have a name but no price, look for nearby numbers
        if (levelName && !price) {
          const nearbyTextAfter = text.substring(match.index + match[0].length, match.index + match[0].length + 30);
          const priceMatch = nearbyTextAfter.match(/([0-9.,]+)/);
          if (priceMatch) {
            price = priceMatch[1];
          }
        }
        
        // Only add if we have a price
        if (price) {
          levels.push({
            name: isResistance ? `Resistance: ${levelName}` : `Support: ${levelName}`,
            price: price,
            distance: "0 pips",
            direction: isResistance ? 'up' : 'down'
          });
        }
      }
    }
    
    return levels;
  };
  
  // Helper function to extract chart patterns from text
  const extractChartPatterns = (text: string): any[] => {
    const patterns: any[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines) {
      // Try to extract pattern name and description
      if (line.includes(':') || line.match(/\[[^\]]+\]/)) {
        // This might be a pattern name
        let patternName = '';
        let description = '';
        
        if (line.includes(':')) {
          const parts = line.split(':');
          patternName = parts[0].replace(/\[\s*|\s*\]/, '').trim();
          description = parts.slice(1).join(':').trim();
        } else {
          const match = line.match(/\[([^\]]+)\]/);
          patternName = match ? match[1].trim() : line.trim();
          
          // Look for description in next lines
          const lineIndex = lines.indexOf(line);
          if (lineIndex < lines.length - 1) {
            description = lines[lineIndex + 1].trim();
          }
        }
        
        // Determine sentiment from the description
        let signal = 'neutral';
        if ((description + patternName).toLowerCase().includes('bullish')) {
          signal = 'bullish';
        } else if ((description + patternName).toLowerCase().includes('bearish')) {
          signal = 'bearish';
        }
        
        // Add the pattern if we have a name
        if (patternName) {
          patterns.push({
            name: patternName,
            confidence: 70, // Default confidence since it's not specified
            signal,
            status: "complete" // Default status
          });
        }
      }
    }
    
    return patterns;
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
