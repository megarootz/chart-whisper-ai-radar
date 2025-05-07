
import React, { useState } from 'react';
import { ArrowLeft, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';

interface AnalysisHistoryItem {
  id: string;
  pairName: string;
  timeframe: string;
  date: string;
  sentiment: string;
  description: string;
}

const HistoryPage = () => {
  const [dateFilter, setDateFilter] = useState('all');
  
  // Mock data for demonstration
  const analysisHistory: AnalysisHistoryItem[] = [
    {
      id: '1',
      pairName: 'XAU/USD (Gold)',
      timeframe: '1H',
      date: '5/8/2025, 6:32:46 AM',
      sentiment: 'Bullish',
      description: 'The 1H chart shows a recent pullback in Gold after a strong upward move, consolidating around the $3360-$3380 level. This could be a temporary retracement within a broader uptrend.'
    }
  ];

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Analysis History</h1>
            <p className="text-gray-400">Review and manage your previous chart analyses</p>
          </div>
          
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Filter by date:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-chart-card border border-gray-700 rounded text-white text-sm py-2 px-3"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>
            
            <div className="text-gray-400 text-sm">
              Showing {analysisHistory.length} of {analysisHistory.length} analyses
            </div>
          </div>
          
          <div className="space-y-4">
            {analysisHistory.map((analysis) => (
              <div key={analysis.id} className="bg-chart-card border border-gray-700 rounded-lg overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-medium text-lg mb-1">{analysis.pairName}</h3>
                      <div className="flex items-center text-gray-400 text-sm">
                        <span className="mr-2">{analysis.sentiment}</span>
                        <span className="mr-2">•</span>
                        <span className="mr-2">{analysis.timeframe}</span>
                        <span className="mr-2">•</span>
                        <span>{analysis.date}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                      analysis.sentiment === 'Bullish' ? 'bg-green-900 text-green-400' : 
                      analysis.sentiment === 'Bearish' ? 'bg-red-900 text-red-400' : 
                      'bg-yellow-900 text-yellow-400'
                    }`}>
                      {analysis.sentiment}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4">{analysis.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <Link to={`/analysis/${analysis.id}`} className="text-primary hover:underline text-sm">
                      View Details
                    </Link>
                    
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-white">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white">
                        <Share className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HistoryPage;
