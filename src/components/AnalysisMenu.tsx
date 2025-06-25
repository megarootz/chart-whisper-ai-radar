
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain } from 'lucide-react';
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
        <div className="flex items-center justify-center mb-3">
          <div className="bg-primary/10 p-3 rounded-full mr-3">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-white`}>
            Deep Historical Analysis
          </h1>
        </div>
        <p className={`text-gray-400 ${isMobile ? 'text-sm px-2' : 'text-base'} max-w-3xl mx-auto leading-relaxed`}>
          Analyze historical forex data using advanced AI techniques for comprehensive market insights.
        </p>
      </div>

      {/* Analysis Card */}
      <Card className="bg-chart-card border-gray-800 shadow-lg">
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <DeepHistoricalAnalysis onAnalysisComplete={handleDeepAnalysisComplete} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisMenu;
