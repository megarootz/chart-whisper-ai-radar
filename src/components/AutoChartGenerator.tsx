
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, Download, AlertTriangle, Plus, Camera } from 'lucide-react';
import AutoTradingViewWidget from './AutoTradingViewWidget';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import html2canvas from 'html2canvas';

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
  const widgetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleWidgetLoad = useCallback(() => {
    console.log("📊 Widget loaded callback triggered for symbol:", selectedSymbol);
    setIsWidgetLoaded(true);
  }, [selectedSymbol]);

  const validateCapturedImage = (canvas: HTMLCanvasElement): boolean => {
    // Check if canvas has actual content (not just a blank/loading screen)
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check for variety in pixel colors (real chart should have diverse colors)
    const colorSamples = new Set();
    for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const color = `${r},${g},${b}`;
      colorSamples.add(color);
      
      if (colorSamples.size > 10) { // If we have more than 10 different colors, likely a real chart
        return true;
      }
    }
    
    console.log("📸 Image validation: Found", colorSamples.size, "unique colors");
    return colorSamples.size > 5; // At least 5 different colors for a basic chart
  };

  const captureChartImage = async () => {
    if (!widgetRef.current || !isWidgetLoaded) {
      toast({
        title: "Chart Not Ready",
        description: "Please wait for the chart to fully load before analyzing",
        variant: "destructive"
      });
      return;
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
      
      console.log("📸 Starting chart capture process for:", { 
        selectedSymbol, 
        cleanSymbol, 
        selectedTimeframe 
      });
      
      // Wait a moment for any final updates to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the TradingView container - try multiple selectors
      let chartContainer: HTMLElement | null = null;
      
      const selectors = [
        '.tradingview-widget-container__widget',
        '.tradingview-widget-container iframe',
        '.tradingview-widget-container',
        '[data-widget-type="AdvancedChart"]'
      ];
      
      for (const selector of selectors) {
        chartContainer = widgetRef.current.querySelector(selector) as HTMLElement;
        if (chartContainer && chartContainer.offsetWidth > 0 && chartContainer.offsetHeight > 0) {
          console.log("📸 Found chart container with selector:", selector);
          break;
        }
      }
      
      // Fallback to the widget ref itself
      if (!chartContainer) {
        chartContainer = widgetRef.current;
        console.log("📸 Using widget ref as fallback container");
      }
      
      console.log("📸 Chart container details:", {
        width: chartContainer.offsetWidth,
        height: chartContainer.offsetHeight,
        visible: chartContainer.offsetParent !== null,
        tagName: chartContainer.tagName,
        className: chartContainer.className
      });

      // Enhanced capture with multiple attempts and validation
      let canvas: HTMLCanvasElement | null = null;
      let validCapture = false;
      const maxAttempts = 3;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`📸 Capture attempt ${attempt}/${maxAttempts}`);
        
        try {
          canvas = await html2canvas(chartContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#131722',
            logging: false,
            width: chartContainer.offsetWidth,
            height: chartContainer.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            ignoreElements: (element) => {
              // Skip copyright and non-chart elements
              return element.classList.contains('tradingview-widget-copyright') ||
                     element.classList.contains('tv-copyright') ||
                     element.tagName.toLowerCase() === 'script' ||
                     element.tagName.toLowerCase() === 'style';
            }
          });
          
          console.log(`📸 Canvas created (attempt ${attempt}):`, {
            width: canvas.width,
            height: canvas.height,
            hasContext: !!canvas.getContext('2d')
          });
          
          // Validate the captured image
          if (validateCapturedImage(canvas)) {
            console.log("✅ Captured image validation passed");
            validCapture = true;
            break;
          } else {
            console.log("❌ Captured image validation failed - appears to be empty or loading screen");
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
            }
          }
          
        } catch (captureError) {
          console.error(`❌ Capture attempt ${attempt} failed:`, captureError);
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!canvas || !validCapture) {
        throw new Error("Failed to capture valid chart image after multiple attempts. The chart might still be loading or there could be display issues.");
      }
      
      // Convert to PNG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`📸 PNG blob created: ${Math.round(blob.size / 1024)}KB`);
            resolve(blob);
          } else {
            reject(new Error("Failed to create image blob"));
          }
        }, 'image/png', 1.0);
      });
      
      // Enhanced validation
      if (blob.size < 10000) {
        throw new Error("Generated image is too small (less than 10KB), likely empty. Please ensure the chart is fully loaded and try again.");
      }
      
      // Create file
      const timestamp = Date.now();
      const file = new File([blob], `live-chart-${cleanSymbol.replace('/', '-')}-${selectedTimeframe}-${timestamp}.png`, { 
        type: 'image/png'
      });
      
      const timeframeObj = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
      const timeframeLabel = timeframeObj?.label || selectedTimeframe;
      
      console.log("🚀 Sending LIVE chart image for analysis:", {
        fileName: file.name,
        fileSize: Math.round(file.size / 1024) + "KB",
        cleanSymbol,
        timeframeLabel,
        validationPassed: validCapture
      });
      
      toast({
        title: "Live Chart Captured",
        description: `${cleanSymbol} live chart captured (${Math.round(blob.size / 1024)}KB). Analyzing with GPT-4.1-mini...`,
        variant: "default"
      });
      
      // Send for analysis
      onAnalyze(file, cleanSymbol, timeframeLabel);

    } catch (error) {
      console.error("❌ Error capturing live chart:", error);
      
      toast({
        title: "Capture Failed",
        description: error instanceof Error ? error.message : "Failed to capture the live chart. Please try again.",
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
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    console.log("🔄 Timeframe change from", selectedTimeframe, "to", newTimeframe);
    setSelectedTimeframe(newTimeframe);
    setIsWidgetLoaded(false);
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
            Live Chart Analysis with GPT-4.1-mini Vision
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
                <h3 className="text-white font-medium mb-2">Live Chart</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Currently showing: {getSelectedSymbolLabel()} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
                </p>
              </>
            )}
            
            {isMobile && (
              <p className="text-gray-400 text-xs mb-2">
                {getSelectedSymbolLabel()} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
              </p>
            )}
            
            <div 
              ref={widgetRef} 
              className="w-full overflow-hidden rounded-lg border border-gray-700 bg-[#131722]"
              style={{ height: isMobile ? '300px' : '500px' }}
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
              <div className={`w-2 h-2 rounded-full ${isWidgetLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isWidgetLoaded ? 'Live chart ready - Real-time analysis enabled' : 'Loading live chart...'}
              </span>
            </div>
            {!isMobile && (
              <span className="text-xs text-gray-500">
                Live Data • Real-time Capture • GPT-4.1-mini Vision
              </span>
            )}
          </div>

          {/* Analyze Button */}
          <Button 
            onClick={captureChartImage}
            disabled={!isWidgetLoaded || isCapturing || isAnalyzing}
            className={`w-full bg-primary hover:bg-primary/90 text-white ${isMobile ? 'h-10 text-sm' : ''}`}
          >
            {isCapturing ? 'Capturing Live Chart...' : isAnalyzing ? 'Analyzing...' : (
              <>
                <Camera className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                {isMobile ? 'Analyze Live Chart' : 'Capture & Analyze Live Chart Data'}
              </>
            )}
          </Button>

          {/* Info */}
          {!isMobile && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-blue-400 font-medium text-sm mb-1">Live Chart Analysis</h4>
                  <p className="text-gray-400 text-xs">
                    Captures the current visible live chart with real-time prices and sends it to GPT-4.1-mini Vision for accurate current market analysis.
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
