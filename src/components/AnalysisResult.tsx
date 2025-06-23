
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTradingPair } from '@/utils/tradingPairUtils';
import { TrendingUp, BarChart3, AlertTriangle, DollarSign, Clock, Target, TrendingDown } from 'lucide-react';

export interface MarketFactor {
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface ChartPattern {
  name: string;
  confidence: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  status?: 'complete' | 'forming';
}

export interface PriceLevel {
  name: string;
  price: string;
  distance?: string;
  direction?: 'up' | 'down';
}

export interface TradingSetup {
  type: 'long' | 'short' | 'neutral';
  description: string;
  confidence: number;
  timeframe: string;
  entryPrice?: string;
  stopLoss?: string;
  takeProfits?: string[];
  riskRewardRatio?: string;
  entryTrigger?: string;
}

export interface AnalysisResultData {
  pairName: string;
  timeframe: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral' | 'mildly bullish' | 'mildly bearish';
  confidenceScore: number;
  marketAnalysis: string;
  trendDirection: 'bullish' | 'bearish' | 'neutral';
  marketFactors: MarketFactor[];
  chartPatterns: ChartPattern[];
  priceLevels: PriceLevel[];
  entryLevel?: string;
  stopLoss?: string;
  takeProfits?: string[];
  tradingInsight?: string;
  tradingSetup?: TradingSetup;
  timestamp?: string;
  date?: string;
}

const AnalysisResult = ({ data }: { data: AnalysisResultData }) => {
  // Extract trading pair and timeframe from the AI analysis text
  const extractTradingInfo = (analysisText: string) => {
    // Look for patterns in the Market Context & Trend Detection section
    const marketContextMatch = analysisText.match(/1\.\s*Market Context.*?Detection[\s\S]*?(?=2\.|$)/i);
    
    if (marketContextMatch) {
      const marketContextText = marketContextMatch[0];
      
      // Look for specific patterns like "Gold Spot priced in U.S. Dollars on the 1-hour timeframe"
      const goldMatch = marketContextText.match(/Gold\s+Spot\s+priced\s+in\s+U\.S\.\s+Dollars?\s+on\s+the\s+([\w\-]+)\s+timeframe/i);
      if (goldMatch) {
        return {
          pair: 'XAU/USD',
          timeframe: goldMatch[1]
        };
      }
      
      // Look for other currency pair patterns
      const pairMatch = marketContextText.match(/(EUR\/USD|GBP\/USD|USD\/JPY|AUD\/USD|USD\/CAD|NZD\/USD|EUR\/GBP|EUR\/JPY|GBP\/JPY|XAU\/USD|XAG\/USD|BTC\/USD|ETH\/USD)/gi);
      const timeframeMatch = marketContextText.match(/(?:on\s+the\s+|timeframe[:\s]+)(1-hour|4-hour|daily|weekly|monthly|15-minute|30-minute|1h|4h|1d|1w|1m)/gi);
      
      if (pairMatch && timeframeMatch) {
        return {
          pair: pairMatch[0].toUpperCase(),
          timeframe: timeframeMatch[0].replace(/^(?:on\s+the\s+|timeframe[:\s]+)/i, '')
        };
      }
      
      // Fallback: look for any mention of pairs and timeframes
      if (pairMatch) {
        return {
          pair: pairMatch[0].toUpperCase(),
          timeframe: 'Unknown Timeframe'
        };
      }
    }

    // Fallback: look for patterns anywhere in the text
    const titleMatch = analysisText.match(/Technical Chart Analysis Report.*?\((.*?)\)/i) ||
                      analysisText.match(/📊\s*Technical Chart Analysis Report.*?\((.*?)\)/i);
    
    if (titleMatch) {
      const titleContent = titleMatch[1];
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

    const pairMatch = analysisText.match(/(?:Gold|XAU|EUR|USD|GBP|JPY|CHF|CAD|AUD|NZD|BTC|ETH)[\/\s]*(?:USD|EUR|JPY|GBP|CHF|CAD|AUD|NZD|USDT)/gi);
    const timeframeMatch = analysisText.match(/(?:1|4|15|30)\s*(?:Hour|Minute|Min|H|M)|Daily|Weekly|Monthly/gi);
    
    return {
      pair: pairMatch ? pairMatch[0] : 'Unknown Pair',
      timeframe: timeframeMatch ? timeframeMatch[0] : 'Unknown Timeframe'
    };
  };

  // Extract current price from analysis text
  const extractCurrentPrice = (analysisText: string) => {
    // Look for patterns like "Current Price: $2,685.50" or "Price: 2685.50"
    const priceMatch = analysisText.match(/(?:Current\s+Price|Price):\s*\$?([\d,]+\.?\d*)/i);
    if (priceMatch) {
      return `$${priceMatch[1]}`;
    }
    
    // Look for other price patterns in the text
    const genericPriceMatch = analysisText.match(/\$?([\d,]+\.\d{2})/);
    if (genericPriceMatch) {
      return `$${genericPriceMatch[1]}`;
    }
    
    return null;
  };

  // Function to parse table data from analysis text
  const parseTableData = (text: string, sectionNumber: string) => {
    const lines = text.split('\n');
    const sectionIndex = lines.findIndex(line => line.includes(`${sectionNumber}.`));
    
    if (sectionIndex === -1) return null;
    
    const tableData = [];
    let foundTable = false;
    
    for (let i = sectionIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Stop if we hit the next section
      if (line.match(/^\d+\./) && i > sectionIndex) break;
      
      // Look for table rows with | separators
      if (line.includes('|')) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 1) {
          tableData.push(cells);
          foundTable = true;
        }
      }
      
      // Also look for structured data without | separators
      if (!foundTable && line.includes('Buy') && line.includes('Sell')) {
        // Handle different formats
        if (line.includes('|')) {
          const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
          tableData.push(cells);
        }
      }
    }
    
    return tableData.length > 0 ? tableData : null;
  };

  // Parse section 6 and 9 tables
  const section6Table = parseTableData(data.marketAnalysis, '6');
  const section9Table = parseTableData(data.marketAnalysis, '9');

  // Function to render analysis text with tables replaced
  const renderAnalysisWithTables = (text: string) => {
    const lines = text.split('\n');
    const result = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Check if this is section 6
      if (line.includes('6. Trade Setups & Risk Management')) {
        result.push(
          <div key={`section-6-${i}`} className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              6. Trade Setups & Risk Management
            </h3>
            {section6Table && (
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden mb-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Trade Type</TableHead>
                      <TableHead className="text-gray-300">Entry Area</TableHead>
                      <TableHead className="text-gray-300">Stop Loss (SL)</TableHead>
                      <TableHead className="text-gray-300">Take Profit (TP1)</TableHead>
                      <TableHead className="text-gray-300">Take Profit (TP2)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section6Table.slice(1).map((row, idx) => (
                      <TableRow key={idx} className="border-gray-700">
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx} className="text-gray-100">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
        
        // Skip lines until we reach the next section or end of section 6
        while (i < lines.length && !lines[i].match(/^7\./)) {
          i++;
        }
        continue;
      }
      
      // Check if this is section 9
      if (line.includes('9. Trade Plan Table Example')) {
        result.push(
          <div key={`section-9-${i}`} className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              9. Trade Plan Table Example
            </h3>
            {section9Table && (
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden mb-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Trade Plan</TableHead>
                      <TableHead className="text-gray-300">Entry</TableHead>
                      <TableHead className="text-gray-300">Stop Loss</TableHead>
                      <TableHead className="text-gray-300">Take Profit 1</TableHead>
                      <TableHead className="text-gray-300">Take Profit 2</TableHead>
                      <TableHead className="text-gray-300">R/R</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section9Table.slice(1).map((row, idx) => (
                      <TableRow key={idx} className="border-gray-700">
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx} className="text-gray-100">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
        
        // Skip lines until we reach the disclaimer or end
        while (i < lines.length && !lines[i].includes('⚠️ Disclaimer')) {
          i++;
        }
        continue;
      }
      
      // Handle numbered sections with ### removal and bold formatting
      if (line.match(/^#{1,3}\s*\d+\./)) {
        // Remove ### and format with bold numbers
        const cleanedLine = line.replace(/^#{1,3}\s*/, '').trim();
        const numberMatch = cleanedLine.match(/^(\d+\.)\s*(.*)/);
        
        if (numberMatch) {
          result.push(
            <div key={`section-${i}`} className="mb-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                <span className="font-bold text-primary">{numberMatch[1]}</span> {numberMatch[2]}
              </h3>
            </div>
          );
        } else {
          result.push(
            <div key={`section-${i}`} className="mb-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                {cleanedLine}
              </h3>
            </div>
          );
        }
      }
      // Handle regular numbered sections without ###
      else if (line.match(/^\d+\./)) {
        const numberMatch = line.match(/^(\d+\.)\s*(.*)/);
        
        if (numberMatch) {
          result.push(
            <div key={`section-${i}`} className="mb-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                <span className="font-bold text-primary">{numberMatch[1]}</span> {numberMatch[2]}
              </h3>
            </div>
          );
        } else {
          result.push(
            <div key={`section-${i}`} className="mb-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                {line.trim()}
              </h3>
            </div>
          );
        }
      }
      // Handle bullet points with better spacing
      else if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        const bulletContent = line.trim().replace(/^[•-]\s*/, '');
        result.push(
          <div key={`bullet-${i}`} className="mb-4 ml-6">
            <div className="flex items-start">
              <span className="text-primary mr-3 mt-1 font-bold">•</span>
              <span className="text-gray-100 leading-relaxed">{bulletContent}</span>
            </div>
          </div>
        );
      }
      // Handle sub-bullets with improved spacing
      else if (line.trim().startsWith('- ') && line.startsWith('  ')) {
        const subBulletContent = line.trim().replace(/^-\s*/, '');
        result.push(
          <div key={`sub-bullet-${i}`} className="mb-3 ml-12">
            <div className="flex items-start">
              <span className="text-gray-400 mr-3 mt-1">-</span>
              <span className="text-gray-200 leading-relaxed text-sm">{subBulletContent}</span>
            </div>
          </div>
        );
      }
      // Handle bold text formatting for key terms
      else if (line.trim() && line.includes('**')) {
        const formattedText = line.trim().replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
        result.push(
          <div key={`text-${i}`} className="mb-4 ml-6">
            <span 
              className="text-gray-100 leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />
          </div>
        );
      }
      // Regular text content with better spacing
      else if (line.trim()) {
        result.push(
          <div key={`text-${i}`} className="mb-4">
            <span className="text-gray-100 leading-relaxed">{line.trim()}</span>
          </div>
        );
      }
      
      i++;
    }
    
    return result;
  };

  const { pair, timeframe } = extractTradingInfo(data.marketAnalysis);
  const formattedPair = formatTradingPair(pair);
  const currentPrice = extractCurrentPrice(data.marketAnalysis);

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    if (sentiment.toLowerCase().includes('bullish')) return 'text-green-400';
    if (sentiment.toLowerCase().includes('bearish')) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment.toLowerCase().includes('bullish')) return <TrendingUp className="h-4 w-4" />;
    if (sentiment.toLowerCase().includes('bearish')) return <TrendingDown className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 bg-primary/20 p-3 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">Analysis Complete</div>
                  <div className="text-lg text-gray-300">Professional Chart Analysis for {formattedPair}</div>
                  <div className="text-sm text-gray-400 mt-1">{timeframe}</div>
                </div>
              </div>
              {currentPrice && (
                <div className="text-right">
                  <div className="flex items-center text-white mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="text-xl font-bold">{currentPrice}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Current Price</span>
                  </div>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            
            {/* Main Analysis Content with Tables */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Detailed Analysis Report
                </h3>
                <div className="h-px bg-gradient-to-r from-primary to-transparent"></div>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-100 leading-relaxed text-sm md:text-base">
                  {renderAnalysisWithTables(data.marketAnalysis)}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/50 rounded-xl p-6">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-2">
                    ⚠️ Important Disclaimer
                  </h4>
                  <p className="text-yellow-200 text-sm leading-relaxed">
                    <em>This analysis is for educational and idea-generation purposes only. Trading involves substantial risk and is not suitable for all investors. Always conduct your own research, use proper risk management, and never risk more than you can afford to lose. Past performance does not guarantee future results.</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResult;
