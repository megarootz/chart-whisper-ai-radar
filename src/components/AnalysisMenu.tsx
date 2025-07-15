
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
      <div className={`text-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 rounded-full mr-4 border border-purple-500/30">
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
          <div className="text-left">
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-white mb-1`}>
              Deep Historical Analysis
            </h1>
            <p className="text-purple-400 text-sm font-medium">
              AI-Powered Multi-Timeframe Market Intelligence
            </p>
          </div>
        </div>
        <p className={`text-gray-400 ${isMobile ? 'text-sm px-2' : 'text-base'} max-w-3xl mx-auto leading-relaxed`}>
          Analyze historical forex data using advanced AI techniques across multiple timeframes 
          for comprehensive market insights and trading opportunities.
        </p>
      </div>

      {/* Analysis Card */}
      <Card className="bg-chart-card border-gray-800 shadow-lg hover:border-purple-500/30 transition-all duration-300">
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <DeepHistoricalAnalysis onAnalysisComplete={handleDeepAnalysisComplete} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisMenu;
