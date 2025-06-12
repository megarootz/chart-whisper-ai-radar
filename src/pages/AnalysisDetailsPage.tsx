import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AnalysisResult, { AnalysisResultData } from '@/components/AnalysisResult';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatTradingPair } from '@/utils/tradingPairUtils';

const AnalysisDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Extract trading pair and timeframe from analysis text
  const extractTradingInfo = (analysisText: string) => {
    // Look for patterns like "Technical Chart Analysis Report (GOLD/USD - 1 Hour)" or "Gold Spot / U.S. Dollar - 1 Hour"
    const titleMatch = analysisText.match(/Technical Chart Analysis Report.*?\((.*?)\)/i) ||
                      analysisText.match(/📊\s*Technical Chart Analysis Report.*?\((.*?)\)/i);
    
    if (titleMatch) {
      const titleContent = titleMatch[1];
      // Extract pair and timeframe
      const parts = titleContent.split(/\s*[–-]\s*/);
      if (parts.length >= 2) {
        return {
          pair: parts[0].trim(),
          timeframe: parts[1].trim()
        };
      } else {
        return {
          pair: titleContent.trim(),
          timeframe: 'Unknown Timeframe'
        };
      }
    }

    // Fallback: look for other patterns
    const pairMatch = analysisText.match(/(?:Gold|XAU|EUR|USD|GBP|JPY|CHF|CAD|AUD|NZD|BTC|ETH)[\/\s]*(?:USD|EUR|JPY|GBP|CHF|CAD|AUD|NZD|USDT)/gi);
    const timeframeMatch = analysisText.match(/(?:1|4|15|30)\s*(?:Hour|Minute|Min|H|M)|Daily|Weekly|Monthly/gi);
    
    return {
      pair: pairMatch ? pairMatch[0] : 'Unknown Pair',
      timeframe: timeframeMatch ? timeframeMatch[0] : 'Unknown Timeframe'
    };
  };
  
  useEffect(() => {
    if (user && id) {
      fetchAnalysisDetails(id);
    } else {
      setIsLoading(false);
    }
  }, [id, user]);
  
  const fetchAnalysisDetails = async (analysisId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('chart_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
      
      if (error) {
        console.error("Error fetching analysis details:", error);
        toast({
          title: "Error",
          description: "Failed to load analysis details",
          variant: "destructive",
        });
        return;
      }
      
      if (data && data.analysis_data) {
        // Properly cast the JSON data to AnalysisResultData
        const analysisData = data.analysis_data as unknown as AnalysisResultData;
        
        // Extract trading pair info from the analysis text if not already present
        if (!analysisData.pairName || analysisData.pairName === 'Unknown Pair') {
          const extractedInfo = extractTradingInfo(analysisData.marketAnalysis || '');
          analysisData.pairName = formatTradingPair(extractedInfo.pair);
          if (!analysisData.timeframe) {
            analysisData.timeframe = extractedInfo.timeframe;
          }
        } else {
          // Format the existing pair name
          analysisData.pairName = formatTradingPair(analysisData.pairName);
        }
        
        setAnalysis(analysisData);
      } else {
        console.error("Analysis not found");
        toast({
          title: "Not Found",
          description: "The requested analysis could not be found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in fetchAnalysisDetails:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-chart-bg flex flex-col">
        <Header />
        <main className={`flex-grow pt-20 ${isMobile ? 'px-3' : 'py-8 px-6'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
          <div className={`${isMobile ? 'max-w-full' : 'container mx-auto max-w-6xl'}`}>
            <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
              <p className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>Loading analysis details...</p>
            </div>
          </div>
        </main>
        {!isMobile && <Footer />}
      </div>
    );
  }
  
  if (!analysis) {
    return (
      <div className="min-h-screen bg-chart-bg flex flex-col">
        <Header />
        <main className={`flex-grow pt-20 ${isMobile ? 'px-3' : 'py-8 px-6'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
          <div className={`${isMobile ? 'max-w-full' : 'container mx-auto max-w-6xl'}`}>
            <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
              <p className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>Analysis not found or you don't have permission to view it.</p>
              <Button asChild className={`${isMobile ? 'mt-3 text-sm' : 'mt-4'}`}>
                <Link to="/history">Back to History</Link>
              </Button>
            </div>
          </div>
        </main>
        {!isMobile && <Footer />}
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow pt-20 ${isMobile ? 'px-3 pb-24' : 'py-8 px-6'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
        <div className={`${isMobile ? 'max-w-full' : 'container mx-auto max-w-6xl'}`}>
          <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
            <Button 
              variant="ghost" 
              className={`text-white hover:text-primary ${isMobile ? 'mb-3 text-sm' : 'mb-4'}`}
              onClick={() => navigate('/history')}
            >
              <ArrowLeft className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              Back to History
            </Button>
            
            <h1 
              className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white ${isMobile ? 'mb-1' : 'mb-2'}`}
              style={{ color: '#ffffff', fontWeight: 'bold', fontSize: isMobile ? '1.25rem' : '1.5rem' }}
            >
              Analysis Details
            </h1>
            {analysis && (
              <div className="flex items-center">
                <span className={`text-primary ${isMobile ? 'text-lg' : 'text-xl'} font-semibold mr-2`}>
                  {analysis.pairName}
                </span>
                {analysis.timeframe && (
                  <span className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>
                    {analysis.timeframe} Timeframe
                  </span>
                )}
              </div>
            )}
          </div>
          
          {analysis && (
            <div>
              <AnalysisResult data={analysis} />
            </div>
          )}
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default AnalysisDetailsPage;
