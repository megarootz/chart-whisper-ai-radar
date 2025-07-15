import React, { useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Minus, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RiskManagementCalculator from './RiskManagementCalculator';

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
  currencyPair?: string;
}

const MultiTimeframeResults: React.FC<MultiTimeframeResultsProps> = ({
  results,
  loadingTimeframes,
  isAnalyzing,
  currencyPair = 'XAUUSD'
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('D1');
  const timeframes = ['D1', 'H4', 'H1', 'M15'];
  const timeframeLabels = {
    'D1': 'Daily',
    'H4': '4 Hours',
    'H1': '1 Hour',
    'M15': '15 Minutes'
  };

  const getTrendColor = (trend: string) => {
    const trendLower = trend.toLowerCase();
    if (trendLower.includes('up') || trendLower.includes('bullish')) return 'text-green-400 bg-green-400/10';
    if (trendLower.includes('down') || trendLower.includes('bearish')) return 'text-red-400 bg-red-400/10';
    return 'text-gray-400 bg-gray-400/10';
  };

  const getTrendIcon = (trend: string) => {
    const trendLower = trend.toLowerCase();
    if (trendLower.includes('up') || trendLower.includes('bullish')) return <TrendingUp className="w-4 h-4" />;
    if (trendLower.includes('down') || trendLower.includes('bearish')) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getSignalStyle = (signal: string) => {
    const signalLower = signal.toLowerCase();
    if (signalLower.includes('buy')) return 'bg-green-600 text-white border-green-500';
    if (signalLower.includes('sell')) return 'bg-red-600 text-white border-red-500';
    return 'bg-gray-600 text-gray-300 border-gray-500';
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'N/A';
    return price.toFixed(5);
  };

  const formatIndicator = (value: number) => {
    if (value === 0) return 'N/A';
    return value.toFixed(2);
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi === 0) return { status: 'N/A', color: 'text-gray-400' };
    if (rsi < 30) return { status: 'Oversold', color: 'text-green-400' };
    if (rsi > 70) return { status: 'Overbought', color: 'text-red-400' };
    return { status: 'Normal', color: 'text-blue-400' };
  };

  const selectedResult = results.find(r => r.timeframe === selectedTimeframe);
  const hasValidData = selectedResult && selectedResult.entryPrice > 0 && selectedResult.stopLoss > 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Timeframe Results */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" data-analysis-results>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="bg-purple-600/20 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            Multi-Timeframe Analysis Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeframes.map((timeframe) => {
              const result = results.find(r => r.timeframe === timeframe);
              const isLoading = loadingTimeframes.includes(timeframe);
              const rsiStatus = result ? getRSIStatus(result.rsi) : null;
              const isSelected = timeframe === selectedTimeframe;
              
              return (
                <div 
                  key={timeframe} 
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`
                    timeframe-card bg-gray-700 rounded-lg p-4 border transition-all duration-300 
                    hover:transform hover:-translate-y-1 hover:shadow-lg cursor-pointer
                    ${isLoading ? 'animate-pulse' : ''}
                    ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-600 hover:border-purple-500/50'}
                    ${result && !result.error ? 'hover:shadow-purple-500/20' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">
                      {timeframeLabels[timeframe as keyof typeof timeframeLabels]}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded">
                        {timeframe}
                      </span>
                      {isSelected && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                        <span className="text-gray-400 text-sm">Analyzing...</span>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="space-y-4">
                      {result.error ? (
                        <div className="error text-center py-8">
                          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <div className="text-red-400 text-sm font-medium">
                            {result.error.includes('Insufficient') 
                              ? `⚠️ ${result.error}` 
                              : `❌ Analysis failed: ${result.error}`
                            }
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Trend */}
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">Trend:</span>
                            <div className={`
                              flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
                              ${getTrendColor(result.trend)}
                            `}>
                              {getTrendIcon(result.trend)}
                              <span>{result.trend}</span>
                            </div>
                          </div>

                          {/* Signal */}
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">Signal:</span>
                            <span className={`
                              px-3 py-1 rounded-full text-sm font-bold border-2
                              ${getSignalStyle(result.signal)}
                            `}>
                              {result.signal}
                            </span>
                          </div>

                          {/* Price Metrics */}
                          <div className="space-y-2 pt-2 border-t border-gray-600">
                            <div className="metric flex items-center justify-between py-1">
                              <span className="text-gray-300 text-sm">Entry:</span>
                              <span className="text-white text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                                {formatPrice(result.entryPrice)}
                              </span>
                            </div>

                            <div className="metric flex items-center justify-between py-1">
                              <span className="text-gray-300 text-sm">Stop Loss:</span>
                              <span className="text-red-400 text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                                {formatPrice(result.stopLoss)}
                              </span>
                            </div>

                            <div className="metric flex items-center justify-between py-1">
                              <span className="text-gray-300 text-sm">Take Profit:</span>
                              <span className="text-green-400 text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                                {formatPrice(result.takeProfit)}
                              </span>
                            </div>
                          </div>

                          {/* Technical Indicators */}
                          <div className="space-y-2 pt-2 border-t border-gray-600">
                            <div className="metric flex items-center justify-between py-1">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-300 text-sm">RSI:</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 text-gray-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Relative Strength Index</p>
                                    <p>30 = Oversold, 70 = Overbought</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-mono ${rsiStatus?.color}`}>
                                  {formatIndicator(result.rsi)}
                                </span>
                                {result.rsi > 0 && (
                                  <span className={`text-xs px-1 py-0.5 rounded ${rsiStatus?.color} opacity-70`}>
                                    {rsiStatus?.status}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="metric flex items-center justify-between py-1">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-300 text-sm">ATR:</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 text-gray-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Average True Range</p>
                                    <p>Measures market volatility</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <span className="text-yellow-400 text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                                {formatIndicator(result.atr)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-12">
                      <div className="text-gray-600 text-sm">
                        Waiting for analysis...
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isAnalyzing && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-400 bg-gray-700/50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                Loading optimization: Results appear as soon as data is available for each timeframe
              </div>
            </div>
          )}
        </div>

        {/* Risk Management Calculator */}
        {hasValidData && (
          <div className="animate-fade-in">
            <RiskManagementCalculator
              entryPrice={selectedResult!.entryPrice}
              stopLoss={selectedResult!.stopLoss}
              currency={currencyPair}
              onCalculate={(positionSize) => {
                console.log(`Calculated position size for ${selectedTimeframe}:`, positionSize);
              }}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default MultiTimeframeResults;
