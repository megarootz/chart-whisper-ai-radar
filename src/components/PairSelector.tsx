
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TrendingUp, Clock } from 'lucide-react';

const CURRENCY_PAIRS = [
  { value: 'EUR/USD', label: 'EUR/USD - Euro vs US Dollar' },
  { value: 'GBP/USD', label: 'GBP/USD - British Pound vs US Dollar' },
  { value: 'USD/JPY', label: 'USD/JPY - US Dollar vs Japanese Yen' },
  { value: 'USD/CHF', label: 'USD/CHF - US Dollar vs Swiss Franc' },
  { value: 'AUD/USD', label: 'AUD/USD - Australian Dollar vs US Dollar' },
  { value: 'USD/CAD', label: 'USD/CAD - US Dollar vs Canadian Dollar' },
  { value: 'NZD/USD', label: 'NZD/USD - New Zealand Dollar vs US Dollar' },
  { value: 'EUR/GBP', label: 'EUR/GBP - Euro vs British Pound' },
  { value: 'EUR/JPY', label: 'EUR/JPY - Euro vs Japanese Yen' },
  { value: 'GBP/JPY', label: 'GBP/JPY - British Pound vs Japanese Yen' },
  { value: 'XAU/USD', label: 'XAU/USD - Gold vs US Dollar' },
  { value: 'XAG/USD', label: 'XAG/USD - Silver vs US Dollar' },
  { value: 'BTC/USD', label: 'BTC/USD - Bitcoin vs US Dollar' },
  { value: 'ETH/USD', label: 'ETH/USD - Ethereum vs US Dollar' },
];

const TIMEFRAMES = [
  { value: '1H', label: '1 Hour' },
  { value: '4H', label: '4 Hours' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
];

interface PairSelectorProps {
  selectedPair: string;
  selectedTimeframe: string;
  onPairChange: (pair: string) => void;
  onTimeframeChange: (timeframe: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const PairSelector = ({
  selectedPair,
  selectedTimeframe,
  onPairChange,
  onTimeframeChange,
  onAnalyze,
  isAnalyzing
}: PairSelectorProps) => {
  return (
    <Card className="w-full bg-chart-card border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Forex Pair Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency-pair" className="text-white">Currency Pair</Label>
            <Select value={selectedPair} onValueChange={onPairChange}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select a currency pair" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {CURRENCY_PAIRS.map((pair) => (
                  <SelectItem key={pair.value} value={pair.value} className="text-white hover:bg-gray-700">
                    {pair.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeframe" className="text-white">Timeframe</Label>
            <Select value={selectedTimeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value} className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {tf.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-blue-400 font-medium mb-2">AI-Powered Real-Time Analysis</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Current live prices and market sentiment</li>
                <li>• Technical indicators and chart patterns</li>
                <li>• Fundamental analysis with latest economic news</li>
                <li>• Precise entry/exit points with risk management</li>
              </ul>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={onAnalyze}
          disabled={!selectedPair || !selectedTimeframe || isAnalyzing}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          {isAnalyzing ? 'Analyzing Market Data...' : 'Analyze Pair'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PairSelector;
