
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AnalysisResult, { AnalysisResultData } from '@/components/AnalysisResult';

const AnalysisDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load analysis history from localStorage
    const storedHistory = localStorage.getItem('chartAnalysisHistory');
    
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        
        // Get the specific analysis by index
        const index = id ? parseInt(id) : 0;
        
        if (history[index]) {
          setAnalysisData(history[index]);
        } else {
          console.error("Analysis not found for index:", index);
          // Redirect to history page if analysis not found
          navigate('/history');
        }
      } catch (error) {
        console.error("Error loading analysis details:", error);
        // Redirect to history page on error
        navigate('/history');
      }
    } else {
      console.error("No analysis history found");
      // Redirect to history page if no history exists
      navigate('/history');
    }
    setIsLoading(false);
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Navigation */}
          <div className="flex items-center mb-6">
            <Link to="/history" className="text-white hover:text-primary flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to History
            </Link>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading analysis data...</p>
            </div>
          ) : analysisData ? (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Analysis Details</h1>
              <AnalysisResult data={analysisData} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">Analysis not found</p>
              <Button asChild>
                <Link to="/history">Return to History</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AnalysisDetailsPage;
