import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
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

const FILE_FORMATS = [
  { value: 'csv', label: 'CSV File' },
  { value: 'txt', label: 'Text File' },
];

const formSchema = z.object({
  currencyPair: z.string().min(1, 'Please select a currency pair'),
  timeframe: z.string().min(1, 'Please select a timeframe'),
  fileFormat: z.string().min(1, 'Please select a file format'),
  fromDate: z.date({
    required_error: 'From date is required',
  }),
  toDate: z.date({
    required_error: 'To date is required',
  }),
}).refine((data) => data.toDate > data.fromDate, {
  message: 'To date must be after from date',
  path: ['toDate'],
}).refine((data) => {
  const diffTime = Math.abs(data.toDate.getTime() - data.fromDate.getTime());
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);
  return diffMonths <= 12;
}, {
  message: 'Date range cannot exceed 12 months',
  path: ['toDate'],
});

const HistoricalDataDownloader = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyPair: '',
      timeframe: '',
      fileFormat: 'csv',
    },
  });

  const selectedFormat = form.watch('fileFormat');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('download-historical-data', {
        body: {
          currencyPair: values.currencyPair,
          timeframe: values.timeframe,
          fileFormat: values.fileFormat,
          fromDate: format(values.fromDate, 'yyyy-MM-dd'),
          toDate: format(values.toDate, 'yyyy-MM-dd'),
        },
      });

      if (error) {
        throw error;
      }

      // Determine content type and file extension
      const contentType = values.fileFormat === 'csv' ? 'text/csv' : 'text/plain';
      const fileExtension = values.fileFormat === 'csv' ? 'csv' : 'txt';

      // Create blob and download file
      const blob = new Blob([data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${values.currencyPair}_${values.timeframe}_${format(values.fromDate, 'yyyy-MM-dd')}_${format(values.toDate, 'yyyy-MM-dd')}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: `Historical data has been downloaded successfully as ${values.fileFormat.toUpperCase()}.`,
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
        Select parameters to download historical forex data from Dukascopy
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fileFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">File Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select file format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {FILE_FORMATS.map((format) => (
                        <SelectItem 
                          key={format.value} 
                          value={format.value}
                          className="text-white hover:bg-gray-600"
                        >
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fromDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-white">From Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                            !field.value && "text-gray-400"
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick start date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-700 border-gray-600" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-white">To Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                            !field.value && "text-gray-400"
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick end date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-700 border-gray-600" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isDownloading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating {selectedFormat?.toUpperCase()}...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download {selectedFormat?.toUpperCase()}
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default HistoricalDataDownloader;
