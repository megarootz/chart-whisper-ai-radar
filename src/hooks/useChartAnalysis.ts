import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';
import { OpenAIResponse, OpenRouterErrorResponse } from '@/types/openai';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { uploadChartImage } from '@/utils/storageUtils';
import { Json } from '@/integrations/supabase/types';

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
      
      const { error } = await supabase
        .from('chart_analyses')
        .insert({
          user_id: user.id,
          analysis_data: analysisDataJson,
          pair_name: analysisData.pairName,
          timeframe: analysisData.timeframe,
          chart_url: chartUrl
        });
      
      if (error) {
        console.error("Error saving analysis to database:", error);
        toast({
          title: "Error",
          description: "Failed to save analysis to history",
          variant: "destructive",
        });
      } else {
        console.log("Analysis saved to database successfully");
      }
    } catch (err) {
      console.error("Error in saveAnalysisToDatabase:", err);
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
      const responseData = data as OpenAIResponse;
      
      if (!responseData.choices || responseData.choices.length === 0) {
        throw new Error('No response content from API');
      }

      // Parse the text response to extract JSON
      const resultText = responseData.choices[0].message.content || '';
      console.log("Raw API Response content:", resultText.substring(0, 100) + "...");
      
      // Extract JSON from the response (might be wrapped in code blocks)
      let jsonStr = resultText;
      if (resultText.includes('```json')) {
        jsonStr = resultText.split('```json')[1].split('```')[0].trim();
      } else if (resultText.includes('```')) {
        jsonStr = resultText.split('```')[1].split('```')[0].trim();
      }
      
      // Fix JSON format issues in risk-reward ratio before parsing
      jsonStr = cleanRiskRewardRatio(jsonStr);
      
      try {
        // Parse the JSON response and process it
        const parsedResult = JSON.parse(jsonStr);
        console.log("Parsed JSON result:", JSON.stringify(parsedResult).substring(0, 100) + "...");
        
        // Use detected pair name and timeframe from the API if available, otherwise fallback to placeholders
        const detectedPairName = parsedResult.pairName || pairName;
        const detectedTimeframe = parsedResult.timeframe || timeframe;
        
        // Determine if this is a forex pair to calculate pips correctly
        const isForex = detectedPairName.length === 6 && /[A-Z]{6}/.test(detectedPairName);
        
        // Find the current price level if available
        const currentPriceObj = Array.isArray(parsedResult.priceLevels) ? 
          parsedResult.priceLevels.find((l: any) => 
            l.name && l.name.toLowerCase().includes('current')
          ) : null;
        
        const currentPrice = currentPriceObj ? parseFloat(currentPriceObj.price) : null;
        console.log("Detected current price:", currentPrice);
        
        // Validate and adjust trading setup if needed
        if (parsedResult.tradingSetup && currentPrice !== null) {
          parsedResult.tradingSetup = validateAndAdjustLevels(
            parsedResult.tradingSetup, 
            detectedTimeframe, 
            currentPrice
          );
        }
        
        // Map the parsed result to our AnalysisResultData format
        const analysisData: AnalysisResultData = {
          pairName: detectedPairName,
          timeframe: detectedTimeframe,
          overallSentiment: parsedResult.overallSentiment || 'neutral',
          confidenceScore: parsedResult.confidenceScore || 50,
          marketAnalysis: parsedResult.marketAnalysis || 'Analysis not available.',
          trendDirection: parsedResult.trendDirection || 'neutral',
          marketFactors: Array.isArray(parsedResult.marketFactors) ? parsedResult.marketFactors.map(factor => ({
            name: factor.name,
            description: factor.description,
            sentiment: factor.sentiment.toLowerCase()
          })) : [],
          chartPatterns: Array.isArray(parsedResult.chartPatterns) ? parsedResult.chartPatterns.map(pattern => ({
            name: pattern.name,
            confidence: pattern.confidence,
            signal: typeof pattern.signal === 'string' ? 
                    pattern.signal.toLowerCase().includes('bullish') ? 'bullish' : 
                    pattern.signal.toLowerCase().includes('bearish') ? 'bearish' : 'neutral' 
                    : 'neutral',
            status: pattern.status || "complete"
          })) : [],
          priceLevels: Array.isArray(parsedResult.priceLevels) ? parsedResult.priceLevels.map(level => {
            const price = parseFloat(level.price);
            let direction: 'up' | 'down';
            let pips: number;
            
            // Determine direction based on comparison with current price
            if (currentPrice !== null && !isNaN(price)) {
              direction = price > currentPrice ? 'up' : 'down';
              
              // Calculate pips using the improved helper function
              pips = calculateDistanceInPips(currentPrice, price, isForex, detectedPairName);
            } else {
              // Fallback if current price is not available
              direction = level.direction && level.direction.toLowerCase().includes('above') ? 'up' : 'down';
              
              // Try to use the distance from the API if available
              if (level.distance) {
                if (typeof level.distance === 'string' && level.distance.includes('%')) {
                  return {
                    name: level.name,
                    price: price.toString(),
                    distance: level.distance, // Keep percentage as is
                    direction
                  };
                } else {
                  // Parse numeric distance if available
                  const distanceNum = parseFloat(level.distance);
                  if (!isNaN(distanceNum)) {
                    pips = Math.round(distanceNum);
                  } else {
                    pips = 0; // Default if we can't parse
                  }
                }
              } else {
                pips = 0; // Default if distance not provided
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
                        parsedResult.takeProfits.map(tp => tp.toString()) : undefined,
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

        // Save the analysis result
        setAnalysisResult(analysisData);
        
        // Save the analysis to Supabase
        await saveAnalysisToDatabase(analysisData, chartUrl);

        toast({
          title: "Analysis Complete",
          description: `Successfully analyzed the ${analysisData.pairName} chart on ${analysisData.timeframe} timeframe`,
          variant: "default",
        });
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError, "Raw text:", jsonStr);
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
