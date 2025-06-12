
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTradingPair } from '@/utils/tradingPairUtils';
import { TrendingUp, BarChart3, AlertTriangle, DollarSign, Clock, Target, TrendingDown } from 'lucide-react';

export interface MarketFactor {
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface ChartPattern {
  name: string;
  confidence: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  status?: 'complete' | 'forming';
}

export interface PriceLevel {
  name: string;
  price: string;
  distance?: string;
  direction?: 'up' | 'down';
}

export interface TradingSetup {
  type: 'long' | 'short' | 'neutral';
  description: string;
  confidence: number;
  timeframe: string;
  entryPrice?: string;
  stopLoss?: string;
  takeProfits?: string[];
  riskRewardRatio?: string;
  entryTrigger?: string;
}

export interface AnalysisResultData {
  pairName: string;
  timeframe: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral' | 'mildly bullish' | 'mildly bearish';
  confidenceScore: number;
  marketAnalysis: string;
  trendDirection: 'bullish' | 'bearish' | 'neutral';
  marketFactors: MarketFactor[];
  chartPatterns: ChartPattern[];
  priceLevels: PriceLevel[];
  entryLevel?: string;
  stopLoss?: string;
  takeProfits?: string[];
  tradingInsight?: string;
  tradingSetup?: TradingSetup;
  timestamp?: string;
  date?: string;
}

const AnalysisResult = ({ data }: { data: AnalysisResultData }) => {
  // Extract trading pair and timeframe from the AI analysis text
  const extractTradingInfo = (analysisText: string) => {
    // Look for patterns like "Technical Chart Analysis Report (GOLD/USD - 1 Hour)" or "Gold Spot / U.S. Dollar - 1 Hour"
    const titleMatch = analysisText.match(/Technical Chart Analysis Report.*?\((.*?)\)/i) ||
                      analysisText.match(/📊\s*Technical Chart Analysis Report.*?\((.*?)\)/i);
    
    if (titleMatch) {
      const titleContent = titleMatch[1];
      // Extract pair and timeframe
      const parts = titleContent.split(/\s*[–-]\s*/);
      if (parts.length >= 2) {
        return {
          pair: parts[0].trim(),
          timeframe: parts[1].trim()
        };
      } else {
        return {
          pair: titleContent.trim(),
          timeframe: 'Unknown Timeframe'
        };
      }
    }

    // Fallback: look for other patterns
    const pairMatch = analysisText.match(/(?:Gold|XAU|EUR|USD|GBP|JPY|CHF|CAD|AUD|NZD|BTC|ETH)[\/\s]*(?:USD|EUR|JPY|GBP|CHF|CAD|AUD|NZD|USDT)/gi);
    const timeframeMatch = analysisText.match(/(?:1|4|15|30)\s*(?:Hour|Minute|Min|H|M)|Daily|Weekly|Monthly/gi);
    
    return {
      pair: pairMatch ? pairMatch[0] : 'Unknown Pair',
      timeframe: timeframeMatch ? timeframeMatch[0] : 'Unknown Timeframe'
    };
  };

  const { pair, timeframe } = extractTradingInfo(data.marketAnalysis);
  const formattedPair = formatTradingPair(pair);

  // Extract current price from analysis
  const extractCurrentPrice = (analysisText: string) => {
    const priceMatch = analysisText.match(/Current Price[:\s]*([0-9,]+\.?[0-9]*)/i);
    return priceMatch ? priceMatch[1] : null;
  };

  const currentPrice = extractCurrentPrice(data.marketAnalysis);

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    if (sentiment.toLowerCase().includes('bullish')) return 'text-green-400';
    if (sentiment.toLowerCase().includes('bearish')) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment.toLowerCase().includes('bullish')) return <TrendingUp className="h-4 w-4" />;
    if (sentiment.toLowerCase().includes('bearish')) return <TrendingDown className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 bg-primary/20 p-3 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">Analysis Complete</div>
                  <div className="text-lg text-gray-300">Professional Chart Analysis for {formattedPair}</div>
                  <div className="text-sm text-gray-400 mt-1">{timeframe}</div>
                </div>
              </div>
              {currentPrice && (
                <div className="text-right">
                  <div className="flex items-center text-white mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="text-xl font-bold">{currentPrice}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Current Price</span>
                  </div>
                </div>
              )}
            </div>
          </CardTitle>
          
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Market Sentiment</p>
                  <p className={`font-semibold ${getSentimentColor(data.overallSentiment || 'neutral')}`}>
                    {data.overallSentiment || 'Neutral'}
                  </p>
                </div>
                <div className={getSentimentColor(data.overallSentiment || 'neutral')}>
                  {getSentimentIcon(data.overallSentiment || 'neutral')}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Confidence Score</p>
                  <p className="text-white font-semibold">{data.confidenceScore || 75}%</p>
                </div>
                <Target className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Analysis Type</p>
                  <p className="text-white font-semibold">Technical Analysis</p>
                </div>
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            
            {/* Main Analysis Content */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Detailed Analysis Report
                </h3>
                <div className="h-px bg-gradient-to-r from-primary to-transparent"></div>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-100 leading-relaxed text-sm md:text-base">
                  {data.marketAnalysis}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/50 rounded-xl p-6">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-2">
                    ⚠️ Important Disclaimer
                  </h4>
                  <p className="text-yellow-200 text-sm leading-relaxed">
                    <em>This analysis is for educational and idea-generation purposes only. Trading involves substantial risk and is not suitable for all investors. Always conduct your own research, use proper risk management, and never risk more than you can afford to lose. Past performance does not guarantee future results.</em>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
