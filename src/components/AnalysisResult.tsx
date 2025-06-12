
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

  // The AI analysis is already in the correct format, so we just display it directly
  // with proper styling and structure
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="w-full bg-chart-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="mr-3 bg-primary/20 p-2 rounded">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">Analysis Complete</div>
              <div className="text-sm text-gray-300">Professional Chart Analysis for {formattedPairName}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* Display the AI's formatted analysis directly */}
            <div className="bg-gray-800/30 rounded-lg p-6">
              <div className="whitespace-pre-wrap text-white leading-relaxed">
                {data.marketAnalysis}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 mt-6">
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
