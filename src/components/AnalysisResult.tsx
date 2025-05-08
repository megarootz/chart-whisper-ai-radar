import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, CircleArrowDown, CircleArrowUp, ChartCandlestick, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketFactor {
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface ChartPattern {
  name: string;
  confidence: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  status?: 'complete' | 'forming';
}

interface PriceLevel {
  name: string;
  price: string;
  distance: string;
  direction: 'up' | 'down';
}

interface TradingSetup {
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
}

const AnalysisResult = ({ data }: { data: AnalysisResultData }) => {
  const [isTradingSetupExpanded, setIsTradingSetupExpanded] = useState(false);
  
  const getSentimentColor = (sentiment: string): string => {
    if (sentiment.includes('bullish')) return 'bg-bullish';
    if (sentiment.includes('bearish')) return 'bg-bearish';
    return 'bg-neutral';
  };

  const getSentimentTextColor = (sentiment: string): string => {
    if (sentiment.includes('bullish')) return 'text-bullish';
    if (sentiment.includes('bearish')) return 'text-bearish';
    return 'text-neutral';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="w-full bg-chart-card border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-gray-800 p-2 rounded-full">
                <ChartCandlestick className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {data.pairName} <span className="text-sm font-normal text-gray-400">{data.timeframe}</span>
                </CardTitle>
                <CardDescription className="text-chart-text">
                  Analysis Results
                </CardDescription>
              </div>
            </div>
            <Badge className={`${getSentimentColor(data.overallSentiment)} text-white uppercase`}>
              {data.overallSentiment}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-chart-text">Signal Strength</span>
            <span className="text-white font-medium">{data.confidenceScore}%</span>
          </div>
          <Progress value={data.confidenceScore} className="h-2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-white text-lg mb-2">Market Analysis</h3>
            <p className="text-chart-text">{data.marketAnalysis}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-white text-lg">Trend Direction</h3>
              <div className="flex items-center gap-1">
                {data.trendDirection === 'bullish' ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-bullish" />
                    <span className="text-bullish font-medium">Bullish</span>
                  </>
                ) : data.trendDirection === 'bearish' ? (
                  <>
                    <TrendingDown className="h-5 w-5 text-bearish" />
                    <span className="text-bearish font-medium">Bearish</span>
                  </>
                ) : (
                  <span className="text-neutral font-medium">Neutral</span>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-white text-lg mb-3">Key Market Factors</h3>
            <div className="space-y-3">
              {data.marketFactors.map((factor, index) => (
                <div key={index} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-white font-medium">{factor.name}</h4>
                    <Badge className={`${getSentimentColor(factor.sentiment)}`}>
                      {factor.sentiment.charAt(0).toUpperCase() + factor.sentiment.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-chart-text text-sm">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div>
            <h3 className="text-white text-lg mb-3">Chart Patterns</h3>
            <div className="space-y-3">
              {data.chartPatterns.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center gap-2">
                    {pattern.signal === 'bullish' ? (
                      <CircleArrowUp className="h-5 w-5 text-bullish" />
                    ) : pattern.signal === 'bearish' ? (
                      <CircleArrowDown className="h-5 w-5 text-bearish" />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-neutral"></span>
                    )}
                    <div>
                      <span className={`font-medium ${getSentimentTextColor(pattern.signal)}`}>
                        {pattern.name}
                      </span>
                      {pattern.status === 'forming' && (
                        <Badge className="ml-2 bg-blue-500/20 text-blue-300 text-xs">Forming</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-chart-text text-sm">{pattern.confidence}%</span>
                    <span className={`text-sm ${getSentimentTextColor(pattern.signal)}`}>
                      {pattern.signal.charAt(0).toUpperCase() + pattern.signal.slice(1)} signal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div>
            <h3 className="text-white text-lg mb-3">Key Price Levels</h3>
            <div className="relative overflow-x-auto rounded-lg border border-gray-700">
              <table className="w-full text-left">
                <thead className="bg-gray-800 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Price Level</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.priceLevels.map((level, index) => (
                    <tr key={index} className="border-b border-gray-700 bg-gray-800/30">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        <span className={level.name.toLowerCase().includes('resist') ? "text-bearish" : "text-bullish"}>•</span> 
                        {level.name}
                      </td>
                      <td className="px-4 py-3 text-white">{level.price}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {level.direction === 'up' ? (
                            <CircleArrowUp className="h-4 w-4 text-bearish mr-1" />
                          ) : (
                            <CircleArrowDown className="h-4 w-4 text-bullish mr-1" />
                          )}
                          <span className={level.direction === 'up' ? "text-bearish" : "text-bullish"}>
                            {level.distance}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Trading Setup Section */}
          {data.tradingSetup && (
            <>
              <Separator className="bg-gray-700" />
              
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsTradingSetupExpanded(!isTradingSetupExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-800 p-2 rounded-full">
                      {data.tradingSetup.type === 'long' ? (
                        <CircleArrowUp className="h-5 w-5 text-bullish" />
                      ) : data.tradingSetup.type === 'short' ? (
                        <CircleArrowDown className="h-5 w-5 text-bearish" />
                      ) : (
                        <span className="h-5 w-5 rounded-full bg-neutral"></span>
                      )}
                    </div>
                    <h3 className="text-white text-lg">Recommended Trading Setup</h3>
                  </div>
                  <div className="flex items-center">
                    <Badge className={data.tradingSetup.type === 'long' ? 'bg-bullish' : data.tradingSetup.type === 'short' ? 'bg-bearish' : 'bg-neutral'}>
                      {data.tradingSetup.type.toUpperCase()}
                    </Badge>
                    <span className="ml-2">
                      {isTradingSetupExpanded ? 
                        <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      }
                    </span>
                  </div>
                </div>
                
                {isTradingSetupExpanded && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                      <p className="font-medium mb-2 text-white">Setup Description</p>
                      <p className="text-chart-text">{data.tradingSetup.description}</p>
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
                          <div 
                            className={`h-1.5 rounded-full ${data.tradingSetup.type === 'long' ? 'bg-bullish' : data.tradingSetup.type === 'short' ? 'bg-bearish' : 'bg-neutral'}`}
                            style={{ width: `${data.tradingSetup.confidence}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">Confidence</span>
                          <span className="text-xs text-white">{data.tradingSetup.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.tradingSetup.entryPrice && (
                        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                          <h4 className="text-chart-text mb-1">Entry Price</h4>
                          <p className="text-white text-lg font-medium">{data.tradingSetup.entryPrice}</p>
                        </div>
                      )}
                      
                      {data.tradingSetup.stopLoss && (
                        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                          <h4 className="text-bearish mb-1">Stop Loss</h4>
                          <p className="text-white text-lg font-medium">{data.tradingSetup.stopLoss}</p>
                        </div>
                      )}
                      
                      {data.tradingSetup.takeProfits && data.tradingSetup.takeProfits.length > 0 && (
                        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                          <h4 className="text-bullish mb-1">Take Profit Targets</h4>
                          <div className="flex flex-col gap-1">
                            {data.tradingSetup.takeProfits.map((tp, index) => (
                              <p key={index} className="text-white font-medium">
                                TP{index + 1}: {tp}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {data.tradingSetup.entryTrigger && (
                      <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700">
                        <h4 className="text-white mb-2 font-medium">Entry Trigger</h4>
                        <p className="text-chart-text">{data.tradingSetup.entryTrigger}</p>
                      </div>
                    )}
                    
                    {data.tradingSetup.riskRewardRatio && (
                      <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                        <div className="flex justify-between">
                          <span className="text-chart-text">Risk/Reward Ratio:</span>
                          <span className="text-white font-medium">{data.tradingSetup.riskRewardRatio}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          
          {data.tradingInsight && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white text-lg mb-2">Trading Insight</h3>
              <p className="text-chart-text">{data.tradingInsight}</p>
            </div>
          )}
          
          {data.entryLevel && !data.tradingSetup && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <h4 className="text-chart-text mb-1">Entry Price</h4>
                <p className="text-white text-lg font-medium">{data.entryLevel}</p>
              </div>
              {data.stopLoss && (
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-bearish mb-1">Stop Loss</h4>
                  <p className="text-white text-lg font-medium">{data.stopLoss}</p>
                </div>
              )}
              {data.takeProfits && data.takeProfits.length > 0 && (
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-bullish mb-1">Take Profit</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.takeProfits.map((tp, index) => (
                      <p key={index} className="text-white text-lg font-medium">
                        {tp}{index < data.takeProfits!.length - 1 && ', '}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button className="w-full flex items-center gap-2" variant="outline">
            <Download className="h-4 w-4" /> Download Analysis
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AnalysisResult;
