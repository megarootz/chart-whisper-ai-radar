
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, Brain, Upload, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AnalysisResultProps {
  analysis: any;
  isDeepAnalysis: boolean;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, isDeepAnalysis }) => {
  const { toast } = useToast();

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
    const content = isDeepAnalysis ? analysis.analysis : analysis.analysis;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    if (isDeepAnalysis) {
      a.download = `deep-analysis-${analysis.currency_pair}-${analysis.timeframe}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
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

  if (isDeepAnalysis) {
    return (
      <Card className="bg-gray-800 border-gray-700 mt-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-400" />
              <div>
                <CardTitle className="text-white text-lg">Deep Historical Analysis</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-400/10">
                    {getAnalysisTypeLabel(analysis.analysis_type)}
                  </Badge>
                  <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-400/10">
                    {analysis.currency_pair}
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-400 bg-green-400/10">
                    {analysis.timeframe}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(analysis.analysis)}
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
          
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{analysis.date_range}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{analysis.data_points} data points</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
              {analysis.analysis}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Regular chart analysis display
  return (
    <Card className="bg-gray-800 border-gray-700 mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-blue-400" />
            <div>
              <CardTitle className="text-white text-lg">Chart Analysis</CardTitle>
              <p className="text-gray-400 text-sm mt-1">AI-powered technical analysis</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(analysis.analysis)}
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
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
            {analysis.analysis}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisResult;
