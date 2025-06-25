
import React from 'react';
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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Deep Historical Analysis</h2>
        <p className="text-gray-400 text-sm">
          Analyze historical forex data using advanced AI techniques for comprehensive market insights.
        </p>
      </div>
      <DeepHistoricalAnalysis onAnalysisComplete={handleDeepAnalysisComplete} />
    </div>
  );
};

export default AnalysisMenu;
