
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTradingPair } from '@/utils/tradingPairUtils';

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
    return data.priceLevels.filter(level => level.name.toLowerCase().includes('support')).slice(0, 5);
  };
  
  const getResistanceLevels = () => {
    return data.priceLevels.filter(level => level.name.toLowerCase().includes('resist')).slice(0, 5);
  };

  // Format the trading pair using our utility
  const formattedPairName = formatTradingPair(data.pairName);

  // Helper function to render bulleted list items from text content
  const renderBulletPoints = (text: string) => {
    if (!text) return null;
    
    // Check if the content already has bullet points
    if (text.includes('•') || text.includes('-')) {
      return (
        <div className="space-y-2">
          {text.split('\n').map((line, index) => (
            <p key={index} className={`
              ${line.trim().startsWith('•') || line.trim().startsWith('-') ? 'ml-4' : ''}
            `}>
              {line}
            </p>
          ))}
        </div>
      );
    }
    
    // Otherwise, render as regular text
    return (
      <div className="space-y-1">
        {text.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="w-full bg-chart-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="mr-2 bg-primary/20 p-1.5 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>Analysis Results</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 text-white">
            {/* Analysis Header - Display pair and timeframe prominently */}
            <div className="flex items-center mb-4 border-b border-gray-700 pb-4">
              <div className="bg-blue-900/30 p-2 rounded mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-primary">
                  {formattedPairName}
                </div>
                <div className="text-gray-400 text-sm">
                  {data.timeframe || "Unknown Timeframe"} Chart
                </div>
              </div>
            </div>
            
            {/* 1. Trend Direction */}
            <div className="space-y-2">
              <div className="text-lg font-semibold">1. Trend Direction:</div>
              <div className="pl-4">
                <p className="font-medium">Overall trend: {data.trendDirection.charAt(0).toUpperCase() + data.trendDirection.slice(1)}</p>
                {renderBulletPoints(data.marketAnalysis)}
              </div>
            </div>
            
            {/* 2. Key Support Levels */}
            <div className="space-y-2">
              <div className="text-lg font-semibold">2. Key Support Levels:</div>
              <div className="pl-4">
                {getSupportLevels().length > 0 ? (
                  <div className="space-y-2">
                    {getSupportLevels().map((level, index) => (
                      <div key={index}>
                        <span className="text-bullish font-medium">{level.price}:</span> {level.name.replace('Support:', '').trim()}
                      </div>
                    ))}
                  </div>
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
                  <div className="space-y-2">
                    {getResistanceLevels().map((level, index) => (
                      <div key={index}>
                        <span className="text-bearish font-medium">{level.price}:</span> {level.name.replace('Resistance:', '').trim()}
                      </div>
                    ))}
                  </div>
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
                  <ul className="list-disc ml-6 space-y-4">
                    {data.chartPatterns.map((pattern, index) => (
                      <li key={index}>
                        <p className={`font-medium ${
                          pattern.signal === 'bullish' ? 'text-bullish' : 
                          pattern.signal === 'bearish' ? 'text-bearish' : 'text-neutral'
                        }`}>
                          {pattern.name}:
                        </p>
                        <ul className="list-disc ml-6 mt-1">
                          <li>Pattern with {pattern.confidence}% confidence indicating a {pattern.signal} signal.</li>
                          {pattern.status && <li>Status: {pattern.status}</li>}
                        </ul>
                      </li>
                    ))}
                  </ul>
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
                  <ul className="list-disc ml-6 space-y-2">
                    {data.marketFactors.map((factor, index) => (
                      <li key={index} className={
                        factor.sentiment === 'bullish' ? 'text-bullish' : 
                        factor.sentiment === 'bearish' ? 'text-bearish' : 'text-neutral'
                      }>
                        {factor.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No technical indicator data available.</p>
                )}
              </div>
            </div>
            
            {/* 6. Trading Insights */}
            <div className="space-y-2">
              <div className="text-lg font-semibold">6. Trading Insights:</div>
              <div className="pl-4 space-y-4">
                {/* Bullish Scenario */}
                <div>
                  <p className="text-bullish font-medium">Bullish Scenario:</p>
                  {data.tradingSetup && data.tradingSetup.type === 'long' ? (
                    <ul className="list-disc ml-6 space-y-1 mt-1">
                      <li>{data.tradingSetup.description}</li>
                      {data.tradingSetup.entryPrice && <li>Entry: {data.tradingSetup.entryPrice}</li>}
                      {data.tradingSetup.stopLoss && <li>Stop Loss: {data.tradingSetup.stopLoss}</li>}
                      {data.tradingSetup.takeProfits && data.tradingSetup.takeProfits.length > 0 && (
                        <li>Take Profit: {data.tradingSetup.takeProfits.join(', ')}</li>
                      )}
                    </ul>
                  ) : (
                    <p className="ml-4">No bullish scenario available.</p>
                  )}
                </div>
                
                {/* Bearish Scenario */}
                <div>
                  <p className="text-bearish font-medium">Bearish Scenario:</p>
                  {data.tradingSetup && data.tradingSetup.type === 'short' ? (
                    <ul className="list-disc ml-6 space-y-1 mt-1">
                      <li>{data.tradingSetup.description}</li>
                      {data.tradingSetup.entryPrice && <li>Entry: {data.tradingSetup.entryPrice}</li>}
                      {data.tradingSetup.stopLoss && <li>Stop Loss: {data.tradingSetup.stopLoss}</li>}
                      {data.tradingSetup.takeProfits && data.tradingSetup.takeProfits.length > 0 && (
                        <li>Take Profit: {data.tradingSetup.takeProfits.join(', ')}</li>
                      )}
                    </ul>
                  ) : (
                    <p className="ml-4">No bearish scenario available.</p>
                  )}
                </div>
                
                {/* Neutral Scenario */}
                <div>
                  <p className="font-medium">Neutral / Consolidation Scenario:</p>
                  {data.tradingSetup && data.tradingSetup.type === 'neutral' ? (
                    <ul className="list-disc ml-6 space-y-1 mt-1">
                      <li>{data.tradingSetup.description}</li>
                    </ul>
                  ) : (
                    <p className="ml-4">No consolidation scenario available.</p>
                  )}
                </div>
                
                {data.tradingInsight && !data.tradingSetup && (
                  <div className="mt-2">
                    {renderBulletPoints(data.tradingInsight)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
