import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, Download, AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import AutoTradingViewWidget from './AutoTradingViewWidget';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface AutoChartGeneratorProps {
  onAnalyze: (file: File, symbol: string, timeframe: string) => void;
  isAnalyzing: boolean;
}

// Comprehensive Forex pairs including majors, minors (using Oanda data source for Forex and precious metals)
const FOREX_PAIRS = [
  // Major Pairs (Oanda)
  { value: "OANDA:EURUSD", label: "EUR/USD", cleanSymbol: "EUR/USD", category: "Major" },
  { value: "OANDA:GBPUSD", label: "GBP/USD", cleanSymbol: "GBP/USD", category: "Major" },
  { value: "OANDA:USDJPY", label: "USD/JPY", cleanSymbol: "USD/JPY", category: "Major" },
  { value: "OANDA:USDCHF", label: "USD/CHF", cleanSymbol: "USD/CHF", category: "Major" },
  { value: "OANDA:AUDUSD", label: "AUD/USD", cleanSymbol: "AUD/USD", category: "Major" },
  { value: "OANDA:USDCAD", label: "USD/CAD", cleanSymbol: "USD/CAD", category: "Major" },
  { value: "OANDA:NZDUSD", label: "NZD/USD", cleanSymbol: "NZD/USD", category: "Major" },
  
  // Minor Pairs (Cross Currency Pairs) (Oanda)
  { value: "OANDA:EURGBP", label: "EUR/GBP", cleanSymbol: "EUR/GBP", category: "Minor" },
  { value: "OANDA:EURJPY", label: "EUR/JPY", cleanSymbol: "EUR/JPY", category: "Minor" },
  { value: "OANDA:EURCHF", label: "EUR/CHF", cleanSymbol: "EUR/CHF", category: "Minor" },
  { value: "OANDA:EURAUD", label: "EUR/AUD", cleanSymbol: "EUR/AUD", category: "Minor" },
  { value: "OANDA:EURCAD", label: "EUR/CAD", cleanSymbol: "EUR/CAD", category: "Minor" },
  { value: "OANDA:EURNZD", label: "EUR/NZD", cleanSymbol: "EUR/NZD", category: "Minor" },
  { value: "OANDA:GBPJPY", label: "GBP/JPY", cleanSymbol: "GBP/JPY", category: "Minor" },
  { value: "OANDA:GBPCHF", label: "GBP/CHF", cleanSymbol: "GBP/CHF", category: "Minor" },
  { value: "OANDA:GBPAUD", label: "GBP/AUD", cleanSymbol: "GBP/AUD", category: "Minor" },
  { value: "OANDA:GBPCAD", label: "GBP/CAD", cleanSymbol: "GBP/CAD", category: "Minor" },
  { value: "OANDA:GBPNZD", label: "GBP/NZD", cleanSymbol: "GBP/NZD", category: "Minor" },
  { value: "OANDA:AUDJPY", label: "AUD/JPY", cleanSymbol: "AUD/JPY", category: "Minor" },
  { value: "OANDA:AUDCHF", label: "AUD/CHF", cleanSymbol: "AUD/CHF", category: "Minor" },
  { value: "OANDA:AUDCAD", label: "AUD/CAD", cleanSymbol: "AUD/CAD", category: "Minor" },
  { value: "OANDA:AUDNZD", label: "AUD/NZD", cleanSymbol: "AUD/NZD", category: "Minor" },
  { value: "OANDA:CADJPY", label: "CAD/JPY", cleanSymbol: "CAD/JPY", category: "Minor" },
  { value: "OANDA:CADCHF", label: "CAD/CHF", cleanSymbol: "CAD/CHF", category: "Minor" },
  { value: "OANDA:CHFJPY", label: "CHF/JPY", cleanSymbol: "CHF/JPY", category: "Minor" },
  { value: "OANDA:NZDJPY", label: "NZD/JPY", cleanSymbol: "NZD/JPY", category: "Minor" },
  { value: "OANDA:NZDCHF", label: "NZD/CHF", cleanSymbol: "NZD/CHF", category: "Minor" },
  { value: "OANDA:NZDCAD", label: "NZD/CAD", cleanSymbol: "NZD/CAD", category: "Minor" },
  
  // Commodities (Oanda for precious metals)
  { value: "OANDA:XAUUSD", label: "XAU/USD (Gold)", cleanSymbol: "XAU/USD", category: "Commodity" },
  { value: "OANDA:XAGUSD", label: "XAG/USD (Silver)", cleanSymbol: "XAG/USD", category: "Commodity" },
  
  // Major Cryptocurrencies (keeping Binance for crypto)
  { value: "BINANCE:BTCUSDT", label: "BTC/USDT", cleanSymbol: "BTC/USDT", category: "Crypto" },
  { value: "BINANCE:ETHUSDT", label: "ETH/USDT", cleanSymbol: "ETH/USDT", category: "Crypto" },
  { value: "BINANCE:ADAUSDT", label: "ADA/USDT", cleanSymbol: "ADA/USDT", category: "Crypto" },
];

const TIMEFRAMES = [
  { value: "1", label: "1 Minute" },
  { value: "5", label: "5 Minutes" },
  { value: "15", label: "15 Minutes" },
  { value: "30", label: "30 Minutes" },
  { value: "60", label: "1 Hour" },
  { value: "240", label: "4 Hours" },
  { value: "D", label: "Daily" },
  { value: "W", label: "Weekly" },
];

const AutoChartGenerator: React.FC<AutoChartGeneratorProps> = ({ onAnalyze, isAnalyzing }) => {
  const [selectedSymbol, setSelectedSymbol] = useState("OANDA:EURUSD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("D");
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPair, setCustomPair] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const lastCaptureTime = useRef<number>(0);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleWidgetLoad = useCallback(() => {
    console.log("📊 Widget loaded callback triggered for symbol:", selectedSymbol);
    setIsWidgetLoaded(true);
    setIsRefreshing(false);
  }, [selectedSymbol]);

  // Force refresh widget to get latest data
  const refreshWidget = async () => {
    if (isRefreshing || isCapturing) return;
    
    setIsRefreshing(true);
    setIsWidgetLoaded(false);
    
    console.log("🔄 Force refreshing widget for latest data...");
    
    // Trigger widget recreation by changing a key prop
    const currentTime = Date.now();
    lastCaptureTime.current = currentTime;
    
    // The widget will automatically refresh due to the effect in AutoTradingViewWidget
    toast({
      title: "Refreshing Chart",
      description: "Getting the latest market data...",
      variant: "default"
    });
  };

  const captureAndAnalyze = async () => {
    if (!widgetRef.current || !isWidgetLoaded) {
      toast({
        title: "Chart Not Ready",
        description: "Please wait for the chart to fully load with latest data before analyzing",
        variant: "destructive"
      });
      return;
    }

    // Check if we should refresh for latest data
    const timeSinceLastCapture = Date.now() - lastCaptureTime.current;
    const shouldRefresh = timeSinceLastCapture > 300000; // 5 minutes

    if (shouldRefresh) {
      toast({
        title: "Refreshing for Latest Data",
        description: "Getting the most current market data before analysis...",
        variant: "default"
      });
      await refreshWidget();
      // Wait for refresh to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (!isWidgetLoaded) {
        toast({
          title: "Refresh Required",
          description: "Please wait for the chart to refresh with latest data",
          variant: "destructive"
        });
        return;
      }
    }

    setIsCapturing(true);

    try {
      // Get clean symbol for analysis
      let cleanSymbol;
      if (showCustomInput && customPair) {
        cleanSymbol = customPair.toUpperCase();
      } else {
        const symbolObj = FOREX_PAIRS.find(s => s.value === selectedSymbol);
        cleanSymbol = symbolObj?.cleanSymbol || selectedSymbol;
      }
      
      console.log("🎯 Starting capture for latest data:", { 
        selectedSymbol, 
        cleanSymbol, 
        selectedTimeframe,
        isCustomPair: showCustomInput,
        timeSinceLastCapture: timeSinceLastCapture / 1000 + " seconds"
      });
      
      // Extended wait time for chart to fully render with latest data
      console.log("⏳ Waiting for latest market data to render...");
      await new Promise(resolve => setTimeout(resolve, 8000)); // Reduced from 10 to 8 seconds

      // Additional check for iframe content
      const iframe = widgetRef.current.querySelector('iframe');
      if (iframe) {
        console.log("📊 Ensuring iframe has latest data...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Extra 2 seconds for iframe content
      }

      // Capture with high quality settings optimized for latest data
      const canvas = await html2canvas(widgetRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#131722',
        scale: 2,
        logging: true,
        imageTimeout: 30000, // Increased timeout
        removeContainer: false,
        width: widgetRef.current.offsetWidth,
        height: widgetRef.current.offsetHeight,
        foreignObjectRendering: true, // Better iframe rendering
      });

      console.log("✅ Canvas captured with latest data, size:", canvas.width, "x", canvas.height);

      // Improved content validation for fresh data
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      if (!imageData) {
        throw new Error("Failed to get image data from canvas");
      }

      // More reasonable validation logic
      const pixels = imageData.data;
      let colorVariations = new Set();
      let nonBlackPixels = 0;
      const totalPixels = pixels.length / 4;
      
      // Sample every 20th pixel instead of every 40th for better color detection
      for (let i = 0; i < pixels.length; i += 80) { // 20 pixels * 4 (RGBA) = 80
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        if (a > 0) {
          // More granular color grouping for better variation detection
          const colorKey = `${Math.floor(r/20)}-${Math.floor(g/20)}-${Math.floor(b/20)}`;
          colorVariations.add(colorKey);
          
          // Lower threshold for non-black pixels
          if (r > 10 || g > 10 || b > 10) {
            nonBlackPixels++;
          }
        }
      }
      
      const contentPercentage = (nonBlackPixels / (totalPixels / 20)) * 100; // Adjusted calculation
      const colorDiversity = colorVariations.size;
      
      console.log("📊 Latest data capture analysis:", {
        contentPercentage: contentPercentage.toFixed(2) + "%",
        colorVariations: colorDiversity,
        canvasSize: `${canvas.width}x${canvas.height}`,
        selectedSymbol,
        cleanSymbol,
        captureTimestamp: new Date().toISOString()
      });
      
      // More reasonable validation thresholds
      if (contentPercentage < 1 || colorDiversity < 3) {
        throw new Error(`Captured image appears to lack sufficient chart content (${contentPercentage.toFixed(1)}% content, ${colorDiversity} color variations). Please refresh and wait longer for the data to load.`);
      }

      // Create file from canvas with timestamp
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        }, 'image/png', 0.95);
      });

      const timestamp = Date.now();
      lastCaptureTime.current = timestamp;
      const file = new File([blob], `chart-${cleanSymbol.replace('/', '-')}-${selectedTimeframe}-latest-${timestamp}.png`, { 
        type: 'image/png' 
      });
      
      const timeframeObj = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
      const timeframeLabel = timeframeObj?.label || selectedTimeframe;
      
      console.log("🚀 Sending latest data to analysis:", {
        fileName: file.name,
        fileSize: file.size,
        cleanSymbol,
        timeframeLabel,
        originalSymbol: selectedSymbol,
        captureTime: new Date(timestamp).toISOString()
      });
      
      // Pass the clean symbol for analysis
      onAnalyze(file, cleanSymbol, timeframeLabel);

    } catch (error) {
      console.error("❌ Error in latest data capture:", error);
      
      let errorMessage = "Failed to capture the latest chart data. ";
      
      if (error instanceof Error) {
        if (error.message.includes("content") || error.message.includes("variations")) {
          errorMessage += error.message + " Try refreshing the chart first.";
        } else {
          errorMessage += error.message;
        }
      }
      
      toast({
        title: "Latest Data Capture Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const getSelectedSymbolLabel = () => {
    if (showCustomInput && customPair) {
      return customPair.toUpperCase();
    }
    const symbol = FOREX_PAIRS.find(s => s.value === selectedSymbol);
    return symbol?.label || selectedSymbol;
  };

  // Reset widget loaded state when symbol changes
  const handleSymbolChange = (newSymbol: string) => {
    console.log("🔄 Symbol change from", selectedSymbol, "to", newSymbol);
    setSelectedSymbol(newSymbol);
    setIsWidgetLoaded(false);
    setShowCustomInput(false);
    lastCaptureTime.current = 0; // Reset capture time to force fresh data
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    console.log("🔄 Timeframe change from", selectedTimeframe, "to", newTimeframe);
    setSelectedTimeframe(newTimeframe);
    setIsWidgetLoaded(false);
    lastCaptureTime.current = 0; // Reset capture time to force fresh data
  };

  const handleCustomPairSubmit = () => {
    if (!customPair.trim()) {
      toast({
        title: "Invalid Pair",
        description: "Please enter a valid trading pair (e.g., EUR/USD)",
        variant: "destructive"
      });
      return;
    }
    
    // Format the custom pair for TradingView
    const formattedPair = customPair.toUpperCase().replace('/', '');
    const tradingViewSymbol = `FX:${formattedPair}`;
    
    console.log("🔄 Custom pair submitted:", { customPair, tradingViewSymbol });
    setSelectedSymbol(tradingViewSymbol);
    setIsWidgetLoaded(false);
  };

  // Group pairs by category for better organization
  const groupedPairs = FOREX_PAIRS.reduce((acc, pair) => {
    if (!acc[pair.category]) {
      acc[pair.category] = [];
    }
    acc[pair.category].push(pair);
    return acc;
  }, {} as Record<string, typeof FOREX_PAIRS>);

  return (
    <Card className="w-full bg-chart-card border-gray-700">
      {!isMobile && (
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Enhanced Automated Chart Analysis
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={`${isMobile ? 'pt-4 px-3 pb-3' : 'space-y-6'}`}>
        {/* Symbol and Timeframe Selection */}
        <div className={`${isMobile ? 'grid grid-cols-2 gap-2 mb-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <div className="space-y-1">
            <Label htmlFor="symbol-select" className={`text-white ${isMobile ? 'text-sm' : ''}`}>Trading Pair</Label>
            {!showCustomInput ? (
              <div className="space-y-2">
                <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
                  <SelectTrigger className={`bg-gray-800 border-gray-700 text-white ${isMobile ? 'h-9 text-sm' : ''}`}>
                    <SelectValue placeholder="Select a trading pair" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                    {Object.entries(groupedPairs).map(([category, pairs]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          {category} Pairs
                        </div>
                        {pairs.map((pair) => (
                          <SelectItem key={pair.value} value={pair.value} className="text-white hover:bg-gray-700">
                            {pair.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  onClick={() => setShowCustomInput(true)}
                  className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <Plus className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                  Add Custom Pair
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Enter pair (e.g., EUR/USD)"
                  value={customPair}
                  onChange={(e) => setCustomPair(e.target.value)}
                  className={`bg-gray-800 border-gray-700 text-white ${isMobile ? 'h-9 text-sm' : ''}`}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomPairSubmit()}
                />
                <div className="flex gap-2">
                  <Button
                    size={isMobile ? "sm" : "default"}
                    onClick={handleCustomPairSubmit}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Use Pair
                  </Button>
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomPair("");
                    }}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="timeframe-select" className={`text-white ${isMobile ? 'text-sm' : ''}`}>Timeframe</Label>
            <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className={`bg-gray-800 border-gray-700 text-white ${isMobile ? 'h-9 text-sm' : ''}`}>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {TIMEFRAMES.map((timeframe) => (
                  <SelectItem key={timeframe.value} value={timeframe.value} className="text-white hover:bg-gray-700">
                    {timeframe.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* TradingView Chart */}
        <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
          <div className={`bg-gray-800/50 rounded-lg ${isMobile ? 'p-2' : 'p-4'}`}>
            {!isMobile && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">Live Chart Preview</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshWidget}
                    disabled={isRefreshing || isCapturing}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Currently showing: {getSelectedSymbolLabel()} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
                  {lastCaptureTime.current > 0 && (
                    <span className="ml-2 text-xs">
                      (Last refreshed: {new Date(lastCaptureTime.current).toLocaleTimeString()})
                    </span>
                  )}
                </p>
              </>
            )}
            
            {isMobile && (
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs">
                  {getSelectedSymbolLabel()} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshWidget}
                  disabled={isRefreshing || isCapturing}
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-6 text-xs px-2"
                >
                  <RefreshCw className={`h-2 w-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}
            
            <div 
              ref={widgetRef} 
              className="w-full overflow-hidden rounded-lg border border-gray-700 bg-[#131722]"
              key={`${selectedSymbol}-${selectedTimeframe}-${lastCaptureTime.current}`}
            >
              <AutoTradingViewWidget 
                symbol={selectedSymbol}
                interval={selectedTimeframe}
                onLoad={handleWidgetLoad}
              />
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isRefreshing ? 'bg-yellow-500 animate-pulse' : 
                isWidgetLoaded ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isRefreshing ? 'Refreshing...' : isWidgetLoaded ? 'Latest data ready' : 'Loading...'}
              </span>
            </div>
            
            {lastCaptureTime.current > 0 && (
              <span className="text-gray-500 text-xs">
                Data age: {Math.floor((Date.now() - lastCaptureTime.current) / 60000)}m
              </span>
            )}
          </div>

          {/* Analyze Button */}
          <Button 
            onClick={captureAndAnalyze}
            disabled={!isWidgetLoaded || isCapturing || isAnalyzing || isRefreshing}
            className={`w-full bg-primary hover:bg-primary/90 text-white ${isMobile ? 'h-10 text-sm' : ''}`}
          >
            {isCapturing ? 'Capturing Latest Data...' : isAnalyzing ? 'Analyzing...' : (
              <>
                <Download className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                {isMobile ? 'Analyze Latest Data' : 'Capture & Analyze Latest Chart Data'}
              </>
            )}
          </Button>

          {/* Help Text */}
          {!isMobile && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-blue-400 font-medium text-sm mb-1">Latest Data Analysis</h4>
                  <p className="text-gray-400 text-xs">
                    The system automatically refreshes chart data before analysis to ensure you get the most current support/resistance levels and market conditions. Use the refresh button to manually update the chart.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoChartGenerator;
