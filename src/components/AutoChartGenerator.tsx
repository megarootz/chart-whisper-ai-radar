import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Download, AlertTriangle } from 'lucide-react';
import AutoTradingViewWidget from './AutoTradingViewWidget';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface AutoChartGeneratorProps {
  onAnalyze: (file: File, symbol: string, timeframe: string) => void;
  isAnalyzing: boolean;
}

// Updated symbol mappings with correct TradingView symbols
const POPULAR_SYMBOLS = [
  { value: "FX:EURUSD", label: "EUR/USD", cleanSymbol: "EUR/USD" },
  { value: "FX:GBPUSD", label: "GBP/USD", cleanSymbol: "GBP/USD" },
  { value: "FX:USDJPY", label: "USD/JPY", cleanSymbol: "USD/JPY" },
  { value: "FX:AUDUSD", label: "AUD/USD", cleanSymbol: "AUD/USD" },
  { value: "FX:USDCAD", label: "USD/CAD", cleanSymbol: "USD/CAD" },
  { value: "FX:USDCHF", label: "USD/CHF", cleanSymbol: "USD/CHF" },
  { value: "FX:NZDUSD", label: "NZD/USD", cleanSymbol: "NZD/USD" },
  { value: "TVC:GOLD", label: "XAU/USD (Gold)", cleanSymbol: "XAU/USD" },
  { value: "TVC:SILVER", label: "XAG/USD (Silver)", cleanSymbol: "XAG/USD" },
  { value: "BINANCE:BTCUSDT", label: "BTC/USDT", cleanSymbol: "BTC/USDT" },
  { value: "BINANCE:ETHUSDT", label: "ETH/USDT", cleanSymbol: "ETH/USDT" },
  { value: "BINANCE:ADAUSDT", label: "ADA/USDT", cleanSymbol: "ADA/USDT" },
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
      const symbolObj = POPULAR_SYMBOLS.find(s => s.value === selectedSymbol);
      const cleanSymbol = symbolObj?.cleanSymbol || selectedSymbol;
      
      console.log("🎯 Starting capture for:", { 
        selectedSymbol, 
        cleanSymbol, 
        selectedTimeframe 
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
    const symbol = POPULAR_SYMBOLS.find(s => s.value === selectedSymbol);
    return symbol?.label || selectedSymbol;
  };

  // Reset widget loaded state when symbol changes
  const handleSymbolChange = (newSymbol: string) => {
    console.log("🔄 Symbol change from", selectedSymbol, "to", newSymbol);
    setSelectedSymbol(newSymbol);
    setIsWidgetLoaded(false); // Reset loaded state
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    console.log("🔄 Timeframe change from", selectedTimeframe, "to", newTimeframe);
    setSelectedTimeframe(newTimeframe);
    setIsWidgetLoaded(false); // Reset loaded state
  };

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
        {/* Mobile optimized Symbol and Timeframe Selection */}
        <div className={`${isMobile ? 'grid grid-cols-2 gap-2 mb-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <div className="space-y-1">
            <Label htmlFor="symbol-select" className={`text-white ${isMobile ? 'text-sm' : ''}`}>Trading Pair</Label>
            <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
              <SelectTrigger className={`bg-gray-800 border-gray-700 text-white ${isMobile ? 'h-9 text-sm' : ''}`}>
                <SelectValue placeholder="Select a trading pair" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {POPULAR_SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol.value} value={symbol.value} className="text-white hover:bg-gray-700">
                    {symbol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    For best results, wait for the chart to fully load before analysis. The system will automatically detect and analyze the selected trading pair.
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
