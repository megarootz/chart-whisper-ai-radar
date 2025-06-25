
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
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Deep Historical Analysis</h2>
        </div>
        <p className="text-gray-400 text-sm">
          Analyze historical forex data using advanced AI techniques
        </p>
      </div>
      
      <DeepHistoricalAnalysis onAnalysisComplete={handleDeepAnalysisComplete} />
    </div>
  );
};

export default AnalysisMenu;
