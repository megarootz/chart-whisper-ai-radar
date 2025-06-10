
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AutoChartGeneratorProps {
  onAnalyze: (file: File, symbol: string, timeframe: string) => void;
  isAnalyzing: boolean;
}

const AutoChartGenerator: React.FC<AutoChartGeneratorProps> = () => {
  const isMobile = useIsMobile();

  const openChartPage = () => {
    window.open('/chart', '_blank');
  };

  return (
    <Card className="w-full bg-chart-card border-gray-700">
      {!isMobile && (
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Live Chart Analysis
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={`${isMobile ? 'pt-4 px-3 pb-3' : 'space-y-6'}`}>
        <div className="text-center space-y-4">
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
            <h3 className="text-blue-400 font-medium mb-2">Full-Screen Chart Analysis</h3>
            <p className="text-gray-400 text-sm">
              Open our dedicated full-screen chart page for the most accurate live analysis with TradingView's native screenshot feature.
            </p>
          </div>
          
          <Button 
            onClick={openChartPage}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Full-Screen Chart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoChartGenerator;
