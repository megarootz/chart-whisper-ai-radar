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
      
      // Convert image to base64
      const base64Image = await fileToBase64(file);
      
      // Upload image to Supabase storage
      let chartUrl: string | undefined;
      try {
        await initializeStorage(user.id);
        chartUrl = await uploadChartImage(file, user.id);
        console.log('Chart image uploaded successfully:', chartUrl);
      } catch (uploadError) {
        console.error('Failed to upload chart image:', uploadError);
      }
      
      console.log("Calling Supabase Edge Function to analyze chart");
      
      // Call our Supabase Edge Function
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

      // Parse the text response
      const resultText = responseData.choices[0].message.content || '';
      console.log("Raw API Response content:", resultText.substring(0, 100) + "...");
      
      // Process response with enhanced parsing for precise price levels
      const analysisData = processEnhancedTextResult(resultText);
      
      // Save the analysis result
      setAnalysisResult(analysisData);
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

  // Enhanced processing function for precise price level extraction
  const processEnhancedTextResult = (resultText: string): AnalysisResultData => {
    console.log("Processing enhanced analysis result:", resultText.substring(0, 200));
    
    // Extract trading pair and timeframe
    const titlePatterns = [
      /\[([A-Z0-9\/]{3,12})\]\s+Technical\s+Analysis\s+\(\s*([^)]+)\s*Chart\)/i,
      /^([A-Z]{3}\/[A-Z]{3,4})\s+Technical\s+Analysis\s+\(\s*([^)]+)\s*Chart\)/i,
      /([A-Z]{3,4}\/[A-Z]{3,4})\s+.*?\s+\(([^)]+)\s*Chart\)/i
    ];
    
    let symbol = "";
    let timeframe = "";
    
    for (const pattern of titlePatterns) {
      const match = resultText.match(pattern);
      if (match) {
        symbol = match[1].trim();
        timeframe = match[2].trim();
        break;
      }
    }
    
    // Fallback extraction
    if (!symbol) {
      const pairMatch = resultText.match(/\b([A-Z]{3}\/[A-Z]{3,4}|[A-Z]{3,4}\/USD[T]?)\b/);
      if (pairMatch) symbol = pairMatch[1];
    }
    
    if (!timeframe) {
      const timeframeMatch = resultText.match(/\b(1[Mm]|5[Mm]|15[Mm]|30[Mm]|1[Hh]|4[Hh]|[Dd]aily|[Ww]eekly|[Mm]onthly)\b/i);
      if (timeframeMatch) timeframe = timeframeMatch[1];
    }
    
    symbol = symbol || "Unknown Pair";
    timeframe = timeframe || "Unknown Timeframe";
    symbol = formatTradingPair(symbol);
    
    // Extract trend direction
    const trendMatch = resultText.match(/Overall\s+trend:\s*([^\n.]+)/i);
    const trendDirection = trendMatch ? 
      (trendMatch[1].toLowerCase().includes('bullish') ? 'bullish' : 
       trendMatch[1].toLowerCase().includes('bearish') ? 'bearish' : 'neutral') : 
      'neutral';
    
    // Extract market analysis
    const trendSectionMatch = resultText.match(/1\.\s+Trend\s+Direction:([\s\S]+?)(?=2\.\s+Key\s+Support|$)/i);
    const marketAnalysis = trendSectionMatch ? 
      trendSectionMatch[1].replace(/Overall\s+trend:\s*[^\n.]+/i, '').trim() : '';
    
    // Extract support levels with precise price extraction
    const supportSection = resultText.match(/2\.\s+Key\s+Support\s+Levels:([\s\S]+?)(?=3\.\s+Key\s+Resistance|$)/i);
    const supportLevels = supportSection ? extractPrecisePriceLevels(supportSection[1], false) : [];
    
    // Extract resistance levels with precise price extraction
    const resistanceSection = resultText.match(/3\.\s+Key\s+Resistance\s+Levels:([\s\S]+?)(?=4\.\s+Chart\s+Patterns|$)/i);
    const resistanceLevels = resistanceSection ? extractPrecisePriceLevels(resistanceSection[1], true) : [];
    
    const priceLevels = [...supportLevels, ...resistanceLevels];
    
    // Extract chart patterns
    const patternsSection = resultText.match(/4\.\s+Chart\s+Patterns:([\s\S]+?)(?=5\.\s+Technical\s+Indicators|$)/i);
    const chartPatterns = patternsSection ? extractChartPatterns(patternsSection[1]) : [];
    
    // Extract technical indicators
    const indicatorsSection = resultText.match(/5\.\s+Technical\s+Indicators[^:]*:([\s\S]+?)(?=6\.\s+Trading\s+Insights|$)/i);
    const technicalIndicators = indicatorsSection ? extractMarketFactors(indicatorsSection[1]) : [];
    
    // Extract trading insights with precise price extraction
    const insightsSection = resultText.match(/6\.\s+Trading\s+Insights:([\s\S]+?)$/i);
    const tradingInsight = insightsSection ? insightsSection[1].trim() : '';
    
    // Extract scenarios with precise price extraction
    const bullishMatch = resultText.match(/Bullish\s+Scenario:\s*([^\n]+)/i);
    const bearishMatch = resultText.match(/Bearish\s+Scenario:\s*([^\n]+)/i);
    const neutralMatch = resultText.match(/Neutral\s+Scenario:\s*([^\n]+)/i);
    
    let overallSentiment: 'bullish' | 'bearish' | 'neutral' | 'mildly bullish' | 'mildly bearish' = trendDirection as any;
    
    // Create trading setup with precise price extraction
    let tradingSetup: TradingSetup | undefined;
    
    if (bullishMatch && trendDirection !== 'bearish') {
      const bullishText = bullishMatch[1];
      const entryMatch = bullishText.match(/entry[:\s]*([0-9,.]+)/i);
      const stopMatch = bullishText.match(/stop[:\s]*([0-9,.]+)/i);
      const targetMatch = bullishText.match(/target[:\s]*([0-9,.]+)/i);
      
      tradingSetup = {
        type: 'long',
        description: bullishText,
        confidence: 75,
        timeframe,
        entryPrice: entryMatch ? entryMatch[1] : undefined,
        stopLoss: stopMatch ? stopMatch[1] : undefined,
        takeProfits: targetMatch ? [targetMatch[1]] : [],
        riskRewardRatio: "1:2",
      };
    } else if (bearishMatch && trendDirection !== 'bullish') {
      const bearishText = bearishMatch[1];
      const entryMatch = bearishText.match(/entry[:\s]*([0-9,.]+)/i);
      const stopMatch = bearishText.match(/stop[:\s]*([0-9,.]+)/i);
      const targetMatch = bearishText.match(/target[:\s]*([0-9,.]+)/i);
      
      tradingSetup = {
        type: 'short',
        description: bearishText,
        confidence: 75,
        timeframe,
        entryPrice: entryMatch ? entryMatch[1] : undefined,
        stopLoss: stopMatch ? stopMatch[1] : undefined,
        takeProfits: targetMatch ? [targetMatch[1]] : [],
        riskRewardRatio: "1:2",
      };
    } else if (neutralMatch) {
      tradingSetup = {
        type: 'neutral',
        description: neutralMatch[1],
        confidence: 70,
        timeframe,
      };
    }
    
    return {
      pairName: symbol,
      timeframe: timeframe,
      overallSentiment,
      confidenceScore: 75,
      marketAnalysis,
      trendDirection: trendDirection as any,
      marketFactors: technicalIndicators,
      chartPatterns,
      priceLevels,
      tradingSetup,
      tradingInsight
    };
  };
  
  // Enhanced function for extracting precise numerical price levels
  const extractPrecisePriceLevels = (text: string, isResistance: boolean): PriceLevel[] => {
    const levels: PriceLevel[] = [];
    
    // Enhanced pattern to match "Level X: EXACT_PRICE - description"
    const levelPattern = /Level\s+(\d+):\s*([0-9]+\.?[0-9]*)\s*[-–]\s*([^\n]+)/g;
    let match;
    
    while ((match = levelPattern.exec(text)) !== null && levels.length < 5) {
      const levelNumber = match[1];
      const exactPrice = match[2];
      const description = match[3].trim();
      
      // Validate that we have a proper numerical price
      if (/^\d+\.?\d*$/.test(exactPrice)) {
        levels.push({
          name: isResistance ? `Resistance: ${description}` : `Support: ${description}`,
          price: exactPrice,
          direction: isResistance ? 'up' : 'down'
        });
      }
    }
    
    // Alternative pattern for direct price extraction
    if (levels.length === 0) {
      const altPattern = /([0-9]+\.?[0-9]*)\s*[-–]\s*([^\n]+)/g;
      
      while ((match = altPattern.exec(text)) !== null && levels.length < 5) {
        const exactPrice = match[1];
        const description = match[2].trim();
        
        // Validate numerical price and skip if description contains non-price info
        if (/^\d+\.?\d*$/.test(exactPrice) && !description.toLowerCase().includes('ema') && !description.toLowerCase().includes('dynamic')) {
          levels.push({
            name: isResistance ? `Resistance: ${description}` : `Support: ${description}`,
            price: exactPrice,
            direction: isResistance ? 'up' : 'down'
          });
        }
      }
    }
    
    return levels;
  };
  
  // Helper functions for extraction
  const extractPriceLevels = (text: string, isResistance: boolean): PriceLevel[] => {
    const levels: PriceLevel[] = [];
    
    // Extract bullet points or numbered list items
    const bulletPattern = /(?:•|\-|\*|[0-9]+\.)\s+([0-9,.\s-]+)(?:zone|level|area)?:?\s+([^\n]+)/g;
    let match;
    
    while ((match = bulletPattern.exec(text)) !== null) {
      const priceRange = match[1].trim();
      const description = match[2].trim();
      
      levels.push({
        name: isResistance ? `Resistance: ${description}` : `Support: ${description}`,
        price: priceRange,
        direction: isResistance ? 'up' : 'down'
      });
    }
    
    // If no bullets found, try to extract price ranges directly
    if (levels.length === 0) {
      const pricePattern = /([0-9,.\s-]+)(?:zone|level|area)?:?\s+([^\n]+)/g;
      
      while ((match = pricePattern.exec(text)) !== null) {
        const priceRange = match[1].trim();
        const description = match[2].trim();
        
        levels.push({
          name: isResistance ? `Resistance: ${description}` : `Support: ${description}`,
          price: priceRange,
          direction: isResistance ? 'up' : 'down'
        });
      }
    }
    
    return levels;
  };
  
  const extractChartPatterns = (text: string): ChartPattern[] => {
    const patterns: ChartPattern[] = [];
    
    const patternRegex = /(?:•|\-|\*|[0-9]+\.)\s+([^:]+)(?::|Formation|Pattern)([^\n]+)?/g;
    let match;
    
    while ((match = patternRegex.exec(text)) !== null) {
      const patternName = match[1].trim();
      const description = match[2] ? match[2].trim() : '';
      
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if ((patternName + description).toLowerCase().includes('bullish')) {
        signal = 'bullish';
      } else if ((patternName + description).toLowerCase().includes('bearish')) {
        signal = 'bearish';
      }
      
      patterns.push({
        name: patternName,
        confidence: 70,
        signal,
        status: (patternName + description).toLowerCase().includes('forming') ? 'forming' : 'complete'
      });
    }
    
    if (patterns.length === 0) {
      const patternTypes = [
        'Double Top', 'Double Bottom', 'Head and Shoulders', 
        'Inverse Head and Shoulders', 'Triangle', 
        'Flag', 'Pennant', 'Wedge'
      ];
      
      for (const pattern of patternTypes) {
        if (text.includes(pattern)) {
          const patternIndex = text.indexOf(pattern);
          const surroundingText = text.substring(
            Math.max(0, patternIndex - 50), 
            Math.min(text.length, patternIndex + pattern.length + 200)
          );
          
          let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          if (surroundingText.toLowerCase().includes('bullish')) {
            signal = 'bullish';
          } else if (surroundingText.toLowerCase().includes('bearish')) {
            signal = 'bearish';
          }
          
          patterns.push({
            name: pattern,
            confidence: 70,
            signal,
            status: surroundingText.toLowerCase().includes('forming') ? 'forming' : 'complete'
          });
        }
      }
    }
    
    return patterns;
  };
  
  const extractMarketFactors = (text: string): MarketFactor[] => {
    const marketFactors: MarketFactor[] = [];
    
    const lines = text.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (line && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
        line = line.substring(1).trim();
        
        let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (line.toLowerCase().includes('bullish') || 
            line.toLowerCase().includes('overbought')) {
          sentiment = 'bullish';
        } else if (line.toLowerCase().includes('bearish') || 
                  line.toLowerCase().includes('oversold')) {
          sentiment = 'bearish';
        }
        
        const colonPos = line.indexOf(':');
        let name = 'Technical Indicator';
        if (colonPos > 0) {
          name = line.substring(0, colonPos).trim();
          line = line.substring(colonPos + 1).trim();
        } else {
          const indicators = ['RSI', 'MACD', 'Moving Average', 'MA', 'Stochastic', 'Volume'];
          for (const ind of indicators) {
            if (line.includes(ind)) {
              name = ind;
              break;
            }
          }
        }
        
        marketFactors.push({
          name,
          description: line,
          sentiment
        });
      }
    }
    
    if (marketFactors.length === 0) {
      const paragraphs = text.split('\n\n');
      for (const para of paragraphs) {
        if (para.trim()) {
          let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          if (para.toLowerCase().includes('bullish') || 
              para.toLowerCase().includes('overbought')) {
            sentiment = 'bullish';
          } else if (para.toLowerCase().includes('bearish') || 
                    para.toLowerCase().includes('oversold')) {
            sentiment = 'bearish';
          }
          
          let name = 'Technical Indicator';
          const indicators = ['RSI', 'MACD', 'Moving Average', 'MA', 'Stochastic', 'Volume'];
          for (const ind of indicators) {
            if (para.includes(ind)) {
              name = ind;
              break;
            }
          }
          
          marketFactors.push({
            name,
            description: para.trim(),
            sentiment
          });
        }
      }
    }
    
    return marketFactors;
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
