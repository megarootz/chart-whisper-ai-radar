
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
      
      // Process response as text format using the previous template structure
      const analysisData = processOriginalTextResult(resultText);
      
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
  
  // Reverting to the original text processing logic
  const processOriginalTextResult = (resultText: string): AnalysisResultData => {
    // Enhanced regex patterns for accurate pair detection
    const titlePatterns = [
      // Standard format in brackets with Technical Analysis
      /\[([^\]]+)\]\s+Technical\s+Analysis\s+\(\s*([^\)]+)\s*Chart\)/i,
      
      // Standard format without brackets
      /([A-Z0-9\/]{3,10})\s+Technical\s+Analysis\s+\(\s*([^\)]+)\s*Chart\)/i,
      
      // Direct pair and timeframe at start of text
      /^([A-Z0-9\/]{3,10})\s+.*?\s+\(([0-9]+[Hh]|[A-Z][a-z]+)\)/i,
      
      // Pair name at beginning of text
      /^([A-Z0-9\/]{3,10})\s+/
    ];
    
    // Try each pattern to extract pair and timeframe
    let symbol = "";
    let timeframe = "";
    
    for (const pattern of titlePatterns) {
      const match = resultText.match(pattern);
      if (match) {
        symbol = match[1].trim();
        if (match[2]) {
          timeframe = match[2].trim();
        }
        break;
      }
    }
    
    // If still no pair found, use these stronger extraction methods for pairs
    if (!symbol) {
      // Look for standard forex/crypto/commodity pairs with slash
      const pairMatch = resultText.match(/\b([A-Z]{3}\/[A-Z]{3}|[A-Z]{3,4}\/USD[T]?|[A-Z0-9]{3,6}\/[A-Z0-9]{3,6})\b/);
      if (pairMatch) {
        symbol = pairMatch[1];
      } else {
        // Look for major currency pairs without slash
        const currencyPairMatch = resultText.match(/\b(EUR|USD|GBP|JPY|AUD|NZD|CAD|CHF|XAU|XAG|BTC|ETH)[A-Z]{3}\b/i);
        if (currencyPairMatch) {
          const fullPair = currencyPairMatch[0].toUpperCase();
          const baseCurrency = currencyPairMatch[1].toUpperCase();
          const quoteCurrency = fullPair.substring(baseCurrency.length);
          symbol = `${baseCurrency}/${quoteCurrency}`;
        }
      }
    }
    
    // If still no timeframe found, look for standard timeframes
    if (!timeframe) {
      const timeframeMatch = resultText.match(/\b(1[mh]|5[mh]|15[mh]|30[mh]|1h|4h|daily|weekly|monthly)\b/i);
      if (timeframeMatch) {
        timeframe = timeframeMatch[1];
      }
    }
    
    // Default values if nothing is found
    if (!symbol) {
      symbol = "Unknown Pair";
    }
    
    if (!timeframe) {
      timeframe = "Unknown Timeframe";
    }
    
    // Format the pair correctly using our utility function
    symbol = formatTradingPair(symbol);
    
    // Ensure correct capitalization for timeframe
    timeframe = timeframe.charAt(0).toUpperCase() + timeframe.slice(1).toLowerCase();
    
    // Extract trend direction
    const trendMatch = resultText.match(/(?:Overall\s+trend|Trend\s+Direction):\s*([^\.\n]+)/i);
    const trendDirection = trendMatch ? 
      (trendMatch[1].toLowerCase().includes('bullish') ? 'bullish' : 
       trendMatch[1].toLowerCase().includes('bearish') ? 'bearish' : 'neutral') : 
      'neutral';
    
    // Extract market analysis - get full trend section
    const trendSectionMatch = resultText.match(/1\.\s+Trend\s+Direction:([\s\S]+?)(?=2\.\s+Key\s+Support|$)/i);
    const marketAnalysis = trendSectionMatch ? trendSectionMatch[1].trim() : '';
    
    // *** REVERT TO ORIGINAL SUPPORT/RESISTANCE EXTRACTION METHOD ***
    // Extract support levels using the original method (starting with number first)
    const supportLevels: PriceLevel[] = [];
    const supportSection = resultText.match(/2\.\s+Key\s+Support\s+Levels:([\s\S]+?)(?=3\.\s+Key\s+Resistance|$)/i);
    
    if (supportSection) {
      // Look for price patterns with formats like "123.456:" or "123.456 -"
      const priceMatches = supportSection[1].match(/(\d+(?:[,.]\d+)?)\s*(?::|:?\s+-)\s*([^\n]+)/g);
      
      if (priceMatches) {
        priceMatches.forEach(match => {
          const parts = match.match(/(\d+(?:[,.]\d+)?)\s*(?::|:?\s+-)\s*([^\n]+)/);
          if (parts) {
            const price = parts[1].trim();
            const description = parts[2].trim();
            
            supportLevels.push({
              name: `Support: ${description}`,
              price: price,
              direction: 'down'
            });
          }
        });
      } else {
        // Fallback to bullet point extraction if needed
        const bulletMatches = supportSection[1].match(/(?:•|\-|\*)\s+([^\n:]+?):\s*([^\n]+)/g);
        if (bulletMatches) {
          bulletMatches.forEach(match => {
            const parts = match.match(/(?:•|\-|\*)\s+([^\n:]+?):\s*([^\n]+)/);
            if (parts) {
              supportLevels.push({
                name: `Support: ${parts[2].trim()}`,
                price: parts[1].trim(),
                direction: 'down'
              });
            }
          });
        }
      }
    }
    
    // Extract resistance levels using the original method (starting with number first)
    const resistanceLevels: PriceLevel[] = [];
    const resistanceSection = resultText.match(/3\.\s+Key\s+Resistance\s+Levels:([\s\S]+?)(?=4\.\s+Chart\s+Patterns|$)/i);
    
    if (resistanceSection) {
      // Look for price patterns with formats like "123.456:" or "123.456 -"
      const priceMatches = resistanceSection[1].match(/(\d+(?:[,.]\d+)?)\s*(?::|:?\s+-)\s*([^\n]+)/g);
      
      if (priceMatches) {
        priceMatches.forEach(match => {
          const parts = match.match(/(\d+(?:[,.]\d+)?)\s*(?::|:?\s+-)\s*([^\n]+)/);
          if (parts) {
            const price = parts[1].trim();
            const description = parts[2].trim();
            
            resistanceLevels.push({
              name: `Resistance: ${description}`,
              price: price,
              direction: 'up'
            });
          }
        });
      } else {
        // Fallback to bullet point extraction if needed
        const bulletMatches = resistanceSection[1].match(/(?:•|\-|\*)\s+([^\n:]+?):\s*([^\n]+)/g);
        if (bulletMatches) {
          bulletMatches.forEach(match => {
            const parts = match.match(/(?:•|\-|\*)\s+([^\n:]+?):\s*([^\n]+)/);
            if (parts) {
              resistanceLevels.push({
                name: `Resistance: ${parts[2].trim()}`,
                price: parts[1].trim(),
                direction: 'up'
              });
            }
          });
        }
      }
    }
    
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
    
    // *** REVERT TO ORIGINAL TRADING SETUP EXTRACTION METHOD ***
    // Extract bullish scenario with more precise pattern matching
    const bullishSection = resultText.match(/Bullish\s+Scenario:\s*([\s\S]+?)(?=\s*Bearish\s+Scenario:|Neutral|$)/i);
    let bullishSetup: TradingSetup | undefined;
    
    if (bullishSection) {
      const bullishDetails = bullishSection[1].trim();
      
      // Extract entry price using original pattern
      const entryMatch = bullishDetails.match(/(?:Entry|Enter)[^0-9]*([0-9.,]+)/i);
      
      // Extract target(s)
      const targetMatches = bullishDetails.match(/(?:Target|Take\s+Profit)[^0-9]*([0-9.,]+)/ig);
      const targets: string[] = [];
      
      if (targetMatches) {
        targetMatches.forEach(match => {
          const targetNum = match.match(/(?:Target|Take\s+Profit)[^0-9]*([0-9.,]+)/i);
          if (targetNum) targets.push(targetNum[1]);
        });
      }
      
      // Extract stop loss
      const stopMatch = bullishDetails.match(/(?:Stop|SL)[^0-9]*([0-9.,]+)/i);
      
      if (entryMatch || targetMatches?.length || stopMatch) {
        bullishSetup = {
          type: 'long',
          description: bullishDetails.split('\n')[0], // First line as description
          confidence: 75,
          timeframe,
          entryPrice: entryMatch ? entryMatch[1] : undefined,
          stopLoss: stopMatch ? stopMatch[1] : undefined,
          takeProfits: targets.length > 0 ? targets : undefined,
          riskRewardRatio: "1:2",
        };
      }
    }
    
    // Extract bearish scenario with more precise pattern matching
    const bearishSection = resultText.match(/Bearish\s+Scenario:\s*([\s\S]+?)(?=\s*Bullish\s+Scenario:|Neutral|$)/i);
    let bearishSetup: TradingSetup | undefined;
    
    if (bearishSection && !bearishSection[1].toLowerCase().includes('no bearish scenario')) {
      const bearishDetails = bearishSection[1].trim();
      
      // Extract entry price using original pattern
      const entryMatch = bearishDetails.match(/(?:Entry|Enter)[^0-9]*([0-9.,]+)/i);
      
      // Extract target(s)
      const targetMatches = bearishDetails.match(/(?:Target|Take\s+Profit)[^0-9]*([0-9.,]+)/ig);
      const targets: string[] = [];
      
      if (targetMatches) {
        targetMatches.forEach(match => {
          const targetNum = match.match(/(?:Target|Take\s+Profit)[^0-9]*([0-9.,]+)/i);
          if (targetNum) targets.push(targetNum[1]);
        });
      }
      
      // Extract stop loss
      const stopMatch = bearishDetails.match(/(?:Stop|SL)[^0-9]*([0-9.,]+)/i);
      
      if (entryMatch || targetMatches?.length || stopMatch) {
        bearishSetup = {
          type: 'short',
          description: bearishDetails.split('\n')[0], // First line as description
          confidence: 75,
          timeframe,
          entryPrice: entryMatch ? entryMatch[1] : undefined,
          stopLoss: stopMatch ? stopMatch[1] : undefined,
          takeProfits: targets.length > 0 ? targets : undefined,
          riskRewardRatio: "1:2",
        };
      }
    }
    
    // Extract neutral scenario
    const neutralSection = resultText.match(/Neutral\s*\/?\s*Consolidation\s+Scenario:\s*([\s\S]+?)(?=\s*Bullish\s+Scenario:|Bearish\s+Scenario:|$)/i);
    let neutralSetup: TradingSetup | undefined;
    
    if (neutralSection && !neutralSection[1].toLowerCase().includes('no consolidation scenario')) {
      neutralSetup = {
        type: 'neutral',
        description: neutralSection[1].trim().split('\n')[0], // First line as description
        confidence: 70,
        timeframe,
      };
    }
    
    // Select the most appropriate trading setup based on trend direction
    let tradingSetup: TradingSetup | undefined;
    
    if (trendDirection === 'bullish' && bullishSetup) {
      tradingSetup = bullishSetup;
    } else if (trendDirection === 'bearish' && bearishSetup) {
      tradingSetup = bearishSetup;
    } else if (trendDirection === 'neutral' && neutralSetup) {
      tradingSetup = neutralSetup;
    } else if (bullishSetup) {
      tradingSetup = bullishSetup;
    } else if (bearishSetup) {
      tradingSetup = bearishSetup;
    } else if (neutralSetup) {
      tradingSetup = neutralSetup;
    }
    
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
      tradingInsight,
      date: new Date().toISOString().split('T')[0]
    };
  };
  
  // Helper functions for extraction
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
