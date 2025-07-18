
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, BarChart3 } from 'lucide-react';
import DeepHistoricalAnalysis from './DeepHistoricalAnalysis';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnalysisMenuProps {
  onAnalysisComplete: (analysis: any, isDeepAnalysis?: boolean) => void;
}

const AnalysisMenu: React.FC<AnalysisMenuProps> = ({ onAnalysisComplete }) => {
  const isMobile = useIsMobile();
  
  const handleDeepAnalysisComplete = (analysis: any) => {
    onAnalysisComplete(analysis, true);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl -z-10"></div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-primary/30 to-accent/30 p-4 rounded-full border border-primary/50 backdrop-blur-sm">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="ml-6 text-left">
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'} font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2`}>
                Polygon.io Analysis
              </h1>
              <p className="text-accent text-base font-semibold">
                Real-time Market Data × Gemini AI Intelligence
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <p className={`text-muted-foreground ${isMobile ? 'text-sm px-2' : 'text-lg'} leading-relaxed mb-4`}>
            Harness the power of <span className="text-primary font-semibold">Polygon.io's real-time market data</span> combined with 
            <span className="text-accent font-semibold"> Google's Gemini 1.5 Flash AI</span> for comprehensive multi-timeframe analysis.
          </p>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'} mt-6`}>
            <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-3">
              <div className="text-primary font-semibold text-sm">Live Data</div>
              <div className="text-xs text-muted-foreground">Polygon.io API</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-accent/20 rounded-lg p-3">
              <div className="text-accent font-semibold text-sm">AI Analysis</div>
              <div className="text-xs text-muted-foreground">Gemini 1.5 Flash</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-3">
              <div className="text-primary font-semibold text-sm">Multi-Timeframe</div>
              <div className="text-xs text-muted-foreground">M15, H1, H4, D1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Card */}
      <Card className="relative bg-gradient-to-br from-card/95 to-card/80 border border-primary/20 shadow-2xl hover:border-primary/40 transition-all duration-500 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg"></div>
        <CardContent className={`relative ${isMobile ? 'p-4' : 'p-8'}`}>
          <DeepHistoricalAnalysis onAnalysisComplete={handleDeepAnalysisComplete} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisMenu;
