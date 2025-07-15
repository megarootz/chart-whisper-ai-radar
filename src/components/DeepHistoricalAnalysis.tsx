
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Loader2, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import MultiTimeframeResults from './MultiTimeframeResults';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [lastAnalyzedPair, setLastAnalyzedPair] = useState<string>('');
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

  const fetchAnalysisFromRender = async (symbol: string): Promise<any> => {
    try {
      console.log(`Fetching analysis for ${symbol} from Render API`);
      
      const response = await fetch('https://duka-aa28.onrender.com/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received analysis data:', data);

      if (!data || !data.analysis) {
        throw new Error('No analysis data received');
      }

      return data.analysis;
    } catch (error) {
      console.error('Error fetching analysis from Render:', error);
      throw error;
    }
  };

  const parseAnalysisResults = (analysisData: any): TimeframeResult[] => {
    const timeframes = ['D1', 'H4', 'M15'];
    
    return timeframes.map(timeframe => {
      const tfData = analysisData[timeframe];
      
      if (!tfData) {
        return {
          timeframe,
          trend: 'Unknown',
          signal: 'No Signal',
          entryPrice: 0,
          stopLoss: 0,
          takeProfit: 0,
          rsi: 0,
          atr: 0,
          error: 'No data available for this timeframe',
        };
      }

      if (tfData.error) {
        return {
          timeframe,
          trend: 'Error',
          signal: 'Error',
          entryPrice: 0,
          stopLoss: 0,
          takeProfit: 0,
          rsi: 0,
          atr: 0,
          error: tfData.error,
        };
      }

      return {
        timeframe,
        trend: tfData.trend || 'Unknown',
        signal: tfData.signal || 'No Signal',
        entryPrice: parseFloat(tfData.entry) || 0,
        stopLoss: parseFloat(tfData.stop_loss) || 0,
        takeProfit: parseFloat(tfData.take_profit) || 0,
        rsi: parseFloat(tfData.rsi) || 0,
        atr: parseFloat(tfData.atr) || 0,
      };
    });
  };

  const refreshAnalysis = async () => {
    if (!lastAnalyzedPair) {
      toast({
        title: 'No Previous Analysis',
        description: 'Please select a currency pair and run analysis first.',
        variant: 'destructive',
      });
      return;
    }

    await startAnalysis(lastAnalyzedPair);
  };

  const startAnalysis = async (currencyPair: string) => {
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
    setLastAnalyzedPair(currencyPair);
    const timeframes = ['D1', 'H4', 'M15'];
    setLoadingTimeframes(timeframes);
    
    try {
      // Fetch analysis from Render API
      const analysisData = await fetchAnalysisFromRender(currencyPair);
      
      // Parse the results
      const parsedResults = parseAnalysisResults(analysisData);
      setResults(parsedResults);

      toast({
        title: 'Multi-Timeframe Analysis Complete',
        description: `Deep analysis for 3 timeframes used 1 credit`,
      });

      // Refresh usage data
      await checkUsageLimits();

      // Pass combined analysis to parent component
      onAnalysisComplete({
        type: 'multi_timeframe',
        symbol: currencyPair,
        timeframes: parsedResults,
        analysis: `Multi-timeframe analysis completed for ${currencyPair}`,
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await startAnalysis(values.currencyPair);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Analysis Form */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-600/20 p-2 rounded-full">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Deep Multi-Timeframe Analysis</h3>
              <p className="text-gray-400 text-sm">
                Comprehensive analysis across Daily, 4-Hour, and 15-Minute timeframes
              </p>
            </div>
          </div>

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

              <div className="flex flex-col space-y-4">
                {usage && (
                  <div className="text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Each analysis covers 3 timeframes (D1, H4, M15) for 1 credit</p>
                        </TooltipContent>
                      </Tooltip>
                      Deep Analysis Usage: {usage.deep_analysis_daily_count || 0} / {usage.deep_analysis_daily_limit || 1} today
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={isAnalyzing || !usage?.can_deep_analyze}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all duration-200 hover:scale-105"
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

                  {lastAnalyzedPair && !isAnalyzing && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={refreshAnalysis}
                          className="border-gray-600 hover:bg-gray-700"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh analysis for {lastAnalyzedPair}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* Results Display */}
        {(results.length > 0 || isAnalyzing) && (
          <div className="animate-fade-in">
            <MultiTimeframeResults 
              results={results}
              loadingTimeframes={loadingTimeframes}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DeepHistoricalAnalysis;
