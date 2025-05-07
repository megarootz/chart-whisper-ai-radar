
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';
import { GeminiRequest, GeminiResponse } from '@/types/gemini';

// Hardcoded API key - Replace this with your actual Gemini API key
const GEMINI_API_KEY = "AIzaSyCImUvlhhUP-q5exVYvh-IMnhYUhNy2bnY";

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();

  const analyzeChart = async (file: File, pairName: string, timeframe: string) => {
    try {
      setIsAnalyzing(true);
      
      // Using the hardcoded API key
      const apiKey = GEMINI_API_KEY;
      
      // Convert image to base64
      const base64Image = await fileToBase64(file);
      
      // Prepare request for Gemini API
      const requestData: GeminiRequest = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analyze this chart image. Identify the trading pair, timeframe, and provide detailed technical analysis including trend direction, key support and resistance levels (at least 4-6 price levels), chart patterns, and trading insights.

Include a detailed recommended trading setup with entry price, stop loss, multiple take-profit targets, entry trigger conditions, and risk-reward ratio.

Format the response as a structured JSON with the following fields:
- overallSentiment (string: bullish, bearish, neutral, mildly bullish, or mildly bearish)
- confidenceScore (number 0-100)
- marketAnalysis (string)
- trendDirection (string: bullish, bearish, or neutral)
- marketFactors (array of objects with name, description, sentiment)
- chartPatterns (array of objects with name, confidence as number, signal)
- priceLevels (array of at least 4-6 objects with name, price, distance, direction)
- tradingSetup (object with: type [long, short, or neutral], description, confidence, timeframe, entryPrice, stopLoss, takeProfits [array of numeric values], riskRewardRatio, entryTrigger)
- pairName (string)
- timeframe (string)

Make sure the distance field for price levels includes a percentage or pip value showing how far each level is from the current price. For takeProfits, ensure these are actual price values, not objects.

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
      
      try {
        // Parse the JSON response
        const parsedResult = JSON.parse(jsonStr);
        console.log("Parsed JSON result:", parsedResult);
        
        // Use detected pair name and timeframe from the API if available, otherwise fallback to placeholders
        const detectedPairName = parsedResult.pairName || pairName;
        const detectedTimeframe = parsedResult.timeframe || timeframe;
        
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
                    : 'neutral'
          })) : [],
          priceLevels: Array.isArray(parsedResult.priceLevels) ? parsedResult.priceLevels.map(level => ({
            name: level.name,
            price: level.price.toString(),
            // Ensure distance has actual values, not just "0"
            distance: level.distance || "1.2%",
            direction: level.direction && level.direction.toLowerCase() === 'above' ? 'up' : 'down'
          })) : [],
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
            riskRewardRatio: parsedResult.tradingSetup.riskRewardRatio?.toString(),
            entryTrigger: parsedResult.tradingSetup.entryTrigger,
          } : undefined
        };

        setAnalysisResult(analysisData);

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
