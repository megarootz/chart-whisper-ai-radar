
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
  // Format the trading pair using our utility
  const formattedPairName = formatTradingPair(data.pairName);

  // Helper function to render the DeepSeek response as formatted text
  const renderDeepSeekResponse = (text: string) => {
    if (!text) return null;
    
    return (
      <div className="space-y-4 whitespace-pre-wrap text-gray-200 leading-relaxed">
        {text.split('\n').map((paragraph, index) => {
          // Skip empty paragraphs
          if (!paragraph.trim()) return null;
          
          // Check if this is a header/title (contains uppercase words or specific patterns)
          const isHeader = paragraph.match(/^[A-Z\s]+:?$/) || 
                          paragraph.match(/^\d+\.\s/) ||
                          paragraph.match(/^#{1,3}\s/) ||
                          paragraph.includes('**') ||
                          paragraph.match(/^[A-Z][^:]*:$/);
          
          if (isHeader) {
            return (
              <h3 key={index} className="text-lg font-semibold text-white mt-6 mb-3">
                {paragraph.replace(/[*#]/g, '').trim()}
              </h3>
            );
          }
          
          // Regular paragraph
          return (
            <p key={index} className="mb-2">
              {paragraph}
            </p>
          );
        })}
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
            <div>DeepSeek Professional Analysis</div>
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
                  {data.timeframe || "Unknown Timeframe"} Analysis
                </div>
              </div>
            </div>
            
            {/* DeepSeek Analysis Response */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Professional Forex Analysis</h3>
              </div>
              
              {renderDeepSeekResponse(data.marketAnalysis)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
