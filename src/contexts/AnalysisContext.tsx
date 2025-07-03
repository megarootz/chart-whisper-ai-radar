
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResultData } from '@/components/AnalysisResult';

interface AnalysisContextType {
  latestAnalysis: AnalysisResultData | null;
  analysisHistory: AnalysisResultData[];
  setLatestAnalysis: (analysis: AnalysisResultData | null) => void;
  addToHistory: (item: AnalysisResultData) => void;
  refreshHistory: () => Promise<void>;
}

// Use AnalysisResultData directly as the history item type
export interface HistoryAnalysisItem extends AnalysisResultData {
  id?: string;
  created_at?: string;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResultData | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResultData[]>([]);

  const addToHistory = (item: AnalysisResultData) => {
    setAnalysisHistory(prev => [item, ...prev]);
  };

  const refreshHistory = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('chart_analyses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching analysis history:", error);
        return;
      }
      
      const processedData: AnalysisResultData[] = data.map(item => {
        const analysisData = item.analysis_data as any;
        
        // Handle both regular analysis and deep analysis
        return {
          id: item.id,
          created_at: item.created_at,
          pairName: analysisData.pairName || item.pair_name || 'Unknown Pair',
          timeframe: analysisData.timeframe || item.timeframe || 'Unknown Timeframe',
          overallSentiment: analysisData.overallSentiment || analysisData.analysis_type || 'Analysis',
          confidenceScore: analysisData.confidenceScore || 90,
          marketAnalysis: analysisData.marketAnalysis || analysisData.analysis || '',
          trendDirection: analysisData.trendDirection || 'analyzed',
          marketFactors: analysisData.marketFactors || [],
          chartPatterns: analysisData.chartPatterns || [],
          priceLevels: analysisData.priceLevels || [],
          tradingInsight: analysisData.tradingInsight || analysisData.analysis || '',
          current_price: analysisData.current_price,
          current_price_timestamp: analysisData.current_price_timestamp,
          has_current_price: analysisData.has_current_price || false,
          data_points: analysisData.data_points,
          date_range: analysisData.date_range,
          truncated: analysisData.truncated || false
        };
      });
      
      setAnalysisHistory(processedData);
    } catch (error) {
      console.error("Error refreshing history:", error);
    }
  };

  return (
    <AnalysisContext.Provider 
      value={{ 
        latestAnalysis, 
        analysisHistory, 
        setLatestAnalysis, 
        addToHistory,
        refreshHistory
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
