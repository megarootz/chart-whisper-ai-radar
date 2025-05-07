
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData } from '@/components/AnalysisResult';

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();

  const analyzeChart = async (file: File, pairName: string, timeframe: string) => {
    try {
      setIsAnalyzing(true);
      // Convert image to base64 to simulate API request
      const base64Image = await fileToBase64(file);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock response for development purposes
      const mockResult: AnalysisResultData = {
        pairName,
        timeframe,
        overallSentiment: 'mildly bullish',
        confidenceScore: 85,
        marketAnalysis: `The ${timeframe} chart shows a recent pullback in ${pairName} after a strong upward move, consolidating around the $3360-$3380 level. This could be a temporary retracement within a broader uptrend. Key support is found near $3340, while the $3400 level represents immediate resistance.`,
        trendDirection: 'bullish',
        marketFactors: [
          {
            name: "Interest Rates",
            description: "Higher interest rates typically put downward pressure on Gold, as they increase the opportunity cost of holding non-yielding assets.",
            sentiment: "bearish"
          },
          {
            name: "Inflation",
            description: "High inflation can increase demand for Gold as a hedge against inflation.",
            sentiment: "bullish"
          },
          {
            name: "US Dollar Index",
            description: "Gold's price often moves inversely with the USD. A strong dollar weakens Gold's price.",
            sentiment: "neutral"
          }
        ],
        chartPatterns: [
          {
            name: "Consolidation",
            confidence: 70,
            signal: "neutral"
          },
          {
            name: "Potential Bullish Flag",
            confidence: 60,
            signal: "bullish"
          }
        ],
        priceLevels: [
          {
            name: "R3",
            price: "$3450.00",
            distance: "2.55%",
            direction: "up"
          },
          {
            name: "R2",
            price: "$3420.00",
            distance: "1.66%",
            direction: "up"
          },
          {
            name: "R1",
            price: "$3400.00",
            distance: "1.07%",
            direction: "up"
          },
          {
            name: "Current Price",
            price: "$3364.07",
            distance: "0.00%",
            direction: "up"
          },
          {
            name: "S1",
            price: "$3360.00",
            distance: "0.12%",
            direction: "down"
          },
          {
            name: "S2",
            price: "$3340.00",
            distance: "0.72%",
            direction: "down"
          },
          {
            name: "S3",
            price: "$3320.00",
            distance: "1.33%",
            direction: "down"
          }
        ],
        entryLevel: "$3360.00",
        stopLoss: "$3320.00",
        takeProfits: ["$3400.00", "$3420.00"],
        tradingInsight: "Gold often responds strongly to psychological levels like $3000, $3050, etc. Watch for price reaction at these key points."
      };

      setAnalysisResult(mockResult);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed the ${pairName} chart on ${timeframe} timeframe`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error analyzing chart:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the chart. Please try again later.",
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
