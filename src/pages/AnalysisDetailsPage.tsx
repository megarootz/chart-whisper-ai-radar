
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

const AnalysisDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
        
        // Double-check and ensure pair name has the right format
        if (analysisData.pairName) {
          // Make sure pair is properly formatted if it's a standard 6-character pair
          if (analysisData.pairName.length === 6 && !analysisData.pairName.includes('/') && 
              /^[A-Z]+$/.test(analysisData.pairName)) {
            analysisData.pairName = `${analysisData.pairName.substring(0, 3)}/${analysisData.pairName.substring(3, 6)}`;
          }
          
          // Ensure proper capitalization
          analysisData.pairName = analysisData.pairName.toUpperCase();
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
        <main className="flex-grow py-8 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-12">
              <p className="text-gray-400">Loading analysis details...</p>
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
        <main className="flex-grow py-8 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-12">
              <p className="text-gray-400">Analysis not found or you don't have permission to view it.</p>
              <Button asChild className="mt-4">
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
      
      <main className={`flex-grow py-8 px-6 ${isMobile ? 'pb-24' : ''}`}>
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="text-white hover:text-primary mb-4"
              onClick={() => navigate('/history')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
            
            <h1 className="text-2xl font-bold text-white mb-2">Analysis Details</h1>
            {analysis && (
              <div className="flex items-center">
                <span className="text-primary text-xl font-semibold mr-2">
                  {analysis.pairName}
                </span>
                {analysis.timeframe && (
                  <span className="text-gray-400">
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
