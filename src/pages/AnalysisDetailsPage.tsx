
import React from 'react';
import { ArrowLeft, Download, Share, ChevronDown, ChevronUp, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useParams } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

const AnalysisDetailsPage = () => {
  const { id } = useParams();

  // Mock data for demonstration
  const analysis = {
    pairName: 'XAU/USD (Gold)',
    timeframe: '1H',
    date: '5/8/2025, 6:32:46 AM',
    sentiment: 'Bullish',
    confidenceScore: 85,
    marketAnalysis: `The 1H chart shows a recent pullback in Gold after a strong upward move, consolidating around the $3360-$3380 level. This could be a temporary retracement within a broader uptrend. Key support is found near $3340, while the $3400 level represents immediate resistance. We are likely seeing a period of consolidation before a potential further move higher. The trading recommendation is to buy Gold near support levels, targeting higher highs. However, it is crucial to place stop-loss orders below recent support to manage risk. If the price breaks significantly below the $3340 level, the bulls has might be invalidated. Technical price targets are set at $3400 and $3420. Multi-timeframe analysis shows a bullish alignment across multiple timeframes, further supporting the long position. However, traders should monitor the US Dollar Index and interest rate expectations which can significantly impact Gold prices. Fundamentals currently favor a mildly bullish outlook for gold, despite increased interest rates.`,
    trendDirection: 'bullish',
    chartPatterns: [
      {
        name: 'Consolidation',
        confidence: 70,
        signal: 'neutral'
      },
      {
        name: 'Potential Bullish Flag',
        confidence: 60,
        signal: 'bullish'
      }
    ],
    priceLevels: [
      {
        name: 'R3',
        price: '$3450.00',
        distance: '2.55%',
        direction: 'up'
      },
      {
        name: 'R2',
        price: '$3420.00',
        distance: '1.66%',
        direction: 'up'
      },
      {
        name: 'R1',
        price: '$3400.00',
        distance: '1.07%',
        direction: 'up'
      },
      {
        name: 'Current Price',
        price: '$3364.67',
        distance: '0.00%',
        direction: 'up'
      },
      {
        name: 'S1',
        price: '$3360.00',
        distance: '0.12%',
        direction: 'down'
      },
      {
        name: 'S2',
        price: '$3340.00',
        distance: '0.72%',
        direction: 'down'
      },
      {
        name: 'S3',
        price: '$3320.00',
        distance: '1.33%',
        direction: 'down'
      }
    ],
    tradingInsight: 'Gold often responds strongly to psychological levels like $3000, $3050, etc. Watch for price reaction at these key points.',
    entryStrategies: [
      {
        type: 'Buy near',
        level: '$3360-$340',
        description: 'if price finds support and shows signs of bullish reversal. Wait for confirmation like a bullish candlestick pattern or bounce off support before entry.'
      }
    ],
    riskManagement: {
      stopLoss: '$3320.00',
      takeProfit1: '$3400.00',
      takeProfit2: '$3420.00'
    }
  };

  const [isTechnicalOpen, setIsTechnicalOpen] = React.useState(true);
  const [isActionPlanOpen, setIsActionPlanOpen] = React.useState(true);

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
                <h2 className="text-2xl font-bold text-white mb-1">{analysis.pairName}</h2>
                <div className="flex items-center text-gray-400 text-sm">
                  <span className="mr-2">{analysis.timeframe} Timeframe</span>
                  <span className="mr-2">•</span>
                  <span>Analyzed {analysis.date}</span>
                </div>
              </div>
              <div className="px-4 py-2 rounded-full bg-green-900/30 text-green-400 font-medium">
                Bullish ({analysis.confidenceScore}% Confidence)
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
                {analysis.marketAnalysis}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-white">Trend Direction</span>
                  </div>
                  <span className="text-green-400 font-medium">Bullish</span>
                </div>
                <div className="text-gray-400 text-sm">
                  <div className="mb-2">
                    <span className="block text-white text-xs mb-1">Signal Strength</span>
                    <Progress value={analysis.confidenceScore} className="h-2 bg-gray-700" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Weak</span>
                    <span className="text-white font-medium">{analysis.confidenceScore}%</span>
                    <span>Strong</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Trading Insight</h4>
                <p className="text-gray-400 text-sm">
                  {analysis.tradingInsight}
                </p>
              </div>
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
                <div className="mb-8">
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    Chart Patterns
                    <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                      2 detected
                    </span>
                  </h3>
                  
                  <div className="space-y-3">
                    {analysis.chartPatterns.map((pattern, index) => (
                      <div 
                        key={index} 
                        className="bg-chart-bg border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className={`h-6 w-6 flex items-center justify-center rounded-full mr-2 ${
                            pattern.signal === 'bullish' ? 'text-green-400' : 
                            pattern.signal === 'bearish' ? 'text-red-400' : 
                            'text-yellow-400'
                          }`}>
                            <Circle className="h-3 w-3 fill-current" />
                          </div>
                          <span className="text-white">{pattern.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-2">{pattern.confidence}%</span>
                          <span className={
                            pattern.signal === 'bullish' ? 'text-green-400' : 
                            pattern.signal === 'bearish' ? 'text-red-400' : 
                            'text-yellow-400'
                          }>
                            {pattern.signal.charAt(0).toUpperCase() + pattern.signal.slice(1)} signal
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Key Price Levels */}
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
                        {analysis.priceLevels.map((level, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full mr-2 ${
                                  level.name.startsWith('R') ? 'bg-red-400' : 
                                  level.name.startsWith('S') ? 'bg-green-400' : 
                                  'bg-yellow-400'
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
              </div>
            )}
          </div>
          
          {/* Trading Action Plan */}
          <div className="bg-chart-card border border-gray-700 rounded-lg overflow-hidden">
            <div 
              className="p-6 flex justify-between items-center cursor-pointer"
              onClick={() => setIsActionPlanOpen(!isActionPlanOpen)}
            >
              <div className="flex items-center">
                <div className="bg-green-900/30 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <h3 className="text-green-400 font-medium mb-4 flex items-center">
                    <Circle className="h-4 w-4 fill-current mr-2" />
                    Entry Strategies
                  </h3>
                  
                  {analysis.entryStrategies.map((strategy, index) => (
                    <div key={index} className="bg-chart-bg border border-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-start mb-2">
                        <span className="bg-green-900 text-green-400 h-6 w-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-white font-medium">
                            {strategy.type} <span className="text-green-400">{strategy.level}</span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            {strategy.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Exit & Risk Management */}
                <div>
                  <h3 className="text-red-400 font-medium mb-4 flex items-center">
                    <Circle className="h-4 w-4 fill-current mr-2" />
                    Exit & Risk Management
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-chart-bg border border-gray-700 rounded-lg p-4">
                      <h4 className="text-red-400 text-sm mb-2">Stop Loss</h4>
                      <p className="text-white font-medium">{analysis.riskManagement.stopLoss}</p>
                    </div>
                    
                    <div className="bg-chart-bg border border-gray-700 rounded-lg p-4">
                      <h4 className="text-green-400 text-sm mb-2">Take Profit 1</h4>
                      <p className="text-white font-medium">{analysis.riskManagement.takeProfit1}</p>
                    </div>
                    
                    <div className="bg-chart-bg border border-gray-700 rounded-lg p-4">
                      <h4 className="text-green-400 text-sm mb-2">Take Profit 2</h4>
                      <p className="text-white font-medium">{analysis.riskManagement.takeProfit2}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AnalysisDetailsPage;
