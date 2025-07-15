

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MultiTimeframeResults from './MultiTimeframeResults';

interface TimeframeResult {
  timeframe: string;
  trend: string;
  signal: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rsi: number;
  atr: number;
  error?: string;
}

interface DeepHistoricalAnalysisProps {
  onAnalysisComplete: (analysis: any) => void;
}

const DeepHistoricalAnalysis: React.FC<DeepHistoricalAnalysisProps> = ({ onAnalysisComplete }) => {
  const [currencyPair, setCurrencyPair] = useState('XAUUSD');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<TimeframeResult[]>([]);
  const [loadingTimeframes, setLoadingTimeframes] = useState<string[]>([]);
  const { toast } = useToast();

  const currencyPairs = [
    'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURJPY', 'GBPJPY', 'EURGBP', 'EURCHF', 'GBPCHF', 'AUDJPY', 'CADJPY', 'CHFJPY'
  ];

  // Updated to include all 4 timeframes: D1, H4, H1, M15
  const timeframes = ['D1', 'H4', 'H1', 'M15'];

  const startAnalysis = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use the analysis feature.",
          variant: "destructive",
        });
        return;
      }

      setIsAnalyzing(true);
      setResults([]);
      setLoadingTimeframes([...timeframes]);

      console.log('🚀 Starting Multi-Timeframe Analysis for:', currencyPair);
      console.log('📊 Requesting analysis for timeframes:', timeframes);

      // Call your Render API
      const renderApiUrl = 'https://duka-aa28.onrender.com/analysis';
      
      console.log('📡 Calling Render API:', renderApiUrl);
      
      const response = await fetch(renderApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          symbol: currencyPair,
          timeframes: timeframes // Explicitly pass all timeframes including M15
        })
      });

      console.log('📊 Render API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Render API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const apiData = await response.json();
      console.log('✅ Render API Data Received:', apiData);

      // Process the analysis data from your Render API
      const processedResults: TimeframeResult[] = timeframes.map(tf => {
        const analysisData = apiData?.analysis?.[tf];
        
        if (!analysisData) {
          console.warn(`⚠️ No analysis data for ${tf}. Available timeframes:`, Object.keys(apiData?.analysis || {}));
          return {
            timeframe: tf,
            trend: 'Unknown',
            signal: 'No Signal',
            entryPrice: 0,
            stopLoss: 0,
            takeProfit: 0,
            rsi: 0,
            atr: 0,
            error: `No analysis data available for ${tf}`
          };
        }

        console.log(`📈 Processing ${tf} data:`, analysisData);

        // Map your API response to the expected format
        return {
          timeframe: tf,
          trend: analysisData.trend || 'Unknown',
          signal: analysisData.signal || 'No Signal',
          entryPrice: Number(analysisData.entry) || 0,
          stopLoss: Number(analysisData.sl) || 0,
          takeProfit: Number(analysisData.tp) || 0,
          rsi: Number(analysisData.rsi) || 0,
          atr: Number(analysisData.atr) || 0
        };
      });

      setResults(processedResults);
      setLoadingTimeframes([]);

      // Call the callback with the processed results
      onAnalysisComplete({
        type: 'multi_timeframe',
        symbol: currencyPair,
        results: processedResults,
        timestamp: new Date().toISOString()
      });

      // Show success toast
      toast({
        title: "Analysis Complete",
        description: `Multi-timeframe analysis completed for ${currencyPair}`,
      });

      console.log('🎉 Analysis completed successfully:', processedResults);

    } catch (error) {
      console.error('❌ Analysis Error:', error);
      
      // Set error results for all timeframes
      const errorResults: TimeframeResult[] = timeframes.map(tf => ({
        timeframe: tf,
        trend: 'Error',
        signal: 'Error',
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        rsi: 0,
        atr: 0,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));

      setResults(errorResults);
      setLoadingTimeframes([]);

      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <div className="bg-purple-600/20 p-2 rounded-full">
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            Deep Multi-Timeframe Analysis
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comprehensive analysis across Daily, 4-Hour, 1-Hour, and 15-Minute timeframes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currency Pair
            </label>
            <Select value={currencyPair} onValueChange={setCurrencyPair}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select currency pair" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {currencyPairs.map((pair) => (
                  <SelectItem 
                    key={pair} 
                    value={pair}
                    className="text-white hover:bg-gray-600"
                  >
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Deep Analysis Usage: 1 / 15 today</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Start Deep Analysis
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {(results.length > 0 || isAnalyzing) && (
        <MultiTimeframeResults
          results={results}
          loadingTimeframes={loadingTimeframes}
          isAnalyzing={isAnalyzing}
          currencyPair={currencyPair}
        />
      )}
    </div>
  );
};

export default DeepHistoricalAnalysis;
