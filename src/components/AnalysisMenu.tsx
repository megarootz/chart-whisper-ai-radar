
import React from 'react';
import { Brain } from 'lucide-react';
import DeepHistoricalAnalysis from './DeepHistoricalAnalysis';

interface AnalysisMenuProps {
  onAnalysisComplete: (analysis: any, isDeepAnalysis?: boolean) => void;
}

const AnalysisMenu: React.FC<AnalysisMenuProps> = ({ onAnalysisComplete }) => {
  const handleDeepAnalysisComplete = (analysis: any) => {
    onAnalysisComplete(analysis, true);
  };

  return (
    <div className="w-full">
      <DeepHistoricalAnalysis onAnalysisComplete={handleDeepAnalysisComplete} />
    </div>
  );
};

export default AnalysisMenu;
