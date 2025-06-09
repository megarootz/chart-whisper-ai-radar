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

  // Advanced chart validation function
  const validateChartContent = (canvas: HTMLCanvasElement): { isValid: boolean; reason: string } => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { isValid: false, reason: "No canvas context" };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Count different colors and patterns
    const colorMap = new Map();
    let totalPixels = 0;
    let nonTransparentPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      totalPixels++;
      
      if (a > 0) {
        nonTransparentPixels++;
        const colorKey = `${r}-${g}-${b}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }
    }
    
    const uniqueColors = colorMap.size;
    const contentRatio = nonTransparentPixels / totalPixels;
    
    console.log("📸 Chart validation:", {
      dimensions: `${canvas.width}x${canvas.height}`,
      uniqueColors,
      contentRatio: contentRatio.toFixed(3),
      nonTransparentPixels,
      totalPixels
    });
    
    // Validation criteria for a real chart
    if (contentRatio < 0.1) {
      return { isValid: false, reason: "Image appears to be mostly empty" };
    }
    
    if (uniqueColors < 10) {
      return { isValid: false, reason: "Image has insufficient color variation for a chart" };
    }
    
    // Check for chart-like patterns (look for line variations)
    let hasChartPatterns = false;
    const sampleSize = Math.min(1000, data.length / 4);
    let colorChanges = 0;
    
    for (let i = 0; i < sampleSize - 1; i++) {
      const idx1 = i * 4;
      const idx2 = (i + 1) * 4;
      
      const color1 = data[idx1] + data[idx1 + 1] + data[idx1 + 2];
      const color2 = data[idx2] + data[idx2 + 1] + data[idx2 + 2];
      
      if (Math.abs(color1 - color2) > 30) {
        colorChanges++;
      }
    }
    
    if (colorChanges > sampleSize * 0.1) {
      hasChartPatterns = true;
    }
    
    if (!hasChartPatterns) {
      return { isValid: false, reason: "No chart-like patterns detected" };
    }
    
    return { isValid: true, reason: "Valid chart content detected" };
  };

  const captureChartUsingRealScreenshot = async () => {
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
      
      console.log("📸 Starting advanced chart capture for:", { 
        selectedSymbol, 
        cleanSymbol, 
        selectedTimeframe,
        isCustomPair: showCustomInput
      });
      
      // Extended wait for TradingView to fully render with actual data
      console.log("⏳ Waiting for TradingView chart to fully render with real data...");
      await new Promise(resolve => setTimeout(resolve, 8000)); // Longer wait for real data
      
      console.log("📸 Capturing with advanced html2canvas settings...");
      
      // Capture with maximum quality settings for better chart analysis
      const canvas = await html2canvas(widgetRef.current, {
        backgroundColor: null, // Preserve transparency
        scale: 1.5, // Higher scale for better detail
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true, // Enable for better iframe handling
        width: Math.min(widgetRef.current.offsetWidth, 1400),
        height: Math.min(widgetRef.current.offsetHeight, 900),
        logging: false, // Reduce noise
        imageTimeout: 45000, // Longer timeout
        removeContainer: false,
        ignoreElements: (element) => {
          // Ignore overlay elements that might interfere
          return element.classList.contains('tradingview-widget-copyright');
        },
        onclone: (clonedDoc) => {
          // Ensure the cloned document shows the chart properly
          const clonedWidgets = clonedDoc.querySelectorAll('.tradingview-widget-container');
          clonedWidgets.forEach(widget => {
            (widget as HTMLElement).style.background = 'transparent';
            (widget as HTMLElement).style.overflow = 'visible';
          });
        }
      });
      
      console.log(`📸 Raw canvas captured: ${canvas.width}x${canvas.height}`);
      
      // Validate chart content before proceeding
      const validation = validateChartContent(canvas);
      console.log("🔍 Chart validation result:", validation);
      
      if (!validation.isValid) {
        console.error("❌ Chart validation failed:", validation.reason);
        toast({
          title: "Capture Failed", 
          description: `Chart capture failed: ${validation.reason}. Please wait longer for the chart to load.`,
          variant: "destructive"
        });
        return;
      }
      
      // Optimize canvas size for analysis while maintaining quality
      const targetWidth = 1200;
      const targetHeight = 800;
      const aspectRatio = canvas.width / canvas.height;
      
      let finalWidth = targetWidth;
      let finalHeight = Math.round(targetWidth / aspectRatio);
      
      if (finalHeight > targetHeight) {
        finalHeight = targetHeight;
        finalWidth = Math.round(targetHeight * aspectRatio);
      }
      
      // Create optimized canvas
      const optimizedCanvas = document.createElement('canvas');
      optimizedCanvas.width = finalWidth;
      optimizedCanvas.height = finalHeight;
      const optimizedCtx = optimizedCanvas.getContext('2d');
      
      if (!optimizedCtx) {
        throw new Error("Failed to create optimized canvas context");
      }
      
      // Draw with high quality scaling
      optimizedCtx.imageSmoothingEnabled = true;
      optimizedCtx.imageSmoothingQuality = 'high';
      optimizedCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
      
      console.log(`📸 Optimized canvas: ${finalWidth}x${finalHeight}`);
      
      // Convert to high-quality blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        optimizedCanvas.toBlob((blob) => {
          if (blob) {
            console.log(`📸 Final image size: ${Math.round(blob.size / 1024)}KB`);
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from optimized canvas"));
          }
        }, 'image/png', 1.0); // Maximum quality PNG
      });
      
      console.log("✅ Chart image captured and validated successfully");

      // Create file with descriptive name
      const timestamp = Date.now();
      const file = new File([blob], `chart-${cleanSymbol.replace('/', '-')}-${selectedTimeframe}-${timestamp}.png`, { 
        type: 'image/png'
      });
      
      const timeframeObj = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
      const timeframeLabel = timeframeObj?.label || selectedTimeframe;
      
      console.log("🚀 Sending validated chart to analysis:", {
        fileName: file.name,
        fileSize: Math.round(file.size / 1024) + "KB",
        cleanSymbol,
        timeframeLabel,
        dimensions: `${finalWidth}x${finalHeight}`,
        validationPassed: true
      });
      
      toast({
        title: "Chart Captured Successfully",
        description: `Captured ${cleanSymbol} chart (${Math.round(file.size / 1024)}KB). Starting AI analysis...`,
        variant: "default"
      });
      
      // Send for analysis
      onAnalyze(file, cleanSymbol, timeframeLabel);

    } catch (error) {
      console.error("❌ Error in advanced chart capture:", error);
      
      let errorMessage = "Failed to capture the chart. ";
      
      if (error instanceof Error) {
        if (error.message.includes('tainted')) {
          errorMessage += "Security restrictions detected. Try waiting longer for chart to load.";
        } else if (error.message.includes('timeout')) {
          errorMessage += "Chart loading timeout. Please try again.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Please ensure the chart is fully loaded and try again.";
      }
      
      toast({
        title: "Capture Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Helper function to compress image
  const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.7): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`📸 Image compressed to ${Math.round(blob.size / 1024)}KB`);
          resolve(blob);
        }
      }, 'image/jpeg', quality);
    });
  };

  // Helper function to validate if image contains chart content
  const validateChartImage = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check for color variation to ensure it's not just a blank canvas
    let colorVariation = 0;
    let sampleSize = Math.min(1000, data.length / 4); // Sample 1000 pixels or less
    
    for (let i = 0; i < sampleSize; i++) {
      const index = i * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      
      // Calculate basic color variation
      const brightness = (r + g + b) / 3;
      if (brightness > 50 && brightness < 200) { // Avoid pure black/white
        colorVariation++;
      }
    }
    
    const variationRatio = colorVariation / sampleSize;
    console.log(`📸 Image validation - Color variation ratio: ${variationRatio.toFixed(3)}`);
    
    return variationRatio > 0.1; // At least 10% color variation
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
            Automated Chart Analysis with Advanced Screenshot
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

        {/* TradingView Chart with improved validation feedback */}
        <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
          <div className={`bg-gray-800/50 rounded-lg ${isMobile ? 'p-2' : 'p-4'}`}>
            {!isMobile && (
              <>
                <h3 className="text-white font-medium mb-2">Live Chart Preview</h3>
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

          {/* Status Indicators with better feedback */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isWidgetLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isWidgetLoaded ? 'Chart ready - Advanced capture enabled' : 'Loading chart with real data...'}
              </span>
            </div>
            {!isMobile && (
              <span className="text-xs text-gray-500">
                Advanced Screenshot • Content Validation • OpenRouter GPT-4.1 Mini
              </span>
            )}
          </div>

          {/* Analyze Button */}
          <Button 
            onClick={captureChartUsingRealScreenshot}
            disabled={!isWidgetLoaded || isCapturing || isAnalyzing}
            className={`w-full bg-primary hover:bg-primary/90 text-white ${isMobile ? 'h-10 text-sm' : ''}`}
          >
            {isCapturing ? 'Capturing & Validating Chart...' : isAnalyzing ? 'Analyzing...' : (
              <>
                <Camera className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                {isMobile ? 'Analyze Chart' : 'Capture Real Chart & Analyze'}
              </>
            )}
          </Button>

          {/* Updated Help Text */}
          {!isMobile && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-blue-400 font-medium text-sm mb-1">Advanced Chart Analysis</h4>
                  <p className="text-gray-400 text-xs">
                    Click "Analyze Chart" to capture a validated screenshot of the TradingView chart. Our advanced system validates chart content before sending to OpenRouter GPT-4.1 Mini for accurate analysis.
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
