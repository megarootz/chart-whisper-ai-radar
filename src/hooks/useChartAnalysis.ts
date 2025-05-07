
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';
import { GeminiRequest, GeminiResponse } from '@/types/gemini';

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();

  const analyzeChart = async (file: File, pairName: string, timeframe: string) => {
    try {
      setIsAnalyzing(true);
      
      // Get API key from local storage
      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) {
        toast({
          title: "API Key Missing",
          description: "Please set your Gemini API key in the settings",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      // Convert image to base64
      const base64Image = await fileToBase64(file);
      
      // Prepare request for Gemini API
      const requestData: GeminiRequest = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analyze this ${pairName} chart on the ${timeframe} timeframe. Provide a detailed technical analysis including trend direction, key support and resistance levels, chart patterns, and trading insights. Format the response as a structured JSON with the following fields: overallSentiment (string), confidenceScore (number 0-100), marketAnalysis (string), trendDirection (string: bullish, bearish, or neutral), marketFactors (array of objects with name, description, sentiment), chartPatterns (array of objects with name, confidence as number, signal), priceLevels (array of objects with name, price, distance, direction), entryLevel (optional), stopLoss (optional), takeProfits (optional array), tradingInsight (optional). Make the response concise but comprehensive.`
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
        throw new Error(errorData.error?.message || 'Failed to analyze the chart');
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      // Parse the text response to extract JSON
      const resultText = data.candidates[0].content.parts[0].text || '';
      
      // Extract JSON from the response (might be wrapped in code blocks)
      let jsonStr = resultText;
      if (resultText.includes('```json')) {
        jsonStr = resultText.split('```json')[1].split('```')[0].trim();
      } else if (resultText.includes('```')) {
        jsonStr = resultText.split('```')[1].split('```')[0].trim();
      }
      
      // Parse the JSON response
      const parsedResult = JSON.parse(jsonStr);
      
      // Map the parsed result to our AnalysisResultData format
      const analysisData: AnalysisResultData = {
        pairName,
        timeframe,
        overallSentiment: parsedResult.overallSentiment || 'neutral',
        confidenceScore: parsedResult.confidenceScore || 50,
        marketAnalysis: parsedResult.marketAnalysis || 'Analysis not available.',
        trendDirection: parsedResult.trendDirection || 'neutral',
        marketFactors: parsedResult.marketFactors || [],
        chartPatterns: parsedResult.chartPatterns || [],
        priceLevels: parsedResult.priceLevels || [],
        entryLevel: parsedResult.entryLevel,
        stopLoss: parsedResult.stopLoss,
        takeProfits: parsedResult.takeProfits,
        tradingInsight: parsedResult.tradingInsight
      };

      setAnalysisResult(analysisData);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed the ${pairName} chart on ${timeframe} timeframe`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error analyzing chart:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the chart. Please try again.",
        variant: "destructive",
      });
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
