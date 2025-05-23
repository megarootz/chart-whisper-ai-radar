
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { AnalysisResultData } from '@/components/AnalysisResult';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAnalysis } from '@/contexts/AnalysisContext';

// Update the interface for the history items to include timestamp and date
interface HistoryAnalysisData extends AnalysisResultData {
  id?: string;
  created_at?: string;
}

const HistoryPage = () => {
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const { analysisHistory, refreshHistory } = useAnalysis();
  
  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadHistory = async () => {
    setIsLoading(true);
    await refreshHistory();
    setIsLoading(false);
  };

  // Filter the history based on date selection
  const filteredHistory = React.useMemo(() => {
    if (dateFilter === 'all') return analysisHistory;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = today - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
    
    return analysisHistory.filter(item => {
      // Use timestamp or created_at property
      const itemDate = new Date(item.created_at || Date.now()).getTime();
      
      if (dateFilter === 'today') return itemDate >= today;
      if (dateFilter === 'week') return itemDate >= weekAgo;
      if (dateFilter === 'month') return itemDate >= monthAgo;
      
      return true;
    });
  }, [analysisHistory, dateFilter]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow ${isMobile ? 'py-4 px-3 pb-24' : 'py-8 px-6'}`}>
        <div className={`${isMobile ? 'max-w-full' : 'container mx-auto max-w-6xl'}`}>
          <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>Analysis History</h1>
            <p className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>Review and manage your previous chart analyses</p>
          </div>
          
          <div className={`${isMobile ? 'mb-4' : 'mb-8'} flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
            <div className="flex items-center space-x-2">
              <span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Filter by date:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`bg-chart-card border border-gray-700 rounded text-white ${isMobile ? 'text-xs py-1.5 px-2' : 'text-sm py-2 px-3'}`}
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>
            
            <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              Showing {filteredHistory.length} of {analysisHistory.length} analyses
            </div>
          </div>
          
          {isLoading ? (
            <div className={`flex justify-center items-center ${isMobile ? 'py-8' : 'py-12'}`}>
              <Loader2 className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} animate-spin text-primary`} />
              <span className={`ml-2 text-gray-400 ${isMobile ? 'text-sm' : ''}`}>Loading your analysis history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
              <p className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>No analysis history found. Start by analyzing a chart!</p>
              <Button asChild className={`${isMobile ? 'mt-3 text-sm' : 'mt-4'}`}>
                <Link to="/analyze">Analyze a Chart</Link>
              </Button>
            </div>
          ) : (
            <div className={`space-y-${isMobile ? '3' : '4'}`}>
              {filteredHistory.map((analysis, index) => (
                <div key={analysis.id || index} className="bg-chart-card border border-gray-700 rounded-lg overflow-hidden">
                  <div className={`${isMobile ? 'p-3' : 'p-5'}`}>
                    <div className={`flex justify-between items-start ${isMobile ? 'mb-3' : 'mb-4'}`}>
                      <div>
                        <h3 className={`text-white font-medium ${isMobile ? 'text-base mb-1' : 'text-lg mb-1'}`}>
                          {analysis.pairName || "Unknown Pair"}
                          {analysis.timeframe && (
                            <span className={`text-primary ml-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              {analysis.timeframe}
                            </span>
                          )}
                        </h3>
                        <div className={`flex flex-wrap items-center text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <span className="mr-2">{analysis.overallSentiment}</span>
                          <span className="mr-2">•</span>
                          <span>{formatDate(analysis.created_at)}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                        analysis.overallSentiment?.toLowerCase().includes('bullish') ? 'bg-green-900 text-green-400' : 
                        analysis.overallSentiment?.toLowerCase().includes('bearish') ? 'bg-red-900 text-red-400' : 
                        'bg-yellow-900 text-yellow-400'
                      }`}>
                        {analysis.overallSentiment}
                      </div>
                    </div>
                    
                    <p className={`text-gray-400 ${isMobile ? 'text-xs mb-3' : 'text-sm mb-4'}`}>{analysis.marketAnalysis}</p>
                    
                    <div className="flex justify-start items-center">
                      <Link to={`/analysis/${analysis.id}`} className={`text-primary hover:underline ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default HistoryPage;
