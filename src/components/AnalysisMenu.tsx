
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
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-full shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="ml-6">
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'} font-bold text-foreground mb-2`}>
              Market Analysis
            </h1>
            <p className="text-muted-foreground text-base">
              Advanced AI-powered market analysis
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Card */}
      <Card className="bg-card border border-border shadow-lg">
        <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
          <DeepHistoricalAnalysis onAnalysisComplete={handleDeepAnalysisComplete} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisMenu;
