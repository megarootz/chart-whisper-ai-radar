
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';
import { GeminiRequest, GeminiResponse } from '@/types/gemini';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Hardcoded API key - Replace this with your actual Gemini API key
const GEMINI_API_KEY = "AIzaSyCImUvlhhUP-q5exVYvh-IMnhYUhNy2bnY";

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to save analysis to Supabase
  const saveAnalysisToDatabase = async (analysis: AnalysisResultData, chartUrl?: string) => {
    try {
      if (!user) {
        throw new Error('User must be logged in to save analysis');
      }
      
      const { error } = await supabase
        .from('chart_analyses')
        .insert({
          user_id: user.id,
          chart_url: chartUrl,
          pair_name: analysis.pairName,
          timeframe: analysis.timeframe,
          analysis_data: analysis
        });
      
      if (error) {
        throw error;
      }
      
      console.log('Analysis saved to database');
    } catch (error) {
      console.error('Failed to save analysis to database:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis to your history. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  // New helper function to validate if the stop loss and take profit levels are appropriate for the timeframe
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

  const analyzeChart = async (file: File, pairName: string, timeframe: string) => {
    try {
      setIsAnalyzing(true);
      
      if (!user) {
        throw new Error('You must be logged in to analyze charts');
      }
      
      // Convert image to base64
      const base64Image = await fileToBase64(file);
      
      // Upload image to Supabase storage
      let chartUrl: string | undefined;
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('chart_images')
          .upload(fileName, file);
        
        if (storageError) {
          console.error('Error uploading chart image:', storageError);
        } else if (storageData) {
          const { data: urlData } = supabase.storage
            .from('chart_images')
            .getPublicUrl(fileName);
            
          chartUrl = urlData.publicUrl;
        }
      } catch (uploadError) {
        console.error('Failed to upload chart image:', uploadError);
        // Continue with analysis even if image upload fails
      }
      
      // Using the hardcoded API key
      const apiKey = GEMINI_API_KEY;
      
      // Prepare request for Gemini API with improved prompt
      const requestData: GeminiRequest = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analyze this chart image. Identify the trading pair, timeframe, and provide detailed technical analysis including trend direction, key support and resistance levels, chart patterns, and trading insights.

Include a detailed recommended trading setup with entry price, stop loss, multiple take-profit targets, entry trigger conditions, and risk-reward ratio.

IMPORTANT: Make sure your stop loss and take profit levels are appropriate for the timeframe. Use these guidelines:
- For M1 (1-minute) charts: 5-20 pips SL/TP range
- For M5 (5-minute) charts: 10-30 pips SL/TP range
- For M15 (15-minute) charts: 15-50 pips SL/TP range
- For H1 (1-hour) charts: 20-100 pips SL/TP range
- For H4 (4-hour) charts: 50-200 pips SL/TP range
- For Daily charts: 100-500 pips SL/TP range
- For Weekly charts: 200+ pips SL/TP range

For chart patterns, identify both complete patterns and potential patterns that may be forming. Include a confidence score and signal direction for each pattern.

Format the response as a structured JSON with the following fields:
- overallSentiment (string: bullish, bearish, neutral, mildly bullish, or mildly bearish)
- confidenceScore (number 0-100)
- marketAnalysis (string)
- trendDirection (string: bullish, bearish, or neutral)
- marketFactors (array of objects with name, description, sentiment)
- chartPatterns (array of objects with name, confidence as number, signal, status ["complete" or "forming"])
- priceLevels (array of objects with name, price, distance, direction)
- tradingSetup (object with: type [long, short, or neutral], description, confidence, timeframe, entryPrice, stopLoss, takeProfits [array of numeric values], riskRewardRatio, entryTrigger)
- pairName (string)
- timeframe (string)

For the priceLevels, give me at least 6-8 PRECISE price levels (not rounded numbers) that correspond to actual visible support and resistance zones visible in the chart. Be specific, not generic. For example, instead of "1.2000", provide the exact price like "1.1987". Each level should include:
- name (describing the level, e.g., "Strong weekly resistance", "Daily support", "Recent lower high")
- price (the exact price level without rounding)
- distance (percentage or raw pips/points from current price)
- direction (above or below current price)

For takeProfits, ensure these are actual precise price values, not objects.

IMPORTANT: The riskRewardRatio should be formatted as a string like "1:3" to ensure proper JSON formatting.

Make the response concise but comprehensive, and ensure all numeric values are accurate based on the chart.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image.split(',')[1] // Remove the data URL prefix
                }
              }
            ]
          }
        ]
      };

      console.log("Sending request to Gemini API...");
      
      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error?.message || 'Failed to analyze the chart');
      }

      const data: GeminiResponse = await response.json();
      console.log("Received response from Gemini API:", data);
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      // Parse the text response to extract JSON
      const resultText = data.candidates[0].content.parts[0].text || '';
      console.log("Raw API Response:", resultText);
      
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
        // Parse the JSON response
        const parsedResult = JSON.parse(jsonStr);
        console.log("Parsed JSON result:", parsedResult);
        
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
          // Add the trading setup with proper takeProfits handling
          tradingSetup: parsedResult.tradingSetup ? {
            type: parsedResult.tradingSetup.type || 'neutral',
            description: parsedResult.tradingSetup.description || '',
            confidence: parsedResult.tradingSetup.confidence || 50,
            timeframe: parsedResult.tradingSetup.timeframe || detectedTimeframe,
            entryPrice: parsedResult.tradingSetup.entryPrice?.toString(),
            stopLoss: parsedResult.tradingSetup.stopLoss?.toString(),
            // Ensure takeProfits are strings, not objects
            takeProfits: Array.isArray(parsedResult.tradingSetup.takeProfits) ? 
                        parsedResult.tradingSetup.takeProfits.map((tp: any) => {
                          // If tp is an object, try to extract its value, otherwise convert to string
                          if (typeof tp === 'object' && tp !== null) {
                            // Try common property names like value, price, target
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
  };
};
