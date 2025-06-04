
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

interface AnalysisResultProps {
  data: AnalysisResultData;
  streamingContent?: string;
  isStreaming?: boolean;
}

const AnalysisResult = ({ data, streamingContent, isStreaming }: AnalysisResultProps) => {
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
        {isStreaming && (
          <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1">|</span>
        )}
      </div>
    );
  };

  // Use streaming content if available and currently streaming, otherwise use final data
  const displayContent = isStreaming && streamingContent ? streamingContent : data.marketAnalysis;

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
            <div>DeepSeek Real-Time Analysis {isStreaming && '(Live)'}</div>
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
                  {isStreaming && <span className="ml-2 text-green-400">• Live</span>}
                </div>
              </div>
            </div>
            
            {/* DeepSeek Analysis Response */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Professional Forex Analysis with Real-Time Data
                  {isStreaming && <span className="ml-2 text-green-400 text-sm">Streaming...</span>}
                </h3>
              </div>
              
              {renderDeepSeekResponse(displayContent)}
              
              {!displayContent && isStreaming && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Connecting to DeepSeek's real-time analysis...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
