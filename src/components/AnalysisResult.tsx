
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTradingPair } from '@/utils/tradingPairUtils';
import { TrendingUp } from 'lucide-react';

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

  // Helper function to render raw text content with proper line breaks
  const renderRawContent = (text: string) => {
    if (!text) return null;
    
    return (
      <div className="whitespace-pre-wrap text-white leading-relaxed">
        {text}
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
                GPT-4.1 Mini Analysis • {formattedPairName} • {data.timeframe || "Unknown Timeframe"}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-white">
            {/* Raw Analysis Output */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              {renderRawContent(data.marketAnalysis)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
