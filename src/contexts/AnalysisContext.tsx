
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResultData } from '@/components/AnalysisResult';

interface AnalysisContextType {
  latestAnalysis: AnalysisResultData | null;
  analysisHistory: HistoryAnalysisItem[];
  setLatestAnalysis: (analysis: AnalysisResultData | null) => void;
  addToHistory: (item: HistoryAnalysisItem) => void;
  refreshHistory: () => Promise<void>;
}

export interface HistoryAnalysisItem {
  id?: string;
  created_at?: string;
  pairName: string;
  timeframe: string;
  overallSentiment: string;
  marketAnalysis?: string;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResultData | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<HistoryAnalysisItem[]>([]);

  const addToHistory = (item: HistoryAnalysisItem) => {
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
      
      const processedData = data.map(item => ({
        ...item.analysis_data as unknown as AnalysisResultData,
        id: item.id,
        created_at: item.created_at
      }));
      
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
