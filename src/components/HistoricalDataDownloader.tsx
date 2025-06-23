import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import { CalendarIcon, Download, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  { value: 'M1', label: '1 Minute' },
  { value: 'M5', label: '5 Minutes' },
  { value: 'M15', label: '15 Minutes' },
  { value: 'M30', label: '30 Minutes' },
  { value: 'H1', label: '1 Hour' },
  { value: 'H4', label: '4 Hours' },
  { value: 'D1', label: '1 Day' },
];

// Define the maximum days for each timeframe for optimal performance
const TIMEFRAME_LIMITS = {
  'M1': 1,   // 1 day
  'M5': 4,   // 4 days
  'M15': 5,  // 5 days
  'M30': 6,  // 6 days
  'H1': 10,  // 10 days
  'H4': 25,  // 25 days
  'D1': 100, // 100 days
};

const formSchema = z.object({
  currencyPair: z.string().min(1, 'Please select a currency pair'),
  timeframe: z.string().min(1, 'Please select a timeframe'),
  fromDate: z.date({
    required_error: 'From date is required',
  }),
});

const HistoricalDataDownloader = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const today = new Date();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyPair: '',
      timeframe: '',
      fromDate: today, // Set default to today
    },
  });

  const selectedTimeframe = form.watch('timeframe');

  // Auto-set from date to today when timeframe changes
  useEffect(() => {
    if (selectedTimeframe) {
      form.setValue('fromDate', today);
    }
  }, [selectedTimeframe, form, today]);

  const getTimeframeLimitText = (timeframe: string) => {
    const days = TIMEFRAME_LIMITS[timeframe as keyof typeof TIMEFRAME_LIMITS];
    if (!days) return '';
    
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} year`;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('download-historical-data', {
        body: {
          currencyPair: values.currencyPair,
          timeframe: values.timeframe,
          fileFormat: 'txt',
          fromDate: format(values.fromDate, 'yyyy-MM-dd'),
          toDate: format(today, 'yyyy-MM-dd'),
        },
      });

      if (error) {
        throw error;
      }

      // Create blob and download file as TXT
      const blob = new Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${values.currencyPair}_${values.timeframe}_${format(values.fromDate, 'yyyy-MM-dd')}_${format(today, 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: 'Historical data has been downloaded successfully as TXT.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download historical data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">Download Historical Data</h3>
      <p className="text-gray-400 mb-6">
        Select parameters to download historical forex data from Dukascopy as TXT file
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
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {CURRENCY_PAIRS.map((pair) => (
                        <SelectItem 
                          key={pair.value} 
                          value={pair.value}
                          className="text-white hover:bg-gray-600"
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
                      <span>Using latest available data for optimal performance</span>
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
                  <span>{format(today, 'PPP')} (Latest)</span>
                  <CalendarIcon className="h-4 w-4 opacity-30" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Automatically set to today's date</p>
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

          <Button 
            type="submit" 
            disabled={isDownloading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating TXT...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download TXT
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default HistoricalDataDownloader;
