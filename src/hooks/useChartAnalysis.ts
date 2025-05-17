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
    // Check if the text contains any JSON issues and fix them before parsing
    
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
      
      // Parse response - adapt this for new format
      try {
        // Process the results in the new format - first try to extract as JSON
        let parsedResult;
        let analysisData: AnalysisResultData;
        
        try {
          // Try to parse as JSON first (for compatibility)
          let jsonStr = resultText;
          if (resultText.includes('```json')) {
            jsonStr = resultText.split('```json')[1].split('```')[0].trim();
          } else if (resultText.includes('```')) {
            jsonStr = resultText.split('```')[1].split('```')[0].trim();
          }
          
          // Fix JSON format issues before parsing
          jsonStr = cleanRiskRewardRatio(jsonStr);
          parsedResult = JSON.parse(jsonStr);
          
          // If it's JSON, process the old way
          analysisData = processJsonResult(parsedResult, pairName, timeframe);
        } catch (jsonError) {
          console.log("Not JSON format, processing as text format");
          // If it's not JSON, process as text format
          analysisData = processTextResult(resultText, pairName, timeframe);
        }

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
      } catch (parseError) {
        console.error("Parsing error:", parseError, "Raw text:", resultText.substring(0, 500));
        throw new Error("Failed to parse the analysis result. Invalid response format from API.");
      }
      
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

  // Process result in JSON format (for backward compatibility)
  const processJsonResult = (parsedResult: any, defaultPairName: string, defaultTimeframe: string): AnalysisResultData => {
    // Use detected pair name and timeframe from the API if available, otherwise fallback to placeholders
    const detectedPairName = parsedResult.pairName || defaultPairName;
    const detectedTimeframe = parsedResult.timeframe || defaultTimeframe;
    
    // Determine if this is a forex pair to calculate pips correctly
    const isForex = detectedPairName.length === 6 && /[A-Z]{6}/.test(detectedPairName);
    
    // Find the current price level if available
    const currentPriceObj = Array.isArray(parsedResult.priceLevels) ? 
      parsedResult.priceLevels.find((l: any) => 
        l.name && l.name.toLowerCase().includes('current')
      ) : null;
    
    const currentPrice = currentPriceObj ? parseFloat(currentPriceObj.price) : null;
    
    // Validate and adjust trading setup if needed
    if (parsedResult.tradingSetup && currentPrice !== null) {
      parsedResult.tradingSetup = validateAndAdjustLevels(
        parsedResult.tradingSetup, 
        detectedTimeframe, 
        currentPrice
      );
    }
    
    // Map the parsed result to our AnalysisResultData format
    return {
      pairName: detectedPairName,
      timeframe: detectedTimeframe,
      overallSentiment: parsedResult.overallSentiment || 'neutral',
      confidenceScore: parsedResult.confidenceScore || 50,
      marketAnalysis: parsedResult.marketAnalysis || 'Analysis not available.',
      trendDirection: parsedResult.trendDirection || 'neutral',
      marketFactors: Array.isArray(parsedResult.marketFactors) ? parsedResult.marketFactors.map((factor: any) => ({
        name: factor.name,
        description: factor.description,
        sentiment: factor.sentiment.toLowerCase()
      })) : [],
      chartPatterns: Array.isArray(parsedResult.chartPatterns) ? parsedResult.chartPatterns.map((pattern: any) => ({
        name: pattern.name,
        confidence: pattern.confidence,
        signal: typeof pattern.signal === 'string' ? 
                pattern.signal.toLowerCase().includes('bullish') ? 'bullish' : 
                pattern.signal.toLowerCase().includes('bearish') ? 'bearish' : 'neutral' 
                : 'neutral',
        status: pattern.status || "complete"
      })) : [],
      priceLevels: Array.isArray(parsedResult.priceLevels) ? parsedResult.priceLevels.map((level: any) => {
        // ... keep existing code (process price levels)
        const price = parseFloat(level.price);
        let direction: 'up' | 'down' = 'up';
        let pips = 0;
        
        if (currentPrice !== null && !isNaN(price)) {
          direction = price > currentPrice ? 'up' : 'down';
          pips = calculateDistanceInPips(currentPrice, price, isForex, detectedPairName);
        } else {
          direction = level.direction && level.direction.toLowerCase().includes('above') ? 'up' : 'down';
          
          if (level.distance) {
            if (typeof level.distance === 'string' && level.distance.includes('%')) {
              return {
                name: level.name,
                price: price.toString(),
                distance: level.distance,
                direction
              };
            } else {
              const distanceNum = parseFloat(level.distance);
              if (!isNaN(distanceNum)) {
                pips = Math.round(distanceNum);
              }
            }
          }
        }
        
        return {
          name: level.name,
          price: price.toString(),
          distance: `${pips} pips`,
          direction
        };
      }) : [],
      entryLevel: parsedResult.entryLevel ? parsedResult.entryLevel.toString() : undefined,
      stopLoss: parsedResult.stopLoss ? parsedResult.stopLoss.toString() : undefined,
      takeProfits: Array.isArray(parsedResult.takeProfits) ? 
                    parsedResult.takeProfits.map((tp: any) => tp.toString()) : undefined,
      tradingInsight: parsedResult.tradingInsight,
      tradingSetup: parsedResult.tradingSetup ? {
        type: parsedResult.tradingSetup.type || 'neutral',
        description: parsedResult.tradingSetup.description || '',
        confidence: parsedResult.tradingSetup.confidence || 50,
        timeframe: parsedResult.tradingSetup.timeframe || detectedTimeframe,
        entryPrice: parsedResult.tradingSetup.entryPrice?.toString(),
        stopLoss: parsedResult.tradingSetup.stopLoss?.toString(),
        takeProfits: Array.isArray(parsedResult.tradingSetup.takeProfits) ? 
                    parsedResult.tradingSetup.takeProfits.map((tp: any) => {
                      if (typeof tp === 'object' && tp !== null) {
                        return (tp.value || tp.price || tp.target || "").toString();
                      }
                      return tp.toString();
                    }) : [],
        riskRewardRatio: typeof parsedResult.tradingSetup.riskRewardRatio === 'string' ? 
                        parsedResult.tradingSetup.riskRewardRatio : 
                        parsedResult.tradingSetup.riskRewardRatio?.toString(),
        entryTrigger: parsedResult.tradingSetup.entryTrigger,
      } : undefined
    };
  };
  
  // Process result in the new text format
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
    const targetMatch = resultText.match(/could\s+(?:resume|target|reach)\s+(?:the\s+)?(?:uptrend\s+)?towards\s+([0-9.,]+)/i);
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
    const levelRegex = /\[([^:]+)(?::\s*([0-9.,]+))?\]/g;
    let match;
    
    while ((match = levelRegex.exec(text)) !== null) {
      const levelName = match[1].trim();
      let price = match[2]?.trim();
      
      // If price is not explicitly given in brackets, try to find it elsewhere in the text
      if (!price) {
        const priceFinder = new RegExp(`${levelName}[^0-9]*([0-9.,]+)`, 'i');
        const priceMatch = text.match(priceFinder);
        if (priceMatch) {
          price = priceMatch[1];
        } else {
          // Skip this entry if we can't find a price
          continue;
        }
      }
      
      levels.push({
        name: isResistance ? `Resistance: ${levelName}` : `Support: ${levelName}`,
        price: price,
        distance: "0 pips", // We don't have enough info to calculate
        direction: isResistance ? 'up' : 'down'
      });
    }
    
    // If no levels were extracted using the bracket format, try looking for numbered lists
    if (levels.length === 0) {
      const lineRegex = /([0-9.,]+)\s*:\s*([^\n]+)/g;
      while ((match = lineRegex.exec(text)) !== null) {
        levels.push({
          name: isResistance ? `Resistance: ${match[2].trim()}` : `Support: ${match[2].trim()}`,
          price: match[1],
          distance: "0 pips",
          direction: isResistance ? 'up' : 'down'
        });
      }
    }
    
    return levels;
  };
  
  // Helper function to extract chart patterns from text
  const extractChartPatterns = (text: string): any[] => {
    const patterns: any[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(':') || line.match(/\[[^\]]+\]/)) {
        // This might be a pattern name
        const patternName = line.includes(':') ? 
          line.split(':')[0].replace(/\[\s*|\s*\]/, '').trim() : 
          line.match(/\[([^\]]+)\]/)?.[1]?.trim() || line.trim();
          
        let description = '';
        let j = i + 1;
        
        // Collect description lines until we hit another pattern or end
        while (j < lines.length && 
               !lines[j].includes(':') && 
               !lines[j].match(/\[[^\]]+\]:/) && 
               !lines[j].match(/^[A-Z][a-z]+\s+Pattern/)) {
          description += lines[j].trim() + ' ';
          j++;
        }
        
        // Determine sentiment from the description
        let signal = 'neutral';
        if (description.toLowerCase().includes('bullish')) {
          signal = 'bullish';
        } else if (description.toLowerCase().includes('bearish')) {
          signal = 'bearish';
        }
        
        // Add the pattern
        patterns.push({
          name: patternName,
          confidence: 70, // Default confidence since it's not specified
          signal,
          status: "complete" // Default status
        });
        
        // Skip processed lines
        i = j - 1;
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
