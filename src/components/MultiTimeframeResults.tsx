
import React from 'react';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

interface MultiTimeframeResultsProps {
  results: TimeframeResult[];
  loadingTimeframes: string[];
  isAnalyzing: boolean;
}

const MultiTimeframeResults: React.FC<MultiTimeframeResultsProps> = ({
  results,
  loadingTimeframes,
  isAnalyzing
}) => {
  const timeframes = ['D1', 'H4', 'M15'];
  const timeframeLabels = {
    'D1': 'Daily',
    'H4': '4 Hours',
    'M15': '15 Minutes'
  };

  const getTrendColor = (trend: string) => {
    const trendLower = trend.toLowerCase();
    if (trendLower.includes('up') || trendLower.includes('bullish')) return 'text-green-400';
    if (trendLower.includes('down') || trendLower.includes('bearish')) return 'text-red-400';
    return 'text-gray-400';
  };

  const getTrendIcon = (trend: string) => {
    const trendLower = trend.toLowerCase();
    if (trendLower.includes('up') || trendLower.includes('bullish')) return <TrendingUp className="w-4 h-4" />;
    if (trendLower.includes('down') || trendLower.includes('bearish')) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getSignalStyle = (signal: string) => {
    const signalLower = signal.toLowerCase();
    if (signalLower.includes('buy')) return 'bg-green-600 text-white';
    if (signalLower.includes('sell')) return 'bg-red-600 text-white';
    return 'bg-gray-600 text-gray-300';
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'N/A';
    return price.toFixed(5);
  };

  const formatIndicator = (value: number) => {
    if (value === 0) return 'N/A';
    return value.toFixed(2);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" data-analysis-results>
      <h3 className="text-xl font-bold text-white mb-6">Multi-Timeframe Analysis Results</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {timeframes.map((timeframe) => {
          const result = results.find(r => r.timeframe === timeframe);
          const isLoading = loadingTimeframes.includes(timeframe);
          
          return (
            <div key={timeframe} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  {timeframeLabels[timeframe as keyof typeof timeframeLabels]}
                </h4>
                <span className="text-sm text-gray-400 font-mono">{timeframe}</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  <span className="ml-2 text-gray-400">Analyzing...</span>
                </div>
              ) : result ? (
                <div className="space-y-3">
                  {result.error ? (
                    <div className="text-red-400 text-sm">
                      Analysis failed: {result.error}
                    </div>
                  ) : (
                    <>
                      {/* Trend */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Trend:</span>
                        <div className={`flex items-center space-x-1 ${getTrendColor(result.trend)}`}>
                          {getTrendIcon(result.trend)}
                          <span className="text-sm font-medium">{result.trend}</span>
                        </div>
                      </div>

                      {/* Signal */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Signal:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSignalStyle(result.signal)}`}>
                          {result.signal}
                        </span>
                      </div>

                      {/* Entry Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Entry:</span>
                        <span className="text-white text-sm font-mono">{formatPrice(result.entryPrice)}</span>
                      </div>

                      {/* Stop Loss */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Stop Loss:</span>
                        <span className="text-red-400 text-sm font-mono">{formatPrice(result.stopLoss)}</span>
                      </div>

                      {/* Take Profit */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Take Profit:</span>
                        <span className="text-green-400 text-sm font-mono">{formatPrice(result.takeProfit)}</span>
                      </div>

                      {/* Divider */}
                      <hr className="border-gray-600" />

                      {/* RSI */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">RSI:</span>
                        <span className="text-blue-400 text-sm font-mono">{formatIndicator(result.rsi)}</span>
                      </div>

                      {/* ATR */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">ATR:</span>
                        <span className="text-yellow-400 text-sm font-mono">{formatIndicator(result.atr)}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Waiting for analysis...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAnalyzing && (
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-400">
            Loading optimization: Results appear as soon as data is available for each timeframe
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiTimeframeResults;
