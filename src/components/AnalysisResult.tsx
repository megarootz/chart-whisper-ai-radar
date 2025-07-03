
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export interface AnalysisResultData {
  pairName: string;
  timeframe: string;
  overallSentiment: string;
  confidenceScore?: number;
  marketAnalysis: string;
  trendDirection?: string;
  marketFactors?: string[];
  chartPatterns?: string[];
  priceLevels?: any[];
  tradingInsight?: string;
  created_at?: string;
  current_price?: string;
  current_price_timestamp?: string;
  has_current_price?: boolean;
  data_points?: number;
  date_range?: string;
  truncated?: boolean;
  analysis?: string;
  currency_pair?: string;
  analysis_type?: string;
  content?: string;
}

interface AnalysisResultProps {
  analysis: AnalysisResultData;
  isDeepAnalysis?: boolean;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, isDeepAnalysis = false }) => {
  if (!analysis) return null;

  const formatAnalysisText = (text: string) => {
    // Split text into paragraphs and format them
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    
    return paragraphs.map((paragraph, index) => {
      // Check for numbered sections (like "1. Current Market Trend:")
      if (/^\d+\.\s/.test(paragraph.trim())) {
        return (
          <div key={index} className="mb-4">
            <h4 className="font-semibold text-white mb-2">{paragraph.trim()}</h4>
          </div>
        );
      }
      
      // Check for bullet points or dashes
      if (/^[-•]\s/.test(paragraph.trim())) {
        return (
          <div key={index} className="mb-2 ml-4">
            <span className="text-gray-300">{paragraph.trim()}</span>
          </div>
        );
      }
      
      // Regular paragraphs
      return (
        <p key={index} className="text-gray-300 mb-3 leading-relaxed">
          {paragraph.trim()}
        </p>
      );
    });
  };

  const getTrendIcon = (sentiment: string) => {
    const lowerSentiment = sentiment?.toLowerCase() || '';
    if (lowerSentiment.includes('bullish') || lowerSentiment.includes('buy')) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (lowerSentiment.includes('bearish') || lowerSentiment.includes('sell')) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <Activity className="w-4 h-4 text-yellow-400" />;
  };

  const getSentimentColor = (sentiment: string) => {
    const lowerSentiment = sentiment?.toLowerCase() || '';
    if (lowerSentiment.includes('bullish') || lowerSentiment.includes('buy')) {
      return 'bg-green-600';
    } else if (lowerSentiment.includes('bearish') || lowerSentiment.includes('sell')) {
      return 'bg-red-600';
    }
    return 'bg-yellow-600';
  };

  const analysisText = typeof analysis.analysis === 'string' 
    ? analysis.analysis 
    : analysis.marketAnalysis || analysis.content || 'No analysis content available';

  const pairName = analysis.pairName || analysis.currency_pair || 'Unknown Pair';
  const timeframe = analysis.timeframe || 'Unknown Timeframe';
  const sentiment = analysis.overallSentiment || analysis.analysis_type || 'Analysis';
  const createdAt = analysis.created_at ? new Date(analysis.created_at) : new Date();

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-white text-xl">
              {pairName} Analysis
            </CardTitle>
            {getTrendIcon(sentiment)}
          </div>
          <div className="flex items-center space-x-2">
            {isDeepAnalysis && (
              <Badge variant="secondary" className="bg-purple-600 text-white">
                Deep Analysis
              </Badge>
            )}
            <Badge className={`text-white ${getSentimentColor(sentiment)}`}>
              {sentiment}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{format(createdAt, 'MMM d, yyyy HH:mm')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="w-4 h-4" />
            <span>{timeframe.toUpperCase()}</span>
          </div>
          {analysis.data_points && (
            <div className="flex items-center space-x-1">
              <span>📊 {analysis.data_points} data points</span>
            </div>
          )}
        </div>

        {/* Current Price Display */}
        {analysis.has_current_price && analysis.current_price && (
          <div className="mt-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">Current Price:</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">
                  {parseFloat(analysis.current_price).toFixed(pairName.includes('JPY') ? 3 : 5)}
                </div>
                {analysis.current_price_timestamp && (
                  <div className="text-xs text-gray-400">
                    As of {format(new Date(analysis.current_price_timestamp), 'HH:mm:ss')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning for truncated analysis */}
        {analysis.truncated && (
          <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-yellow-400 text-sm">
            ⚠️ Analysis may be incomplete due to length limits
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="prose prose-invert max-w-none">
          {formatAnalysisText(analysisText)}
        </div>
        
        {analysis.date_range && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              <strong>Analysis Period:</strong> {analysis.date_range}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisResult;
