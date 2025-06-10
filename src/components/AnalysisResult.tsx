
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTradingPair } from '@/utils/tradingPairUtils';
import { TrendingUp, Target, TrendingDown, BarChart3, AlertTriangle } from 'lucide-react';

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
  // Format the trading pair using our utility
  const formattedPairName = formatTradingPair(data.pairName);

  // Parse the raw analysis to extract structured data
  const parseAnalysisData = (rawAnalysis: string) => {
    const lines = rawAnalysis.split('\n');
    const sections: { [key: string]: string[] } = {};
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('Current Price') || trimmed.includes('Market Status')) {
        currentSection = 'marketSnapshot';
        sections[currentSection] = sections[currentSection] || [];
      } else if (trimmed.includes('Price Level') || trimmed.includes('Support') || trimmed.includes('Resistance')) {
        currentSection = 'priceLevels';
        sections[currentSection] = sections[currentSection] || [];
      } else if (trimmed.includes('Candlestick') || trimmed.includes('Pattern')) {
        currentSection = 'patterns';
        sections[currentSection] = sections[currentSection] || [];
      } else if (trimmed.includes('Trend') || trimmed.includes('Direction')) {
        currentSection = 'trend';
        sections[currentSection] = sections[currentSection] || [];
      } else if (trimmed.includes('Trading') || trimmed.includes('Entry') || trimmed.includes('Stop') || trimmed.includes('Target')) {
        currentSection = 'trading';
        sections[currentSection] = sections[currentSection] || [];
      }
      
      if (currentSection && trimmed) {
        sections[currentSection].push(trimmed);
      }
    });
    
    return sections;
  };

  const analysisData = parseAnalysisData(data.marketAnalysis);
  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="w-full bg-chart-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="mr-3 bg-primary/20 p-2 rounded">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">📊 Technical Chart Analysis Report</div>
              <div className="text-lg text-primary font-semibold mt-1">
                {formattedPairName} – {data.timeframe || "M15"}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 text-white">
            
            {/* 1. Market Snapshot */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                1. Market Snapshot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Current Analysis Date:</p>
                  <p className="text-white font-medium">{currentDate}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Overall Sentiment:</p>
                  <p className="text-white font-medium capitalize">{data.overallSentiment}</p>
                </div>
              </div>
              {analysisData.marketSnapshot && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm mb-2">Market Context:</p>
                  <div className="space-y-1">
                    {analysisData.marketSnapshot.slice(0, 3).map((line, idx) => (
                      <p key={idx} className="text-white text-sm">{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Recent Price Action & Trend */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                2. Recent Price Action & Trend
              </h3>
              {analysisData.trend ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Market Structure:</p>
                    <div className="space-y-1">
                      {analysisData.trend.slice(0, 4).map((line, idx) => (
                        <p key={idx} className="text-white text-sm">• {line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white">Trend analysis based on chart price action and momentum.</p>
              )}
            </div>

            {/* 3. Key Support & Resistance Areas */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
                <Target className="mr-2 h-5 w-5" />
                3. Key Support & Resistance Areas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-green-400 font-semibold mb-2">Support Levels:</h4>
                  {analysisData.priceLevels ? (
                    <div className="space-y-1">
                      {analysisData.priceLevels
                        .filter(line => line.toLowerCase().includes('support'))
                        .slice(0, 2)
                        .map((line, idx) => (
                          <p key={idx} className="text-white text-sm">• {line}</p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-white text-sm">Support levels identified from chart analysis</p>
                  )}
                </div>
                <div>
                  <h4 className="text-red-400 font-semibold mb-2">Resistance Levels:</h4>
                  {analysisData.priceLevels ? (
                    <div className="space-y-1">
                      {analysisData.priceLevels
                        .filter(line => line.toLowerCase().includes('resistance'))
                        .slice(0, 2)
                        .map((line, idx) => (
                          <p key={idx} className="text-white text-sm">• {line}</p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-white text-sm">Resistance levels identified from chart analysis</p>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Candlestick & Pattern Analysis */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">4. Candlestick & Pattern Analysis</h3>
              {analysisData.patterns ? (
                <div className="space-y-2">
                  {analysisData.patterns.slice(0, 4).map((line, idx) => (
                    <p key={idx} className="text-white text-sm">• {line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-white text-sm">Pattern analysis based on visible chart formations and candlestick behavior.</p>
              )}
            </div>

            {/* 5. Trade Setups & Risk Management */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">5. Trade Setups & Risk Management</h3>
              
              {/* Trading Table */}
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left p-2 text-gray-400">Trade Type</th>
                      <th className="text-left p-2 text-gray-400">Entry Area</th>
                      <th className="text-left p-2 text-gray-400">Stop Loss</th>
                      <th className="text-left p-2 text-gray-400">Take Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700">
                      <td className="p-2 text-green-400 font-medium">Buy</td>
                      <td className="p-2 text-white">Support area confirmation</td>
                      <td className="p-2 text-white">Below key support</td>
                      <td className="p-2 text-white">Next resistance level</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-red-400 font-medium">Sell</td>
                      <td className="p-2 text-white">Resistance area rejection</td>
                      <td className="p-2 text-white">Above key resistance</td>
                      <td className="p-2 text-white">Next support level</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {analysisData.trading && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm mb-2">Trading Notes:</p>
                  <div className="space-y-1">
                    {analysisData.trading.slice(0, 3).map((line, idx) => (
                      <p key={idx} className="text-white text-sm">• {line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Summary & Recommendation */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                6. Summary & Trade Signal Recommendation
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-blue-400 font-medium mb-2">Market Summary:</p>
                  <p className="text-white text-sm">
                    Analysis based on {formattedPairName} {data.timeframe} timeframe showing {data.overallSentiment} sentiment.
                  </p>
                </div>
                <div>
                  <p className="text-blue-400 font-medium mb-2">Best Current Signal:</p>
                  <p className="text-white text-sm">
                    Wait for price confirmation at key support/resistance levels before entering trades. 
                    Use proper risk management with position sizing under 2% risk per trade.
                  </p>
                </div>
              </div>
            </div>

            {/* Full Analysis Details */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">📋 Detailed Analysis</h3>
              <div className="whitespace-pre-wrap text-white leading-relaxed text-sm">
                {data.marketAnalysis}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                <strong>⚠️ Disclaimer:</strong> This analysis is for educational and idea-generation purposes only. 
                Always do your own research and use proper risk management on every trade. 
                Past performance does not guarantee future results.
              </p>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
