
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share, ChevronDown, ChevronUp, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { AnalysisResultData } from '@/components/AnalysisResult';

const AnalysisDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisResultData | null>(null);
  const [isTechnicalOpen, setIsTechnicalOpen] = useState(true);
  const [isActionPlanOpen, setIsActionPlanOpen] = useState(true);
  
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
  }, [id, navigate]);

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-chart-bg flex flex-col">
        <Header />
        <main className="flex-grow py-8 px-6 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="mb-4">Loading analysis data...</p>
            <Link to="/history" className="text-primary hover:underline">
              Return to history
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Helper function to determine sentiment color
  const getSentimentColor = (sentiment: string | undefined): string => {
    if (!sentiment) return 'text-yellow-400';
    if (sentiment.toLowerCase().includes('bullish')) return 'text-green-400';
    if (sentiment.toLowerCase().includes('bearish')) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentBgColor = (sentiment: string | undefined): string => {
    if (!sentiment) return 'bg-yellow-900/30';
    if (sentiment.toLowerCase().includes('bullish')) return 'bg-green-900/30';
    if (sentiment.toLowerCase().includes('bearish')) return 'bg-red-900/30';
    return 'bg-yellow-900/30';
  };

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Navigation and Actions */}
          <div className="flex justify-between items-center mb-6">
            <Link to="/history" className="text-white hover:text-primary flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            
            <h1 className="text-xl font-bold text-white">Analysis Details</h1>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Share className="h-4 w-4 mr-1" /> Share
              </Button>
            </div>
          </div>
          
          {/* Analysis Header */}
          <div className="bg-chart-card border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{analysisData.pairName}</h2>
                <div className="flex items-center text-gray-400 text-sm">
                  <span className="mr-2">{analysisData.timeframe} Timeframe</span>
                  <span className="mr-2">•</span>
                  <span>Analyzed {analysisData.timestamp || new Date().toLocaleString()}</span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full ${getSentimentBgColor(analysisData.overallSentiment)} ${getSentimentColor(analysisData.overallSentiment)} font-medium`}>
                {analysisData.overallSentiment} ({analysisData.confidenceScore}% Confidence)
              </div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <div className="bg-chart-card h-8 w-8 rounded-full flex items-center justify-center mr-2">
                  <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="8" width="4" height="12" rx="1" fill="currentColor" />
                    <rect x="10" y="4" width="4" height="16" rx="1" fill="currentColor" />
                    <rect x="17" y="12" width="4" height="8" rx="1" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">Market Analysis</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {analysisData.marketAnalysis}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${getSentimentColor(analysisData.trendDirection)}`}></div>
                    <span className="text-white">Trend Direction</span>
                  </div>
                  <span className={getSentimentColor(analysisData.trendDirection)}>
                    {analysisData.trendDirection?.charAt(0).toUpperCase() + analysisData.trendDirection?.slice(1)}
                  </span>
                </div>
                <div className="text-gray-400 text-sm">
                  <div className="mb-2">
                    <span className="block text-white text-xs mb-1">Signal Strength</span>
                    <Progress value={analysisData.confidenceScore} className="h-2 bg-gray-700" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Weak</span>
                    <span className="text-white font-medium">{analysisData.confidenceScore}%</span>
                    <span>Strong</span>
                  </div>
                </div>
              </div>
              
              {analysisData.tradingInsight && (
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Trading Insight</h4>
                  <p className="text-gray-400 text-sm">
                    {analysisData.tradingInsight}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Technical Analysis */}
          <div className="bg-chart-card border border-gray-700 rounded-lg overflow-hidden mb-6">
            <div 
              className="p-6 flex justify-between items-center cursor-pointer"
              onClick={() => setIsTechnicalOpen(!isTechnicalOpen)}
            >
              <div className="flex items-center">
                <div className="bg-blue-900/30 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 16L10.879 13.121M10.879 13.121L13.758 10.242M10.879 13.121L4.121 6.364M16 8L13.121 10.879M13.121 10.879L10.242 13.758M13.121 10.879L19.879 17.636" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-white">Technical Analysis</h2>
              </div>
              {isTechnicalOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </div>
            
            {isTechnicalOpen && (
              <div className="border-t border-gray-700 p-6">
                {/* Chart Patterns */}
                {analysisData.chartPatterns && analysisData.chartPatterns.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-white font-medium mb-4 flex items-center">
                      Chart Patterns
                      <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                        {analysisData.chartPatterns.length} detected
                      </span>
                    </h3>
                    
                    <div className="space-y-3">
                      {analysisData.chartPatterns.map((pattern, index) => (
                        <div 
                          key={index} 
                          className="bg-chart-bg border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div className={`h-6 w-6 flex items-center justify-center rounded-full mr-2 ${getSentimentColor(pattern.signal)}`}>
                              <Circle className="h-3 w-3 fill-current" />
                            </div>
                            <span className="text-white">
                              {pattern.name}
                              {pattern.status === 'forming' && (
                                <span className="ml-2 text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">
                                  Forming
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2">{pattern.confidence}%</span>
                            <span className={getSentimentColor(pattern.signal)}>
                              {pattern.signal.charAt(0).toUpperCase() + pattern.signal.slice(1)} signal
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Key Price Levels */}
                {analysisData.priceLevels && analysisData.priceLevels.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-4">Key Price Levels</h3>
                    
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-chart-bg">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Price Level
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Distance from Current
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-chart-bg divide-y divide-gray-700">
                          {analysisData.priceLevels.map((level, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`h-2 w-2 rounded-full mr-2 ${
                                    level.name.toLowerCase().includes('resist') ? 'bg-red-400' : 
                                    'bg-green-400'
                                  }`}></div>
                                  <span className="text-white font-medium">{level.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-white">
                                {level.price}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <svg className={`h-4 w-4 mr-1 ${level.direction === 'up' ? 'text-red-400' : 'text-green-400'}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {level.direction === 'up' ? (
                                      <path d="M10 3L16 9H4L10 3Z" fill="currentColor" />
                                    ) : (
                                      <path d="M10 17L16 11H4L10 17Z" fill="currentColor" />
                                    )}
                                  </svg>
                                  <span className={level.direction === 'up' ? 'text-red-400' : 'text-green-400'}>
                                    {level.distance}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Trading Action Plan */}
          {analysisData.tradingSetup && (
            <div className="bg-chart-card border border-gray-700 rounded-lg overflow-hidden">
              <div 
                className="p-6 flex justify-between items-center cursor-pointer"
                onClick={() => setIsActionPlanOpen(!isActionPlanOpen)}
              >
                <div className="flex items-center">
                  <div className={`${
                    analysisData.tradingSetup.type === 'long' ? 'bg-green-900/30' : 
                    analysisData.tradingSetup.type === 'short' ? 'bg-red-900/30' : 
                    'bg-yellow-900/30'} h-8 w-8 rounded-full flex items-center justify-center mr-3`}>
                    <svg className={`h-4 w-4 ${
                      analysisData.tradingSetup.type === 'long' ? 'text-green-400' : 
                      analysisData.tradingSetup.type === 'short' ? 'text-red-400' : 
                      'text-yellow-400'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="text-lg font-medium text-white">Trading Action Plan</h2>
                </div>
                {isActionPlanOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </div>
              
              {isActionPlanOpen && (
                <div className="border-t border-gray-700 p-6">
                  {/* Entry Strategies */}
                  <div className="mb-6">
                    <h3 className={`${
                      analysisData.tradingSetup.type === 'long' ? 'text-green-400' : 
                      analysisData.tradingSetup.type === 'short' ? 'text-red-400' : 
                      'text-yellow-400'} font-medium mb-4 flex items-center`}>
                      <Circle className="h-4 w-4 fill-current mr-2" />
                      Entry Strategy
                    </h3>
                    
                    <div className="bg-chart-bg border border-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-start mb-2">
                        <span className={`${
                          analysisData.tradingSetup.type === 'long' ? 'bg-green-900 text-green-400' : 
                          analysisData.tradingSetup.type === 'short' ? 'bg-red-900 text-red-400' : 
                          'bg-yellow-900 text-yellow-400'} h-6 w-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0`}>
                          {analysisData.tradingSetup.type === 'long' ? 'L' : analysisData.tradingSetup.type === 'short' ? 'S' : 'N'}
                        </span>
                        <div>
                          <div className="text-white font-medium">
                            {analysisData.tradingSetup.type.charAt(0).toUpperCase() + analysisData.tradingSetup.type.slice(1)} position
                            {analysisData.tradingSetup.entryPrice && (
                              <span className={`${
                                analysisData.tradingSetup.type === 'long' ? 'text-green-400' : 
                                analysisData.tradingSetup.type === 'short' ? 'text-red-400' : 
                                'text-yellow-400'}`}> @ {analysisData.tradingSetup.entryPrice}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            {analysisData.tradingSetup.description}
                          </p>
                          {analysisData.tradingSetup.entryTrigger && (
                            <div className="mt-2 p-2 bg-gray-800/40 rounded border border-gray-700">
                              <p className="text-sm text-white">Entry Trigger: {analysisData.tradingSetup.entryTrigger}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Exit & Risk Management */}
                  <div>
                    <h3 className="text-red-400 font-medium mb-4 flex items-center">
                      <Circle className="h-4 w-4 fill-current mr-2" />
                      Exit & Risk Management
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analysisData.tradingSetup.stopLoss && (
                        <div className="bg-chart-bg border border-gray-700 rounded-lg p-4">
                          <h4 className="text-red-400 text-sm mb-2">Stop Loss</h4>
                          <p className="text-white font-medium">{analysisData.tradingSetup.stopLoss}</p>
                        </div>
                      )}
                      
                      {analysisData.tradingSetup.takeProfits && analysisData.tradingSetup.takeProfits.length > 0 && (
                        analysisData.tradingSetup.takeProfits.map((tp, idx) => (
                          <div key={idx} className="bg-chart-bg border border-gray-700 rounded-lg p-4">
                            <h4 className="text-green-400 text-sm mb-2">Take Profit {idx + 1}</h4>
                            <p className="text-white font-medium">{tp}</p>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {analysisData.tradingSetup.riskRewardRatio && (
                      <div className="mt-4 bg-chart-bg border border-gray-700 rounded-lg p-4">
                        <h4 className="text-white text-sm mb-2">Risk/Reward Ratio</h4>
                        <p className="text-white font-medium">{analysisData.tradingSetup.riskRewardRatio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AnalysisDetailsPage;
