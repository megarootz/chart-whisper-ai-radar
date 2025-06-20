
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, TrendingUp } from 'lucide-react';
import ChartUploader from './ChartUploader';
import IcebergAnimation from './IcebergAnimation';

interface AnalysisMenuProps {
  onChartUpload: (file: File) => void;
}

const AnalysisMenu = ({ onChartUpload }: AnalysisMenuProps) => {
  const [activeTab, setActiveTab] = useState('chart-analysis');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <IcebergAnimation />
            
            <div className="mt-8">
              <div 
                id="dukascopy-widget-container"
                className="w-full rounded-lg overflow-hidden border border-gray-700"
                style={{ minHeight: '550px' }}
              >
                <script 
                  type="text/javascript"
                  dangerouslySetInnerHTML={{
                    __html: `
                      DukascopyApplet = {
                        "type": "historical_data_feed",
                        "params": {
                          "header": false,
                          "availableInstruments": "l:",
                          "width": "100%",
                          "height": "550",
                          "adv": "popup"
                        }
                      };
                    `
                  }}
                />
                <script 
                  type="text/javascript" 
                  src="https://freeserv-static.dukascopy.com/2.0/core.js"
                  async
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisMenu;
