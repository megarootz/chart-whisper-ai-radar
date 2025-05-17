
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="w-full bg-chart-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6 text-white font-mono">
              {/* Analysis Header */}
              <div className="text-xl font-bold text-primary">
                {data.pairName} Technical Analysis ({data.timeframe} Chart)
              </div>
              
              {/* 1. Trend Direction */}
              <div className="space-y-2">
                <div className="text-lg font-semibold">1. Trend Direction:</div>
                <div className="pl-4">
                  <p>Overall trend: {data.trendDirection.charAt(0).toUpperCase() + data.trendDirection.slice(1)}</p>
                  <p className="mt-2">{data.marketAnalysis}</p>
                </div>
              </div>
              
              {/* 2. Key Support Levels */}
              <div className="space-y-2">
                <div className="text-lg font-semibold">2. Key Support Levels:</div>
                <div className="pl-4">
                  {getSupportLevels().length > 0 ? (
                    getSupportLevels().map((level, index) => (
                      <p key={index} className="text-bullish">
                        {level.price}: {level.name.replace('Support:', '').trim()}
                      </p>
                    ))
                  ) : (
                    <p>No specific support levels identified.</p>
                  )}
                </div>
              </div>
              
              {/* 3. Key Resistance Levels */}
              <div className="space-y-2">
                <div className="text-lg font-semibold">3. Key Resistance Levels:</div>
                <div className="pl-4">
                  {getResistanceLevels().length > 0 ? (
                    getResistanceLevels().map((level, index) => (
                      <p key={index} className="text-bearish">
                        {level.price}: {level.name.replace('Resistance:', '').trim()}
                      </p>
                    ))
                  ) : (
                    <p>No specific resistance levels identified.</p>
                  )}
                </div>
              </div>
              
              {/* 4. Chart Patterns */}
              <div className="space-y-2">
                <div className="text-lg font-semibold">4. Chart Patterns:</div>
                <div className="pl-4">
                  {data.chartPatterns.length > 0 ? (
                    data.chartPatterns.map((pattern, index) => (
                      <div key={index} className="mb-3">
                        <p className={`font-medium ${
                          pattern.signal === 'bullish' ? 'text-bullish' : 
                          pattern.signal === 'bearish' ? 'text-bearish' : 'text-neutral'
                        }`}>
                          {pattern.name}:
                        </p>
                        <p>Pattern with {pattern.confidence}% confidence indicating a {pattern.signal} signal.</p>
                        {pattern.status && <p>Status: {pattern.status}</p>}
                      </div>
                    ))
                  ) : (
                    <p>No significant chart patterns identified.</p>
                  )}
                </div>
              </div>
              
              {/* 5. Technical Indicators */}
              <div className="space-y-2">
                <div className="text-lg font-semibold">5. Technical Indicators:</div>
                <div className="pl-4">
                  {data.marketFactors.length > 0 ? (
                    data.marketFactors.map((factor, index) => (
                      <p key={index} className={
                        factor.sentiment === 'bullish' ? 'text-bullish' : 
                        factor.sentiment === 'bearish' ? 'text-bearish' : 'text-neutral'
                      }>
                        {factor.name}: {factor.description}
                      </p>
                    ))
                  ) : (
                    <p>No technical indicator data available.</p>
                  )}
                </div>
              </div>
              
              {/* 6. Trading Insights */}
              <div className="space-y-2">
                <div className="text-lg font-semibold">6. Trading Insights:</div>
                <div className="pl-4 space-y-3">
                  {data.tradingSetup && (
                    <>
                      {data.tradingSetup.type === 'long' && (
                        <div>
                          <p className="text-bullish font-medium">Bullish Scenario:</p>
                          <p>{data.tradingSetup.description}</p>
                          {data.tradingSetup.entryPrice && <p>Entry: {data.tradingSetup.entryPrice}</p>}
                          {data.tradingSetup.stopLoss && <p>Stop Loss: {data.tradingSetup.stopLoss}</p>}
                          {data.tradingSetup.takeProfits && data.tradingSetup.takeProfits.length > 0 && (
                            <p>Take Profit: {data.tradingSetup.takeProfits.join(', ')}</p>
                          )}
                        </div>
                      )}
                      
                      {data.tradingSetup.type === 'short' && (
                        <div>
                          <p className="text-bearish font-medium">Bearish Scenario:</p>
                          <p>{data.tradingSetup.description}</p>
                          {data.tradingSetup.entryPrice && <p>Entry: {data.tradingSetup.entryPrice}</p>}
                          {data.tradingSetup.stopLoss && <p>Stop Loss: {data.tradingSetup.stopLoss}</p>}
                          {data.tradingSetup.takeProfits && data.tradingSetup.takeProfits.length > 0 && (
                            <p>Take Profit: {data.tradingSetup.takeProfits.join(', ')}</p>
                          )}
                        </div>
                      )}
                      
                      {data.tradingSetup.type === 'neutral' && (
                        <div>
                          <p className="font-medium">Neutral/Consolidation Scenario:</p>
                          <p>{data.tradingSetup.description}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {data.tradingInsight && !data.tradingSetup && (
                    <p>{data.tradingInsight}</p>
                  )}
                  
                  {!data.tradingInsight && !data.tradingSetup && (
                    <p>No specific trading insights available.</p>
                  )}
                </div>
              </div>
              
              {/* Summary Table */}
              <div className="space-y-2">
                <div className="text-lg font-semibold">Summary Table:</div>
                <div className="pl-4">
                  <div className="grid grid-cols-2 gap-2 border border-gray-700 rounded-md overflow-hidden">
                    <div className="bg-gray-800 p-2">Factor</div>
                    <div className="bg-gray-800 p-2">Observation</div>
                    
                    <div className="border-t border-gray-700 p-2">Trend</div>
                    <div className="border-t border-gray-700 p-2">{data.trendDirection.charAt(0).toUpperCase() + data.trendDirection.slice(1)}</div>
                    
                    <div className="border-t border-gray-700 p-2">Key Support Levels</div>
                    <div className="border-t border-gray-700 p-2">
                      {getSupportLevels().length > 0 ? 
                        getSupportLevels().map(level => level.price).join(', ') : 
                        'None identified'
                      }
                    </div>
                    
                    <div className="border-t border-gray-700 p-2">Key Resistance Levels</div>
                    <div className="border-t border-gray-700 p-2">
                      {getResistanceLevels().length > 0 ? 
                        getResistanceLevels().map(level => level.price).join(', ') : 
                        'None identified'
                      }
                    </div>
                    
                    <div className="border-t border-gray-700 p-2">Chart Patterns</div>
                    <div className="border-t border-gray-700 p-2">
                      {data.chartPatterns.length > 0 ? 
                        data.chartPatterns.map(pattern => `${pattern.name} (${pattern.signal})`).join(', ') : 
                        'None identified'
                      }
                    </div>
                    
                    <div className="border-t border-gray-700 p-2">Trading Bias</div>
                    <div className="border-t border-gray-700 p-2">
                      {data.overallSentiment.charAt(0).toUpperCase() + data.overallSentiment.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
