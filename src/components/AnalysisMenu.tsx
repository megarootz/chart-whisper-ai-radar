
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Brain } from 'lucide-react';
import ChartUploader from './ChartUploader';
import DeepHistoricalAnalysis from './DeepHistoricalAnalysis';

interface AnalysisMenuProps {
  onAnalysisComplete: (analysis: any, isDeepAnalysis?: boolean) => void;
}

const AnalysisMenu: React.FC<AnalysisMenuProps> = ({ onAnalysisComplete }) => {
  const [activeTab, setActiveTab] = useState("chart");

  const handleChartAnalysisComplete = (analysis: any) => {
    onAnalysisComplete(analysis, false);
  };

  const handleDeepAnalysisComplete = (analysis: any) => {
    onAnalysisComplete(analysis, true);
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700">
          <TabsTrigger 
            value="chart" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Chart Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="deep" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300 flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Deep Historical Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="mt-6">
          <ChartUploader onAnalysisComplete={handleChartAnalysisComplete} />
        </TabsContent>
        
        <TabsContent value="deep" className="mt-6">
          <DeepHistoricalAnalysis onAnalysisComplete={handleDeepAnalysisComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisMenu;
