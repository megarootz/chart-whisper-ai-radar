
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Redirect authenticated users to analyze page immediately
  useEffect(() => {
    if (user) {
      navigate('/analyze');
    }
  }, [user, navigate]);

  return (
    <div className={`flex flex-col min-h-screen bg-chart-bg ${isMobile ? 'pb-24' : ''}`}>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              AI-Powered Deep Historical Analysis
            </h1>
            <p className="text-chart-text text-lg max-w-3xl mx-auto">
              Analyze historical forex data using advanced AI techniques for comprehensive market insights.
            </p>
          </div>
          
          <div className="text-center py-6">
            <p className="text-white text-lg mb-4">
              Please sign in to access Deep Historical Analysis
            </p>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium"
            >
              Sign In to Analyze
            </button>
          </div>
        </div>
      </main>
      {!isMobile && <Footer />}
    </div>
  );
};

export default Index;
