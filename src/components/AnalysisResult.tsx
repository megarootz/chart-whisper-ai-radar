
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, Brain, Upload, Calendar, TrendingUp, TrendingDown, Minus, Target, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Export types for other components to use
export interface MarketFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ChartPattern {
  pattern: string;
  reliability: number;
  description: string;
}

export interface PriceLevel {
  level: number;
  type: 'support' | 'resistance';
  strength: number;
}

export interface TradingSetup {
  type: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
}

export interface AnalysisResultData {
  pairName: string;
  timeframe: string;
  overallSentiment: string;
  confidenceScore: number;
  marketAnalysis: string;
  trendDirection: string;
  marketFactors: MarketFactor[];
  chartPatterns: ChartPattern[];
  priceLevels: PriceLevel[];
  tradingInsight: string;
  created_at?: string;
  id?: string;
}

interface AnalysisResultProps {
  analysis?: any;
  data?: AnalysisResultData;
  isDeepAnalysis?: boolean;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, data, isDeepAnalysis = false }) => {
  const { toast } = useToast();

  // Handle both old and new prop formats
  const analysisData = data || analysis;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Analysis has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy analysis to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadAsText = () => {
    const content = isDeepAnalysis ? analysisData.analysis : (analysisData.marketAnalysis || analysisData.analysis);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    if (isDeepAnalysis) {
      a.download = `deep-analysis-${analysisData.currency_pair}-${analysisData.timeframe}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    } else {
      a.download = `chart-analysis-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download complete",
      description: "Analysis has been downloaded as a text file.",
    });
  };

  const getAnalysisTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'ict': 'ICT Analysis',
      'elliott_wave': 'Elliott Wave',
      'support_resistance': 'Support & Resistance',
      'fibonacci': 'Fibonacci Analysis',
      'volume_profile': 'Volume Profile',
      'market_structure': 'Market Structure'
    };
    return types[type] || 'Technical Analysis';
  };

  // Parse analysis text for structured data
  const parseAnalysisText = (text: string) => {
    const sections = {
      trend: '',
      supportResistance: '',
      patterns: '',
      momentum: '',
      recommendation: ''
    };

    // Extract sections using regex patterns
    const trendMatch = text.match(/###\s*1\.\s*Current Market Trend([\s\S]*?)(?=###\s*2\.|$)/i);
    const supportMatch = text.match(/###\s*2\.\s*Key Support and Resistance Levels([\s\S]*?)(?=###\s*3\.|$)/i);
    const patternsMatch = text.match(/###\s*3\.\s*Technical Chart Patterns([\s\S]*?)(?=###\s*4\.|$)/i);
    const momentumMatch = text.match(/###\s*4\.\s*Market Momentum and Volatility([\s\S]*?)(?=###\s*5\.|$)/i);
    const recommendationMatch = text.match(/###\s*5\.\s*Clear Trading Recommendation([\s\S]*?)$/i);

    if (trendMatch) sections.trend = trendMatch[1].trim();
    if (supportMatch) sections.supportResistance = supportMatch[1].trim();
    if (patternsMatch) sections.patterns = patternsMatch[1].trim();
    if (momentumMatch) sections.momentum = momentumMatch[1].trim();
    if (recommendationMatch) sections.recommendation = recommendationMatch[1].trim();

    return sections;
  };

  const getTrendIcon = (trendText: string) => {
    if (trendText.toLowerCase().includes('bullish') || trendText.toLowerCase().includes('upward')) {
      return <TrendingUp className="h-5 w-5 text-green-400" />;
    } else if (trendText.toLowerCase().includes('bearish') || trendText.toLowerCase().includes('downward')) {
      return <TrendingDown className="h-5 w-5 text-red-400" />;
    } else {
      return <Minus className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.toLowerCase().includes('buy')) {
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    } else if (recommendation.toLowerCase().includes('sell')) {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    } else {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  if (isDeepAnalysis) {
    const sections = parseAnalysisText(analysisData.analysis);
    
    return (
      <Card className="bg-gray-800 border-gray-700 mt-6 animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-400" />
              <div>
                <CardTitle className="text-white text-lg">🧠 Deep Historical Analysis</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-400/10">
                    {getAnalysisTypeLabel(analysisData.analysis_type)}
                  </Badge>
                  <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-400/10">
                    {analysisData.currency_pair}
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-400 bg-green-400/10">
                    {analysisData.timeframe}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(analysisData.analysis)}
                variant="outline"
                size="sm"
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={downloadAsText}
                variant="outline"
                size="sm"
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{analysisData.date_range}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{analysisData.data_points} data points</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Market Trend Section */}
          {sections.trend && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 animate-slide-in">
              <div className="flex items-center gap-2 mb-3">
                {getTrendIcon(sections.trend)}
                <h3 className="text-lg font-semibold text-white">📈 Current Market Trend</h3>
              </div>
              <div className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                {sections.trend}
              </div>
            </div>
          )}

          {/* Support & Resistance Section */}
          {sections.supportResistance && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 animate-slide-in">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">🎯 Key Support & Resistance Levels</h3>
              </div>
              <div className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                {sections.supportResistance}
              </div>
            </div>
          )}

          {/* Chart Patterns Section */}
          {sections.patterns && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 animate-slide-in">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">📊 Technical Chart Patterns</h3>
              </div>
              <div className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                {sections.patterns}
              </div>
            </div>
          )}

          {/* Momentum Section */}
          {sections.momentum && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 animate-slide-in">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">⚡ Market Momentum & Volatility</h3>
              </div>
              <div className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                {sections.momentum}
              </div>
            </div>
          )}

          {/* Trading Recommendation Section */}
          {sections.recommendation && (
            <div className={`rounded-lg p-4 border animate-slide-in ${getRecommendationColor(sections.recommendation)}`}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5" />
                <h3 className="text-lg font-semibold">💡 Trading Recommendation</h3>
              </div>
              <div className="leading-relaxed whitespace-pre-wrap font-medium">
                {sections.recommendation}
              </div>
            </div>
          )}

          {/* Fallback for unparsed content */}
          {(!sections.trend && !sections.supportResistance && !sections.patterns && !sections.momentum && !sections.recommendation) && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                {analysisData.analysis}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Regular chart analysis display
  return (
    <Card className="bg-gray-800 border-gray-700 mt-6 animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-blue-400" />
            <div>
              <CardTitle className="text-white text-lg">📊 Chart Analysis</CardTitle>
              <p className="text-gray-400 text-sm mt-1">AI-powered technical analysis</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(analysisData.marketAnalysis || analysisData.analysis)}
              variant="outline"
              size="sm"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              onClick={downloadAsText}
              variant="outline"
              size="sm"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 animate-slide-in">
          <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
            {analysisData.marketAnalysis || analysisData.analysis}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisResult;
