import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SpinningRadar from './SpinningRadar';
import MultiTimeframeResults from './MultiTimeframeResults';
import TradingPairSelector from './TradingPairSelector';

interface TimeframeResult {
  timeframe: string;
  trend: string;
  signal: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rsi: number;
  atr: number;
  analysis: string;
  error?: string;
}

interface DeepHistoricalAnalysisProps {
  onAnalysisComplete: (analysis: any) => void;
}

const DeepHistoricalAnalysis: React.FC<DeepHistoricalAnalysisProps> = ({ onAnalysisComplete }) => {
  const [currencyPair, setCurrencyPair] = useState('XAUUSD');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Record<string, TimeframeResult> | null>(null);
  const [loadingTimeframes, setLoadingTimeframes] = useState<string[]>([]);
  const { toast } = useToast();

  const timeframes = ['M15', 'H1', 'H4', 'D1'];

  const startAnalysis = async () => {
    if (!currencyPair) {
      toast({
        title: "Please select a trading pair",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setLoadingTimeframes(['M15', 'H1', 'H4', 'D1']);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Please log in to access deep analysis",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      console.log('🚀 Starting Multi-Timeframe Analysis for:', currencyPair);
      console.log('📊 Requesting analysis for timeframes:', timeframes);

      // Use the new Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('polygon-analysis', {
        body: {
          symbol: currencyPair,
          timeframes: timeframes
        }
      });

      if (error) {
        console.error('❌ Supabase Function Error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      console.log('✅ Received analysis data:', data);

      if (!data.analysis) {
        throw new Error('Invalid response format: missing analysis data');
      }

      // Transform the data to match our interface
      const transformedResults = Object.entries(data.analysis).reduce((acc, [timeframe, analysis]: [string, any]) => {
        acc[timeframe] = {
          timeframe,
          trend: analysis.trend || 'Unknown',
          signal: analysis.signal || 'Hold',
          entryPrice: analysis.entryPrice || 0,
          stopLoss: analysis.stopLoss || 0,
          takeProfit: analysis.takeProfit || 0,
          rsi: analysis.rsi || 50,
          atr: analysis.atr || 0,
          analysis: analysis.analysis || 'No analysis available',
          error: analysis.error
        };
        return acc;
      }, {} as Record<string, TimeframeResult>);

      console.log('🔄 Transformed results:', transformedResults);
      setResults(transformedResults);
      
      // Call the callback with the complete analysis
      onAnalysisComplete({
        symbol: currencyPair,
        analysis: transformedResults,
        timestamp: new Date().toISOString(),
        type: 'multi_timeframe'
      });

      toast({
        title: "Multi-Timeframe Analysis Complete",
        description: `Analysis completed for ${currencyPair} across ${Object.keys(transformedResults).length} timeframes`,
      });

    } catch (error) {
      console.error('❌ Multi-timeframe analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setLoadingTimeframes([]);
    }
  };

  // Convert results object to array for the component
  const resultsArray = results ? Object.values(results) : [];

  return (
    <div className="w-full space-y-8">
      {/* Trading Pair Selection */}
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-75"></div>
            <div className="relative bg-gradient-to-r from-primary/30 to-accent/30 p-3 rounded-lg border border-primary/50 backdrop-blur-sm">
              <Brain className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Multi-Timeframe Analysis
            </h3>
            <p className="text-muted-foreground">
              Advanced AI analysis powered by Polygon.io & Gemini
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
          <TradingPairSelector
            value={`OANDA:${currencyPair}`}
            onChange={(value) => setCurrencyPair(value.replace('OANDA:', ''))}
          />
        </div>
      </div>

      {/* Analysis Button */}
      <Button
        onClick={startAnalysis}
        disabled={!currencyPair || isAnalyzing}
        className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold text-lg rounded-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
      >
        {isAnalyzing ? (
          <div className="flex items-center space-x-3">
            <SpinningRadar />
            <span>Analyzing Market Data...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6" />
            <span>Start Deep Analysis</span>
          </div>
        )}
      </Button>

      {/* Results */}
      {resultsArray.length > 0 && (
        <div className="animate-fade-in">
          <MultiTimeframeResults 
            results={resultsArray}
            loadingTimeframes={loadingTimeframes}
            isAnalyzing={isAnalyzing}
            currencyPair={currencyPair}
          />
        </div>
      )}
    </div>
  );
};

export default DeepHistoricalAnalysis;