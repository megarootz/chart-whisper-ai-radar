
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, Download, AlertTriangle, Plus } from 'lucide-react';
import AutoTradingViewWidget from './AutoTradingViewWidget';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface AutoChartGeneratorProps {
  onAnalyze: (file: File, symbol: string, timeframe: string) => void;
  isAnalyzing: boolean;
}

// Comprehensive Forex pairs including majors, minors, and exotics
const FOREX_PAIRS = [
  // Major Pairs
  { value: "FX:EURUSD", label: "EUR/USD", cleanSymbol: "EUR/USD", category: "Major" },
  { value: "FX:GBPUSD", label: "GBP/USD", cleanSymbol: "GBP/USD", category: "Major" },
  { value: "FX:USDJPY", label: "USD/JPY", cleanSymbol: "USD/JPY", category: "Major" },
  { value: "FX:USDCHF", label: "USD/CHF", cleanSymbol: "USD/CHF", category: "Major" },
  { value: "FX:AUDUSD", label: "AUD/USD", cleanSymbol: "AUD/USD", category: "Major" },
  { value: "FX:USDCAD", label: "USD/CAD", cleanSymbol: "USD/CAD", category: "Major" },
  { value: "FX:NZDUSD", label: "NZD/USD", cleanSymbol: "NZD/USD", category: "Major" },
  
  // Minor Pairs (Cross Currency Pairs)
  { value: "FX:EURGBP", label: "EUR/GBP", cleanSymbol: "EUR/GBP", category: "Minor" },
  { value: "FX:EURJPY", label: "EUR/JPY", cleanSymbol: "EUR/JPY", category: "Minor" },
  { value: "FX:EURCHF", label: "EUR/CHF", cleanSymbol: "EUR/CHF", category: "Minor" },
  { value: "FX:EURAUD", label: "EUR/AUD", cleanSymbol: "EUR/AUD", category: "Minor" },
  { value: "FX:EURCAD", label: "EUR/CAD", cleanSymbol: "EUR/CAD", category: "Minor" },
  { value: "FX:EURNZD", label: "EUR/NZD", cleanSymbol: "EUR/NZD", category: "Minor" },
  { value: "FX:GBPJPY", label: "GBP/JPY", cleanSymbol: "GBP/JPY", category: "Minor" },
  { value: "FX:GBPCHF", label: "GBP/CHF", cleanSymbol: "GBP/CHF", category: "Minor" },
  { value: "FX:GBPAUD", label: "GBP/AUD", cleanSymbol: "GBP/AUD", category: "Minor" },
  { value: "FX:GBPCAD", label: "GBP/CAD", cleanSymbol: "GBP/CAD", category: "Minor" },
  { value: "FX:GBPNZD", label: "GBP/NZD", cleanSymbol: "GBP/NZD", category: "Minor" },
  { value: "FX:AUDJPY", label: "AUD/JPY", cleanSymbol: "AUD/JPY", category: "Minor" },
  { value: "FX:AUDCHF", label: "AUD/CHF", cleanSymbol: "AUD/CHF", category: "Minor" },
  { value: "FX:AUDCAD", label: "AUD/CAD", cleanSymbol: "AUD/CAD", category: "Minor" },
  { value: "FX:AUDNZD", label: "AUD/NZD", cleanSymbol: "AUD/NZD", category: "Minor" },
  { value: "FX:CADJPY", label: "CAD/JPY", cleanSymbol: "CAD/JPY", category: "Minor" },
  { value: "FX:CADCHF", label: "CAD/CHF", cleanSymbol: "CAD/CHF", category: "Minor" },
  { value: "FX:CHFJPY", label: "CHF/JPY", cleanSymbol: "CHF/JPY", category: "Minor" },
  { value: "FX:NZDJPY", label: "NZD/JPY", cleanSymbol: "NZD/JPY", category: "Minor" },
  { value: "FX:NZDCHF", label: "NZD/CHF", cleanSymbol: "NZD/CHF", category: "Minor" },
  { value: "FX:NZDCAD", label: "NZD/CAD", cleanSymbol: "NZD/CAD", category: "Minor" },
  
  // Exotic Pairs (Major currencies vs emerging market currencies)
  { value: "FX:USDMXN", label: "USD/MXN", cleanSymbol: "USD/MXN", category: "Exotic" },
  { value: "FX:USDTRY", label: "USD/TRY", cleanSymbol: "USD/TRY", category: "Exotic" },
  { value: "FX:USDZAR", label: "USD/ZAR", cleanSymbol: "USD/ZAR", category: "Exotic" },
  { value: "FX:USDHKD", label: "USD/HKD", cleanSymbol: "USD/HKD", category: "Exotic" },
  { value: "FX:USDSGD", label: "USD/SGD", cleanSymbol: "USD/SGD", category: "Exotic" },
  { value: "FX:USDNOK", label: "USD/NOK", cleanSymbol: "USD/NOK", category: "Exotic" },
  { value: "FX:USDSEK", label: "USD/SEK", cleanSymbol: "USD/SEK", category: "Exotic" },
  { value: "FX:USDDKK", label: "USD/DKK", cleanSymbol: "USD/DKK", category: "Exotic" },
  { value: "FX:USDPLN", label: "USD/PLN", cleanSymbol: "USD/PLN", category: "Exotic" },
  { value: "FX:USDCZK", label: "USD/CZK", cleanSymbol: "USD/CZK", category: "Exotic" },
  { value: "FX:USDHUF", label: "USD/HUF", cleanSymbol: "USD/HUF", category: "Exotic" },
  { value: "FX:EURTRY", label: "EUR/TRY", cleanSymbol: "EUR/TRY", category: "Exotic" },
  { value: "FX:EURZAR", label: "EUR/ZAR", cleanSymbol: "EUR/ZAR", category: "Exotic" },
  { value: "FX:EURNOK", label: "EUR/NOK", cleanSymbol: "EUR/NOK", category: "Exotic" },
  { value: "FX:EURSEK", label: "EUR/SEK", cleanSymbol: "EUR/SEK", category: "Exotic" },
  { value: "FX:EURPLN", label: "EUR/PLN", cleanSymbol: "EUR/PLN", category: "Exotic" },
  { value: "FX:GBPTRY", label: "GBP/TRY", cleanSymbol: "GBP/TRY", category: "Exotic" },
  { value: "FX:GBPZAR", label: "GBP/ZAR", cleanSymbol: "GBP/ZAR", category: "Exotic" },
  { value: "FX:GBPNOK", label: "GBP/NOK", cleanSymbol: "GBP/NOK", category: "Exotic" },
  { value: "FX:GBPSEK", label: "GBP/SEK", cleanSymbol: "GBP/SEK", category: "Exotic" },
  
  // Commodities
  { value: "TVC:GOLD", label: "XAU/USD (Gold)", cleanSymbol: "XAU/USD", category: "Commodity" },
  { value: "TVC:SILVER", label: "XAG/USD (Silver)", cleanSymbol: "XAG/USD", category: "Commodity" },
  
  // Major Cryptocurrencies
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
  const [selectedSymbol, setSelectedSymbol] = useState("FX:EURUSD");
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

  const captureAndAnalyze = async () => {
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
      
      console.log("🎯 Starting capture for:", { 
        selectedSymbol, 
        cleanSymbol, 
        selectedTimeframe,
        isCustomPair: showCustomInput
      });
      
      // Extended wait time for chart to fully render with correct symbol
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Capture with high quality settings
      const canvas = await html2canvas(widgetRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#131722',
        scale: 2,
        logging: true,
        imageTimeout: 25000,
        removeContainer: false,
        width: widgetRef.current.offsetWidth,
        height: widgetRef.current.offsetHeight,
      });

      console.log("✅ Canvas captured, size:", canvas.width, "x", canvas.height);

      // Validate canvas content
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      if (!imageData) {
        throw new Error("Failed to get image data from canvas");
      }

      // Enhanced content validation
      const pixels = imageData.data;
      let colorVariations = new Set();
      let nonBlackPixels = 0;
      const totalPixels = pixels.length / 4;
      
      for (let i = 0; i < pixels.length; i += 40) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        if (a > 0) {
          const colorKey = `${Math.floor(r/10)}-${Math.floor(g/10)}-${Math.floor(b/10)}`;
          colorVariations.add(colorKey);
          
          if (r > 20 || g > 20 || b > 20) {
            nonBlackPixels++;
          }
        }
      }
      
      const contentPercentage = (nonBlackPixels / (totalPixels / 10)) * 100;
      const colorDiversity = colorVariations.size;
      
      console.log("📊 Enhanced capture analysis:", {
        contentPercentage: contentPercentage.toFixed(2) + "%",
        colorVariations: colorDiversity,
        canvasSize: `${canvas.width}x${canvas.height}`,
        selectedSymbol,
        cleanSymbol
      });
      
      if (contentPercentage < 3 || colorDiversity < 8) {
        throw new Error(`Captured image appears to lack sufficient chart content (${contentPercentage.toFixed(1)}% content, ${colorDiversity} color variations). Please wait longer for the chart to load.`);
      }

      // Create file from canvas
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
      const file = new File([blob], `chart-${cleanSymbol.replace('/', '-')}-${selectedTimeframe}-${timestamp}.png`, { 
        type: 'image/png' 
      });
      
      const timeframeObj = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
      const timeframeLabel = timeframeObj?.label || selectedTimeframe;
      
      console.log("🚀 Sending to analysis:", {
        fileName: file.name,
        fileSize: file.size,
        cleanSymbol,
        timeframeLabel,
        originalSymbol: selectedSymbol
      });
      
      // Pass the clean symbol for analysis
      onAnalyze(file, cleanSymbol, timeframeLabel);

    } catch (error) {
      console.error("❌ Error in capture:", error);
      
      let errorMessage = "Failed to capture the chart. ";
      
      if (error instanceof Error) {
        if (error.message.includes("content") || error.message.includes("variations")) {
          errorMessage += error.message + " Try waiting longer for the chart to load.";
        } else {
          errorMessage += error.message;
        }
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
            >
              <AutoTradingViewWidget 
                symbol={selectedSymbol}
                interval={selectedTimeframe}
                onLoad={handleWidgetLoad}
              />
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isWidgetLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isWidgetLoaded ? 'Chart ready' : 'Loading...'}
              </span>
            </div>
          </div>

          {/* Analyze Button */}
          <Button 
            onClick={captureAndAnalyze}
            disabled={!isWidgetLoaded || isCapturing || isAnalyzing}
            className={`w-full bg-primary hover:bg-primary/90 text-white ${isMobile ? 'h-10 text-sm' : ''}`}
          >
            {isCapturing ? 'Capturing...' : isAnalyzing ? 'Analyzing...' : (
              <>
                <Download className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                {isMobile ? 'Capture & Analyze' : 'Enhanced Capture & Analyze Chart'}
              </>
            )}
          </Button>

          {/* Help Text */}
          {!isMobile && (
            <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-orange-400 font-medium text-sm mb-1">Trading Chart Tips</h4>
                  <p className="text-gray-400 text-xs">
                    For best results, wait for the chart to fully load before analysis. Use the custom pair input for any trading pair not in the list.
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
