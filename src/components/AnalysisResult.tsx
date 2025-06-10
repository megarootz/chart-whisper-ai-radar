
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTradingPair } from '@/utils/tradingPairUtils';
import { TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';

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
  const currentDate = new Date().toLocaleDateString();

  // Parse the raw analysis to extract structured data
  const parseAnalysisData = (rawAnalysis: string) => {
    const lines = rawAnalysis.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const sections: { [key: string]: string[] } = {};
    let currentSection = '';
    
    lines.forEach(line => {
      const lower = line.toLowerCase();
      
      if (lower.includes('current price') || lower.includes('market status') || lower.includes('market snapshot')) {
        currentSection = 'marketSnapshot';
      } else if (lower.includes('recent movement') || lower.includes('recent price') || lower.includes('price action')) {
        currentSection = 'recentMovement';
      } else if (lower.includes('market structure') || lower.includes('trend structure')) {
        currentSection = 'marketStructure';
      } else if (lower.includes('support') || lower.includes('resistance') || lower.includes('price level')) {
        currentSection = 'priceLevels';
      } else if (lower.includes('candlestick') || lower.includes('pattern analysis')) {
        currentSection = 'patterns';
      } else if (lower.includes('momentum') || lower.includes('trend indicator')) {
        currentSection = 'momentum';
      } else if (lower.includes('trade setup') || lower.includes('entry') || lower.includes('stop loss')) {
        currentSection = 'trading';
      } else if (lower.includes('breakout') || lower.includes('breakdown')) {
        currentSection = 'breakout';
      } else if (lower.includes('summary') || lower.includes('recommendation')) {
        currentSection = 'summary';
      }
      
      if (currentSection) {
        sections[currentSection] = sections[currentSection] || [];
        sections[currentSection].push(line);
      }
    });
    
    return sections;
  };

  const analysisData = parseAnalysisData(data.marketAnalysis);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="w-full bg-chart-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="mr-3 bg-primary/20 p-2 rounded">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">📊 Technical Chart Analysis Report ({formattedPairName} – {data.timeframe || "M15"})</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 text-white">
            
            {/* 1. Market Snapshot */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">1. Market Snapshot</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Current Price:</strong> [current price]</li>
                <li><strong>Date Range Analyzed:</strong> {currentDate} – {currentDate}</li>
                <li><strong>General Market Context:</strong> [e.g., Ranging, Uptrend, Downtrend, Correction, High Volatility]</li>
              </ul>
              {analysisData.marketSnapshot && analysisData.marketSnapshot.length > 0 && (
                <div className="mt-3 text-gray-300 text-sm">
                  {analysisData.marketSnapshot.slice(0, 3).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Recent Price Action & Trend */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">2. Recent Price Action & Trend</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Recent Movement:</h4>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li>[Describe major price swings over the past 1–2 weeks.]</li>
                    <li>[Note any sharp rises/drops, consolidations, or trend reversals.]</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Market Structure:</h4>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li>[E.g., Higher highs/lows, lower highs/lows, sideways movement, possible pattern emerging.]</li>
                  </ul>
                </div>
              </div>
              {(analysisData.recentMovement || analysisData.marketStructure) && (
                <div className="mt-3 text-gray-300 text-sm">
                  {[...(analysisData.recentMovement || []), ...(analysisData.marketStructure || [])].slice(0, 4).map((line, idx) => (
                    <p key={idx}>• {line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Key Support & Resistance Areas */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">3. Key Support & Resistance Areas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Support Levels:</h4>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li>[Primary support] – Main bounce area.</li>
                    <li>[Secondary support] – Next lower level.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-400 mb-2">Resistance Levels:</h4>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li>[Primary resistance] – Main reversal area.</li>
                    <li>[Secondary resistance] – Next higher level.</li>
                  </ul>
                </div>
              </div>
              {analysisData.priceLevels && (
                <div className="mt-3 text-gray-300 text-sm">
                  {analysisData.priceLevels.slice(0, 4).map((line, idx) => (
                    <p key={idx}>• {line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Candlestick & Pattern Analysis */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">4. Candlestick & Pattern Analysis</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>[Describe latest candlestick behaviors: e.g., indecision, strong engulfing patterns, pin bars, etc.]</li>
                <li>[Mention any chart patterns visible: double top/bottom, triangles, channels, flags.]</li>
              </ul>
              {analysisData.patterns && (
                <div className="mt-3 text-gray-300 text-sm">
                  {analysisData.patterns.slice(0, 3).map((line, idx) => (
                    <p key={idx}>• {line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Momentum & Trend Indicators */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">5. Momentum & Trend Indicators</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>[Comment on momentum: e.g., slowing, picking up, diverging.]</li>
                <li>[Note visible signs of trend change: higher/lower highs/lows, compression, etc.]</li>
                <li>[Mention if no indicators (RSI, MACD, MA) are present, analysis based on price action.]</li>
              </ul>
              {analysisData.momentum && (
                <div className="mt-3 text-gray-300 text-sm">
                  {analysisData.momentum.slice(0, 3).map((line, idx) => (
                    <p key={idx}>• {line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Trade Setups & Risk Management */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">6. Trade Setups & Risk Management</h3>
              
              {/* Trading Table */}
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border border-gray-600 rounded">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Trade Type</th>
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Entry Area</th>
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Stop Loss (SL)</th>
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Take Profit (TP1)</th>
                      <th className="text-left p-3 font-semibold">Take Profit (TP2)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 border-r border-gray-600 font-medium text-green-400">Buy</td>
                      <td className="p-3 border-r border-gray-600">[support area/price]</td>
                      <td className="p-3 border-r border-gray-600">[few pips below support]</td>
                      <td className="p-3 border-r border-gray-600">[first resistance]</td>
                      <td className="p-3">[next resistance]</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-r border-gray-600 font-medium text-red-400">Sell</td>
                      <td className="p-3 border-r border-gray-600">[resistance area/price]</td>
                      <td className="p-3 border-r border-gray-600">[few pips above resist.]</td>
                      <td className="p-3 border-r border-gray-600">[first support]</td>
                      <td className="p-3">[next support]</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Entry Notes:</h4>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li><strong>Buy</strong> only if price confirms reversal at support (bullish candle, bounce pattern).</li>
                    <li><strong>Sell</strong> only on strong rejection/reversal at resistance.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Caution:</h4>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li>Avoid trading in the middle of the range, as risk of false signals is higher.</li>
                    <li>Always set a stop loss. Adjust position size so risk is under [X]% per trade.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 7. Breakout/Breakdown Scenarios */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">7. Breakout/Breakdown Scenarios</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>If price breaks below [key support]:</strong><br />→ Expect decline towards [lower level].</li>
                <li><strong>If price breaks above [key resistance]:</strong><br />→ Expect rally towards [upper level].</li>
              </ul>
              {analysisData.breakout && (
                <div className="mt-3 text-gray-300 text-sm">
                  {analysisData.breakout.slice(0, 2).map((line, idx) => (
                    <p key={idx}>• {line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 8. Summary & Trade Signal Recommendation */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">8. Summary & Trade Signal Recommendation</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Market summary:</h4>
                  <p className="ml-4">[Short summary: ranging, trending, bias, recent key price action.]</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Best current signal:</h4>
                  <ul className="space-y-1 list-disc list-inside ml-4">
                    <li>[Wait for price to test and react at specific support/resistance.]</li>
                    <li>[Buy/sell ONLY IF confirmation at major levels.]</li>
                    <li>[Specific price level to watch.]</li>
                  </ul>
                </div>
              </div>
              {analysisData.summary && (
                <div className="mt-3 text-gray-300 text-sm">
                  {analysisData.summary.slice(0, 3).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 9. Trade Plan Table Example */}
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-lg font-bold text-primary mb-4">9. Trade Plan Table Example</h3>
              
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border border-gray-600 rounded">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Trade Plan</th>
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Entry</th>
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Stop Loss</th>
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Take Profit 1</th>
                      <th className="text-left p-3 border-r border-gray-600 font-semibold">Take Profit 2</th>
                      <th className="text-left p-3 font-semibold">R/R</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700">
                      <td className="p-3 border-r border-gray-600 font-medium">Buy Bounce</td>
                      <td className="p-3 border-r border-gray-600">[support]</td>
                      <td className="p-3 border-r border-gray-600">[below S]</td>
                      <td className="p-3 border-r border-gray-600">[resistance1]</td>
                      <td className="p-3 border-r border-gray-600">[resistance2]</td>
                      <td className="p-3">High</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-r border-gray-600 font-medium">Sell Reject</td>
                      <td className="p-3 border-r border-gray-600">[resistance]</td>
                      <td className="p-3 border-r border-gray-600">[above R]</td>
                      <td className="p-3 border-r border-gray-600">[support1]</td>
                      <td className="p-3 border-r border-gray-600">[support2]</td>
                      <td className="p-3">Medium</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Full Analysis Details */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-primary mb-4">📋 AI Analysis Output</h3>
              <div className="whitespace-pre-wrap text-white leading-relaxed text-sm">
                {data.marketAnalysis}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-yellow-400 text-sm">
                    <strong>⚠️ Disclaimer</strong>
                  </p>
                  <p className="text-yellow-200 text-sm mt-1">
                    <em>This analysis is for educational and idea-generation purposes only. Always do your own research and use proper risk management on every trade.</em>
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
