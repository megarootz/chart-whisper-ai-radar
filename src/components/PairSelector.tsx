
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, Zap, Globe } from 'lucide-react';

interface PairSelectorProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const POPULAR_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
  'XAU/USD', 'BTC/USD', 'ETH/USD'
];

const PairSelector = ({
  selectedPair,
  onPairChange,
  onAnalyze,
  isAnalyzing
}: PairSelectorProps) => {
  const [inputValue, setInputValue] = useState(selectedPair);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputValue(value);
    onPairChange(value);
  };

  const handlePopularPairClick = (pair: string) => {
    setInputValue(pair);
    onPairChange(pair);
  };

  const handleAnalyze = () => {
    if (inputValue.trim()) {
      onAnalyze();
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
          <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
          <span>Real-Time Forex Analysis</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Currency Pair Input */}
        <div className="space-y-3">
          <Label htmlFor="currency-pair" className="text-white font-medium">
            Enter Currency Pair
          </Label>
          <Input
            id="currency-pair"
            type="text"
            placeholder="e.g., EUR/USD, GBP/JPY, BTC/USD"
            value={inputValue}
            onChange={handleInputChange}
            className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 transition-colors text-base md:text-sm h-11 md:h-10"
          />
        </div>

        {/* Popular Pairs */}
        <div className="space-y-3">
          <Label className="text-slate-300 text-sm">Popular Pairs</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {POPULAR_PAIRS.map((pair) => (
              <Button
                key={pair}
                variant="outline"
                size="sm"
                onClick={() => handlePopularPairClick(pair)}
                className="bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-blue-600/20 hover:border-blue-500 hover:text-white transition-all text-xs h-8"
              >
                {pair}
              </Button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-700/50 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-blue-400" />
              <h4 className="text-blue-300 font-medium">Live Market Intelligence</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Real-time price feeds & market data</span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Advanced technical analysis</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Automated workflow processing</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">Instant analysis results</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analyze Button */}
        <Button 
          onClick={handleAnalyze}
          disabled={!inputValue.trim() || isAnalyzing}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium h-12 text-base transition-all transform hover:scale-[1.02] disabled:transform-none"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing Analysis...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analyze Pair
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PairSelector;
