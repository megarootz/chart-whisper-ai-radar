
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTradingPair } from '@/utils/tradingPairUtils';
import { TrendingUp, Target, Shield, AlertTriangle } from 'lucide-react';

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
  // Function to get support and resistance levels
  const getSupportLevels = () => {
    return data.priceLevels.filter(level => level.name.toLowerCase().includes('support'));
  };
  
  const getResistanceLevels = () => {
    return data.priceLevels.filter(level => level.name.toLowerCase().includes('resist'));
  };

  // Format the trading pair using our utility
  const formattedPairName = formatTradingPair(data.pairName);

  // Helper function to render structured text content
  const renderStructuredContent = (text: string) => {
    if (!text) return null;
    
    // Split by sections and format
    const sections = text.split('\n').filter(line => line.trim());
    
    return (
      <div className="space-y-2">
        {sections.map((line, index) => {
          const trimmedLine = line.trim();
          
          // Skip empty lines
          if (!trimmedLine) return null;
          
          // Handle bullet points
          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
            return (
              <div key={index} className="ml-4 flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>{trimmedLine.substring(1).trim()}</span>
              </div>
            );
          }
          
          // Handle structured data (key: value)
          if (trimmedLine.includes(':') && !trimmedLine.startsWith('http')) {
            const [key, ...valueParts] = trimmedLine.split(':');
            const value = valueParts.join(':').trim();
            
            return (
              <div key={index} className="flex flex-wrap">
                <span className="font-medium text-primary mr-2">{key.trim()}:</span>
                <span className="flex-1">{value}</span>
              </div>
            );
          }
          
          // Regular paragraph
          return (
            <p key={index} className="leading-relaxed">
              {trimmedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="w-full bg-chart-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="mr-3 bg-primary/20 p-2 rounded">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">Professional Technical Analysis</div>
              <div className="text-sm text-gray-400 font-normal mt-1">
                Institutional-Grade Market Analysis
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 text-white">
            {/* Analysis Header - Display pair and timeframe prominently */}
            <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">
                    {formattedPairName}
                  </div>
                  <div className="text-gray-300">
                    {data.timeframe || "Unknown Timeframe"} Chart Analysis
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    data.overallSentiment === 'bullish' ? 'text-green-400' :
                    data.overallSentiment === 'bearish' ? 'text-red-400' :
                    data.overallSentiment === 'mildly bullish' ? 'text-green-300' :
                    data.overallSentiment === 'mildly bearish' ? 'text-red-300' :
                    'text-yellow-400'
                  }`}>
                    {data.overallSentiment.charAt(0).toUpperCase() + data.overallSentiment.slice(1)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Confidence: {data.confidenceScore}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* 1. Market Structure & Trend Analysis */}
            <div className="space-y-3">
              <div className="flex items-center text-lg font-semibold">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                1. Market Structure & Trend Analysis
              </div>
              <div className="pl-7 bg-gray-800/30 rounded-lg p-4">
                {renderStructuredContent(data.marketAnalysis)}
              </div>
            </div>
            
            {/* 2. Critical Support & Resistance Levels */}
            <div className="space-y-3">
              <div className="flex items-center text-lg font-semibold">
                <Target className="h-5 w-5 mr-2 text-primary" />
                2. Critical Support & Resistance Levels
              </div>
              <div className="pl-7 grid md:grid-cols-2 gap-4">
                {/* Support Levels */}
                <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-green-400 mb-3">Support Levels</h4>
                  {getSupportLevels().length > 0 ? (
                    <div className="space-y-2">
                      {getSupportLevels().map((level, index) => (
                        <div key={index} className="flex flex-col">
                          <span className="font-mono text-green-300 font-bold">{level.price}</span>
                          <span className="text-sm text-gray-300">{level.name.replace('Primary Support:', '').replace('Secondary Support:', '').trim()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No specific support levels identified.</p>
                  )}
                </div>
                
                {/* Resistance Levels */}
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-red-400 mb-3">Resistance Levels</h4>
                  {getResistanceLevels().length > 0 ? (
                    <div className="space-y-2">
                      {getResistanceLevels().map((level, index) => (
                        <div key={index} className="flex flex-col">
                          <span className="font-mono text-red-300 font-bold">{level.price}</span>
                          <span className="text-sm text-gray-300">{level.name.replace('Primary Resistance:', '').replace('Secondary Resistance:', '').trim()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No specific resistance levels identified.</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 3. Chart Patterns & Formations */}
            <div className="space-y-3">
              <div className="text-lg font-semibold">3. Chart Patterns & Formations</div>
              <div className="pl-7">
                {data.chartPatterns.length > 0 ? (
                  <div className="space-y-3">
                    {data.chartPatterns.map((pattern, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-4 border-l-4 border-primary">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-medium ${
                            pattern.signal === 'bullish' ? 'text-green-400' : 
                            pattern.signal === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {pattern.name}
                          </h4>
                          <span className="text-sm text-gray-400">
                            {pattern.confidence}% confidence • {pattern.status || 'complete'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {pattern.signal.charAt(0).toUpperCase() + pattern.signal.slice(1)} pattern formation
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No significant chart patterns identified.</p>
                )}
              </div>
            </div>
            
            {/* 4. Technical Indicators Synthesis */}
            <div className="space-y-3">
              <div className="text-lg font-semibold">4. Technical Indicators Synthesis</div>
              <div className="pl-7">
                {data.marketFactors.length > 0 ? (
                  <div className="grid gap-3">
                    {data.marketFactors.map((factor, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-3 border-l-4 border-blue-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-400 mb-1">{factor.name}</h4>
                            <p className="text-sm text-gray-300">{factor.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ml-3 ${
                            factor.sentiment === 'bullish' ? 'bg-green-900/50 text-green-300' : 
                            factor.sentiment === 'bearish' ? 'bg-red-900/50 text-red-300' : 
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {factor.sentiment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No technical indicator data available.</p>
                )}
              </div>
            </div>
            
            {/* 5. Professional Trading Setup */}
            {data.tradingSetup && (
              <div className="space-y-3">
                <div className="flex items-center text-lg font-semibold">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  5. Professional Trading Setup
                </div>
                <div className="pl-7">
                  <div className={`rounded-lg p-4 border-l-4 ${
                    data.tradingSetup.type === 'long' ? 'bg-green-900/20 border-green-500' :
                    data.tradingSetup.type === 'short' ? 'bg-red-900/20 border-red-500' :
                    'bg-yellow-900/20 border-yellow-500'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-bold text-lg ${
                        data.tradingSetup.type === 'long' ? 'text-green-400' :
                        data.tradingSetup.type === 'short' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {data.tradingSetup.type.toUpperCase()} SETUP
                      </h4>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Confidence: {data.tradingSetup.confidence}%</div>
                        <div className="text-sm text-gray-400">R:R {data.tradingSetup.riskRewardRatio || '1:2'}</div>
                      </div>
                    </div>
                    
                    {/* Trading Details */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {data.tradingSetup.entryPrice && (
                        <div>
                          <span className="text-sm text-gray-400">Entry Zone:</span>
                          <div className="font-mono text-white font-bold">{data.tradingSetup.entryPrice}</div>
                        </div>
                      )}
                      
                      {data.tradingSetup.stopLoss && (
                        <div>
                          <span className="text-sm text-gray-400">Stop Loss:</span>
                          <div className="font-mono text-red-300 font-bold">{data.tradingSetup.stopLoss}</div>
                        </div>
                      )}
                      
                      {data.tradingSetup.takeProfits && data.tradingSetup.takeProfits.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="text-sm text-gray-400">Take Profits:</span>
                          <div className="flex gap-2 mt-1">
                            {data.tradingSetup.takeProfits.map((tp, index) => (
                              <div key={index} className="font-mono text-green-300 font-bold">
                                TP{index + 1}: {tp}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Setup Description */}
                    <div className="bg-gray-900/50 rounded p-3">
                      <h5 className="font-medium mb-2 text-white">Setup Analysis:</h5>
                      {renderStructuredContent(data.tradingSetup.description)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 6. Risk Management & Market Outlook */}
            {data.tradingInsight && (
              <div className="space-y-3">
                <div className="flex items-center text-lg font-semibold">
                  <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
                  6. Risk Management & Market Outlook
                </div>
                <div className="pl-7 bg-blue-900/10 border border-blue-800/30 rounded-lg p-4">
                  {renderStructuredContent(data.tradingInsight)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
