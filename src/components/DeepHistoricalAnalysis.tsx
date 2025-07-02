import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays, subMonths } from 'date-fns';
import { CalendarIcon, Brain, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import ReasoningPopup from './ReasoningPopup';

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

const TIMEFRAMES = [
  { value: 'M15', label: '15 Minutes' },
  { value: 'M30', label: '30 Minutes' },
  { value: 'H1', label: '1 Hour' },
  { value: 'H4', label: '4 Hours' },
  { value: 'D1', label: '1 Day' },
  { value: 'W1', label: '1 Week' },
];

const TIMEFRAME_LIMITS = {
  'M15': 5,   // 5 days
  'M30': 10,  // 10 days
  'H1': 20,   // 20 days
  'H4': 80,   // 2 months and 20 days (approximately 80 days)
  'D1': 490,  // 1 year and 4 months (approximately 490 days)
  'W1': 3650, // 10 years (approximately 3650 days)
};

const formSchema = z.object({
  currencyPair: z.string().min(1, 'Please select a currency pair'),
  timeframe: z.string().min(1, 'Please select a timeframe'),
  fromDate: z.date({
    required_error: 'From date is required',
  }),
});

interface DeepHistoricalAnalysisProps {
  onAnalysisComplete: (analysis: any) => void;
}

const DeepHistoricalAnalysis: React.FC<DeepHistoricalAnalysisProps> = ({ onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReasoningPopup, setShowReasoningPopup] = useState(false);
  const { toast } = useToast();
  const { usage, checkUsageLimits } = useSubscription();
  const today = new Date();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyPair: '',
      timeframe: '',
      fromDate: today,
    },
  });

  const selectedTimeframe = form.watch('timeframe');

  // Auto-set from date based on timeframe limits
  useEffect(() => {
    if (selectedTimeframe && TIMEFRAME_LIMITS[selectedTimeframe as keyof typeof TIMEFRAME_LIMITS]) {
      const daysBack = TIMEFRAME_LIMITS[selectedTimeframe as keyof typeof TIMEFRAME_LIMITS];
      let fromDate;
      
      // For larger timeframes, use months for more accurate calculation
      if (selectedTimeframe === 'H4') {
        // 2 months and 20 days
        fromDate = subDays(subMonths(today, 2), 20);
      } else if (selectedTimeframe === 'D1') {
        // 1 year and 4 months
        fromDate = subMonths(today, 16);
      } else if (selectedTimeframe === 'W1') {
        // 10 years
        fromDate = subMonths(today, 120);
      } else {
        fromDate = subDays(today, daysBack);
      }
      
      form.setValue('fromDate', fromDate);
    }
  }, [selectedTimeframe, form, today]);

  const getTimeframeLimitText = (timeframe: string) => {
    switch (timeframe) {
      case 'M15':
        return '5 days';
      case 'M30':
        return '10 days';
      case 'H1':
        return '20 days';
      case 'H4':
        return '2 months and 20 days';
      case 'D1':
        return '1 year and 4 months';
      case 'W1':
        return '10 years';
      default:
        return '';
    }
  };

  const scrollToAnalysisResults = () => {
    // Wait a bit for the results to render, then scroll
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
    setShowReasoningPopup(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('deep-historical-analysis', {
        body: {
          currencyPair: values.currencyPair,
          timeframe: values.timeframe,
          fromDate: format(values.fromDate, 'yyyy-MM-dd'),
          toDate: format(today, 'yyyy-MM-dd'),
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Deep Analysis Complete',
        description: 'Historical data has been analyzed successfully.',
      });

      // Refresh usage data
      await checkUsageLimits();

      // Pass the analysis to parent component
      onAnalysisComplete(data.analysis);

      // Auto-scroll to results
      scrollToAnalysisResults();

    } catch (error) {
      console.error('Deep analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze historical data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setShowReasoningPopup(false);
    }
  };

  const currentFromDate = form.watch('fromDate');

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-bold text-white mb-4">Deep Historical Analysis</h3>
        <p className="text-gray-400 mb-6">
          Comprehensive technical analysis of historical forex data with trading recommendations
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <FormField
                control={form.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Timeframe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {TIMEFRAMES.map((tf) => (
                          <SelectItem 
                            key={tf.value} 
                            value={tf.value}
                            className="text-white hover:bg-gray-600"
                          >
                            {tf.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTimeframe && (
                      <div className="flex items-center mt-2 text-sm text-blue-400">
                        <Info className="w-4 h-4 mr-1" />
                        <span>Data range limited to {getTimeframeLimitText(selectedTimeframe)} for optimal performance</span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <FormLabel className="text-white mb-2">From Date</FormLabel>
                <div className="w-full pl-3 pr-3 py-2 text-left font-normal bg-gray-600 border border-gray-500 text-gray-300 rounded-md cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <span>
                      {currentFromDate ? format(currentFromDate, 'PPP') : 'Select timeframe first'}
                      {selectedTimeframe && ' (Auto-set)'}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-30" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedTimeframe 
                    ? `Automatically set based on ${getTimeframeLimitText(selectedTimeframe)} limit`
                    : 'Will be set automatically when you select a timeframe'
                  }
                </p>
              </div>

              <div className="flex flex-col">
                <FormLabel className="text-white mb-2">To Date</FormLabel>
                <div className="w-full pl-3 pr-3 py-2 text-left font-normal bg-gray-600 border border-gray-500 text-gray-300 rounded-md cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <span>{format(today, 'PPP')} (Latest)</span>
                    <CalendarIcon className="h-4 w-4 opacity-30" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Automatically set to today's date</p>
              </div>
            </div>

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
                    Analyzing Data...
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
      
      <ReasoningPopup isOpen={showReasoningPopup} />
    </>
  );
};

export default DeepHistoricalAnalysis;
