import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, TrendingUp } from 'lucide-react';
import ChartUploader from './ChartUploader';
import IcebergPopupAnimation from './IcebergPopupAnimation';
import DukascopyWidget from './DukascopyWidget';
import HistoricalDataDownloader from './HistoricalDataDownloader';

interface AnalysisMenuProps {
  onChartUpload: (file: File) => void;
}

const AnalysisMenu = ({ onChartUpload }: AnalysisMenuProps) => {
  const [activeTab, setActiveTab] = useState('chart-analysis');
  const [showIcebergPopup, setShowIcebergPopup] = useState(false);
  const [showHistoricalContent, setShowHistoricalContent] = useState(false);

  const handleTabChange = (value: string) => {
    if (value === 'historical-data' && activeTab !== 'historical-data') {
      // Show popup animation when switching to historical data
      setShowIcebergPopup(true);
      setShowHistoricalContent(false);
    } else {
      setActiveTab(value);
      setShowHistoricalContent(value === 'historical-data');
    }
  };

  const handlePopupComplete = () => {
    setShowIcebergPopup(false);
    setActiveTab('historical-data');
    setShowHistoricalContent(true);
  };

  return (
    <div className="w-full">
      <IcebergPopupAnimation 
        isVisible={showIcebergPopup} 
        onComplete={handlePopupComplete}
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800 border border-gray-700">
          <TabsTrigger 
            value="chart-analysis" 
            className="flex items-center gap-2 text-white data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Camera size={18} />
            Chart Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="historical-data" 
            className="flex items-center gap-2 text-white data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <TrendingUp size={18} />
            Historical Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart-analysis" className="space-y-6">
          <div className="bg-chart-card border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">AI Chart Analysis</h2>
            <p className="text-gray-400 mb-6">
              Upload a chart screenshot for instant AI-powered technical analysis
            </p>
            <ChartUploader onUpload={onChartUpload} />
          </div>
        </TabsContent>

        <TabsContent value="historical-data" className="space-y-6">
          <div className="bg-chart-card border border-gray-700 rounded-lg p-6">
            {showHistoricalContent ? (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Deep Historical Analysis</h2>
                  <p className="text-gray-400">
                    Diving deep into historical market data to uncover patterns and insights hidden beneath the surface
                  </p>
                </div>
                <HistoricalDataDownloader />
                <DukascopyWidget />
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Preparing Historical Data...</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisMenu;
