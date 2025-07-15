
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import MultiTimeframeResults from './MultiTimeframeResults';

const CURRENCY_PAIRS = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'EURJPY', label: 'EUR/JPY' },
  { value: 'USDCAD', label: 'USD/CAD' },
  { value: 'AUDUSD', label: 'AUD/USD' },
  { value: 'XAUUSD', label: 'XAU/USD (Gold)' },
  { value: 'XAGUSD', label: 'XAG/USD (Silver)' },
  { value: 'AUDCAD', label: 'AUD/CAD' },
  { value: 'AUDCHF', label: 'AUD/CHF' },
  { value: 'AUDJPY', label: 'AUD/JPY' },
  { value: 'AUDNZD', label: 'AUD/NZD' },
  { value: 'CADCHF', label: 'CAD/CHF' },
  { value: 'CADJPY', label: 'CAD/JPY' },
  { value: 'CHFJPY', label: 'CHF/JPY' },
  { value: 'EURAUD', label: 'EUR/AUD' },
  { value: 'EURCAD', label: 'EUR/CAD' },
  { value: 'EURCHF', label: 'EUR/CHF' },
  { value: 'EURGBP', label: 'EUR/GBP' },
  { value: 'EURNZD', label: 'EUR/NZD' },
  { value: 'GBPAUD', label: 'GBP/AUD' },
  { value: 'GBPCAD', label: 'GBP/CAD' },
  { value: 'GBPCHF', label: 'GBP/CHF' },
  { value: 'GBPJPY', label: 'GBP/JPY' },
  { value: 'GBPNZD', label: 'GBP/NZD' },
  { value: 'NZDCAD', label: 'NZD/CAD' },
  { value: 'NZDCHF', label: 'NZD/CHF' },
  { value: 'NZDUSD', label: 'NZD/USD' },
  { value: 'USDCHF', label: 'USD/CHF' },
];

const formSchema = z.object({
  currencyPair: z.string().min(1, 'Please select a currency pair'),
});

interface DeepHistoricalAnalysisProps {
  onAnalysisComplete: (analysis: any) => void;
}

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

const DeepHistoricalAnalysis: React.FC<DeepHistoricalAnalysisProps> = ({ onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<TimeframeResult[]>([]);
  const [loadingTimeframes, setLoadingTimeframes] = useState<string[]>([]);
  const { toast } = useToast();
  const { usage, checkUsageLimits } = useSubscription();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyPair: '',
    },
  });

  const scrollToAnalysisResults = () => {
    setTimeout(() => {
      const analysisSection = document.querySelector('[data-analysis-results]');
      if (analysisSection) {
        analysisSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const fetchTimeframeAnalysis = async (symbol: string, timeframe: string): Promise<TimeframeResult> => {
    try {
      const response = await fetch('https://duka-aa28.onrender.com/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, timeframe }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        timeframe,
        trend: data.trend || 'Unknown',
        signal: data.signal || 'No Signal',
        entryPrice: data.entryPrice || 0,
        stopLoss: data.stopLoss || 0,
        takeProfit: data.takeProfit || 0,
        rsi: data.rsi || 0,
        atr: data.atr || 0,
      };
    } catch (error) {
      console.error(`Error fetching ${timeframe} analysis:`, error);
      return {
        timeframe,
        trend: 'Error',
        signal: 'Error',
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        rsi: 0,
        atr: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!usage?.can_deep_analyze) {
      toast({
        title: 'Deep Analysis Limit Reached',
        description: 'You have reached your deep analysis limit. Please upgrade your plan or wait for the next reset.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setResults([]);
    const timeframes = ['D1', 'H4', 'M15'];
    setLoadingTimeframes(timeframes);
    
    try {
      // Make parallel requests for all timeframes
      const analysisPromises = timeframes.map(async (timeframe) => {
        const result = await fetchTimeframeAnalysis(values.currencyPair, timeframe);
        
        // Update results as soon as data is available
        setResults(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(r => r.timeframe === timeframe);
          if (existingIndex >= 0) {
            updated[existingIndex] = result;
          } else {
            updated.push(result);
          }
          return updated.sort((a, b) => {
            const order = ['D1', 'H4', 'M15'];
            return order.indexOf(a.timeframe) - order.indexOf(b.timeframe);
          });
        });

        // Remove from loading list
        setLoadingTimeframes(prev => prev.filter(tf => tf !== timeframe));
        
        return result;
      });

      await Promise.all(analysisPromises);

      toast({
        title: 'Multi-Timeframe Analysis Complete',
        description: 'Deep analysis for 3 timeframes used 1 credit',
      });

      // Refresh usage data
      await checkUsageLimits();

      // Pass combined analysis to parent component
      onAnalysisComplete({
        type: 'multi_timeframe',
        symbol: values.currencyPair,
        timeframes: results,
        analysis: `Multi-timeframe analysis completed for ${values.currencyPair}`,
      });

      // Auto-scroll to results
      scrollToAnalysisResults();

    } catch (error) {
      console.error('Multi-timeframe analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze multi-timeframe data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setLoadingTimeframes([]);
    }
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-bold text-white mb-4">Deep Multi-Timeframe Analysis</h3>
        <p className="text-gray-400 mb-6">
          Comprehensive analysis across Daily, 4-Hour, and 15-Minute timeframes
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currencyPair"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Currency Pair</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select currency pair" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent 
                      className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto"
                      position="popper"
                      side="bottom"
                      align="start"
                      onWheel={(e) => e.stopPropagation()}
                      onPointerMove={(e) => e.preventDefault()}
                    >
                      {CURRENCY_PAIRS.map((pair) => (
                        <SelectItem 
                          key={pair.value} 
                          value={pair.value}
                          className="text-white hover:bg-gray-600 focus:bg-gray-600"
                        >
                          {pair.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col space-y-2">
              {usage && (
                <div className="text-sm text-gray-400">
                  Deep Analysis Usage: {usage.deep_analysis_daily_count || 0} / {usage.deep_analysis_daily_limit || 1} today
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={isAnalyzing || !usage?.can_deep_analyze}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing multiple timeframes (D1, H4, M15)...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Start Deep Analysis
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {(results.length > 0 || isAnalyzing) && (
        <MultiTimeframeResults 
          results={results}
          loadingTimeframes={loadingTimeframes}
          isAnalyzing={isAnalyzing}
        />
      )}
    </>
  );
};

export default DeepHistoricalAnalysis;
