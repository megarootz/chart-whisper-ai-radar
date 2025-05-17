
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
    
    // Extract market analysis - get full trend section
    const trendSectionMatch = resultText.match(/1\.\s+Trend\s+Direction:([\s\S]+?)(?=2\.\s+Key\s+Support|$)/i);
    const marketAnalysis = trendSectionMatch ? trendSectionMatch[1].trim() : '';
    
    // Extract support levels
    const supportSection = resultText.match(/2\.\s+Key\s+Support\s+Levels:([\s\S]+?)(?=3\.\s+Key\s+Resistance|$)/i);
    const supportLevels = supportSection ? extractPriceLevels(supportSection[1], false) : [];
    
    // Extract resistance levels
    const resistanceSection = resultText.match(/3\.\s+Key\s+Resistance\s+Levels:([\s\S]+?)(?=4\.\s+Chart\s+Patterns|$)/i);
    const resistanceLevels = resistanceSection ? extractPriceLevels(resistanceSection[1], true) : [];
    
    // Combine all price levels
    const priceLevels = [...supportLevels, ...resistanceLevels];
    
    // Extract chart patterns
    const patternsSection = resultText.match(/4\.\s+Chart\s+Patterns:([\s\S]+?)(?=5\.\s+Technical\s+Indicators|$)/i);
    const chartPatterns = patternsSection ? extractChartPatterns(patternsSection[1]) : [];
    
    // Extract technical indicators
    const indicatorsSection = resultText.match(/5\.\s+Technical\s+Indicators[^:]*:([\s\S]+?)(?=6\.\s+Trading\s+Insights|$)/i);
    const technicalIndicators = indicatorsSection ? 
      extractMarketFactors(indicatorsSection[1]) : [];
    
    // Extract trading insights
    const insightsSection = resultText.match(/6\.\s+Trading\s+Insights:([\s\S]+?)(?=Summary|$)/i);
    const tradingInsight = insightsSection ? insightsSection[1].trim() : '';
    
    // Extract bullish scenario
    const bullishSection = resultText.match(/Bullish\s+Scenario:([\s\S]+?)(?=Bearish\s+Scenario|Neutral|$)/i);
    const bullishDetails = bullishSection ? bullishSection[1].trim() : '';
    
    // Extract bearish scenario
    const bearishSection = resultText.match(/Bearish\s+Scenario:([\s\S]+?)(?=Neutral|Bullish|$)/i);
    const bearishDetails = bearishSection ? bearishSection[1].trim() : '';
    
    // Extract neutral scenario
    const neutralSection = resultText.match(/Neutral\s*\/?\s*Consolidation\s+Scenario:([\s\S]+?)(?=Bullish|Bearish|$)/i);
    const neutralDetails = neutralSection ? neutralSection[1].trim() : '';
    
    // Determine overall sentiment
    let overallSentiment: 'bullish' | 'bearish' | 'neutral' | 'mildly bullish' | 'mildly bearish';
    
    if (resultText.toLowerCase().includes('trading bias: bullish')) {
      overallSentiment = 'bullish';
    } else if (resultText.toLowerCase().includes('trading bias: bearish')) {
      overallSentiment = 'bearish';
    } else if (resultText.toLowerCase().includes('trading bias: neutral')) {
      overallSentiment = 'neutral';
    } else {
      // Default to trend direction
      overallSentiment = trendDirection as any;
    }
    
    // Create trading setup based on scenarios
    let tradingSetup: TradingSetup | undefined;
    
    if (bullishDetails && trendDirection !== 'bearish') {
      // Extract entry/target/stop from bullish scenario
      const stopMatch = bullishDetails.match(/stop[\s-]*loss[^0-9]+([0-9,.]+)/i);
      const targetMatch = bullishDetails.match(/(?:target|resistance)[^0-9]+([0-9,.]+)/i);
      
      tradingSetup = {
        type: 'long',
        description: bullishDetails,
        confidence: 70,
        timeframe,
        stopLoss: stopMatch ? stopMatch[1] : undefined,
        takeProfits: targetMatch ? [targetMatch[1]] : [],
        riskRewardRatio: "1:2",
      };
    } else if (bearishDetails && trendDirection !== 'bullish') {
      // Extract entry/target/stop from bearish scenario
      const stopMatch = bearishDetails.match(/stop[\s-]*loss[^0-9]+([0-9,.]+)/i);
      const targetMatch = bearishDetails.match(/(?:target|support)[^0-9]+([0-9,.]+)/i);
      
      tradingSetup = {
        type: 'short',
        description: bearishDetails,
        confidence: 70,
        timeframe,
        stopLoss: stopMatch ? stopMatch[1] : undefined,
        takeProfits: targetMatch ? [targetMatch[1]] : [],
        riskRewardRatio: "1:2",
      };
    } else if (neutralDetails) {
      tradingSetup = {
        type: 'neutral',
        description: neutralDetails,
        confidence: 70,
        timeframe,
      };
    }
    
    return {
      pairName: symbol,
      timeframe: timeframe,
      overallSentiment,
      confidenceScore: 70,
      marketAnalysis,
      trendDirection: trendDirection as any,
      marketFactors: technicalIndicators,
      chartPatterns,
      priceLevels,
      tradingSetup,
      tradingInsight
    };
  };
  
  // Helper function to extract price levels from text
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
  
  // Helper function to extract chart patterns from text
  const extractChartPatterns = (text: string): ChartPattern[] => {
    const patterns: ChartPattern[] = [];
    
    // Look for pattern names and descriptions
    const patternRegex = /(?:•|\-|\*|[0-9]+\.)\s+([^:]+)(?::|Formation|Pattern)([^\n]+)?/g;
    let match;
    
    while ((match = patternRegex.exec(text)) !== null) {
      const patternName = match[1].trim();
      const description = match[2] ? match[2].trim() : '';
      
      // Determine if bullish or bearish
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if ((patternName + description).toLowerCase().includes('bullish')) {
        signal = 'bullish';
      } else if ((patternName + description).toLowerCase().includes('bearish')) {
        signal = 'bearish';
      }
      
      patterns.push({
        name: patternName,
        confidence: 70, // Default confidence
        signal,
        status: (patternName + description).toLowerCase().includes('forming') ? 'forming' : 'complete'
      });
    }
    
    // If no patterns found with regex, check if there are complete sections
    if (patterns.length === 0) {
      // Check for known pattern types
      const patternTypes = [
        'Double Top', 'Double Bottom', 'Head and Shoulders', 
        'Inverse Head and Shoulders', 'Triangle', 
        'Flag', 'Pennant', 'Wedge'
      ];
      
      for (const pattern of patternTypes) {
        if (text.includes(pattern)) {
          // Find the surrounding text
          const patternIndex = text.indexOf(pattern);
          const surroundingText = text.substring(
            Math.max(0, patternIndex - 50), 
            Math.min(text.length, patternIndex + pattern.length + 200)
          );
          
          // Determine sentiment
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
  
  // Helper function to extract market factors from technical indicators text
  const extractMarketFactors = (text: string): MarketFactor[] => {
    const marketFactors: MarketFactor[] = [];
    
    // Extract bullet points
    const lines = text.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (line && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
        // Remove the bullet and trim
        line = line.substring(1).trim();
        
        // Determine sentiment
        let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (line.toLowerCase().includes('bullish') || 
            line.toLowerCase().includes('overbought')) {
          sentiment = 'bullish';
        } else if (line.toLowerCase().includes('bearish') || 
                  line.toLowerCase().includes('oversold')) {
          sentiment = 'bearish';
        }
        
        // Try to extract indicator name
        const colonPos = line.indexOf(':');
        let name = 'Technical Indicator';
        if (colonPos > 0) {
          name = line.substring(0, colonPos).trim();
          line = line.substring(colonPos + 1).trim();
        } else {
          // Try to find common indicator names
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
    
    // If no bullet points found, try to extract paragraphs
    if (marketFactors.length === 0) {
      const paragraphs = text.split('\n\n');
      for (const para of paragraphs) {
        if (para.trim()) {
          // Determine sentiment
          let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          if (para.toLowerCase().includes('bullish') || 
              para.toLowerCase().includes('overbought')) {
            sentiment = 'bullish';
          } else if (para.toLowerCase().includes('bearish') || 
                    para.toLowerCase().includes('oversold')) {
            sentiment = 'bearish';
          }
          
          // Try to extract indicator name
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
