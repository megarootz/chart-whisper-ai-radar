
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
                text: `Analyze this ${pairName} chart on the ${timeframe} timeframe. Provide a detailed technical analysis including trend direction, key support and resistance levels, chart patterns, and trading insights. Format the response as a structured JSON with the following fields: overallSentiment (string: bullish, bearish, or neutral), confidenceScore (number 0-100), marketAnalysis (string), trendDirection (string: bullish, bearish, or neutral), marketFactors (array of objects with name, description, sentiment), chartPatterns (array of objects with name, confidence as number, signal), priceLevels (array of objects with name, price, distance, direction), entryLevel (optional), stopLoss (optional), takeProfits (optional array), tradingInsight (optional). Make the response concise but comprehensive.`
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
        
        // Map the parsed result to our AnalysisResultData format
        const analysisData: AnalysisResultData = {
          pairName,
          timeframe,
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
            distance: level.distance,
            direction: level.direction && level.direction.toLowerCase() === 'above' ? 'up' : 'down'
          })) : [],
          entryLevel: parsedResult.entryLevel ? parsedResult.entryLevel.toString() : undefined,
          stopLoss: parsedResult.stopLoss ? parsedResult.stopLoss.toString() : undefined,
          takeProfits: Array.isArray(parsedResult.takeProfits) ? 
                        parsedResult.takeProfits.map(tp => tp.toString()) : undefined,
          tradingInsight: parsedResult.tradingInsight
        };

        setAnalysisResult(analysisData);

        toast({
          title: "Analysis Complete",
          description: `Successfully analyzed the ${pairName} chart on ${timeframe} timeframe`,
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
