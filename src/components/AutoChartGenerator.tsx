
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Download, Eye, AlertTriangle } from 'lucide-react';
import AutoTradingViewWidget from './AutoTradingViewWidget';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

interface AutoChartGeneratorProps {
  onAnalyze: (file: File, symbol: string, timeframe: string) => void;
  isAnalyzing: boolean;
}

const POPULAR_SYMBOLS = [
  { value: "CMCMARKETS:EURUSD", label: "EUR/USD" },
  { value: "CMCMARKETS:GBPUSD", label: "GBP/USD" },
  { value: "CMCMARKETS:USDJPY", label: "USD/JPY" },
  { value: "CMCMARKETS:AUDUSD", label: "AUD/USD" },
  { value: "CMCMARKETS:USDCAD", label: "USD/CAD" },
  { value: "CMCMARKETS:USDCHF", label: "USD/CHF" },
  { value: "CMCMARKETS:NZDUSD", label: "NZD/USD" },
  { value: "CMCMARKETS:XAUUSD", label: "XAU/USD (Gold)" },
  { value: "CMCMARKETS:XAGUSD", label: "XAG/USD (Silver)" },
  { value: "BINANCE:BTCUSDT", label: "BTC/USDT" },
  { value: "BINANCE:ETHUSDT", label: "ETH/USDT" },
  { value: "BINANCE:ADAUSDT", label: "ADA/USDT" },
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
  const [selectedSymbol, setSelectedSymbol] = useState("CMCMARKETS:EURUSD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("D");
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleWidgetLoad = useCallback(() => {
    setIsWidgetLoaded(true);
  }, []);

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
      console.log("🎯 Starting enhanced chart capture for:", { selectedSymbol, selectedTimeframe });
      
      // Extended wait time for chart to fully render
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Enhanced capture with multiple strategies and higher quality settings
      let canvas;
      
      try {
        console.log("📸 Attempting high-quality capture");
        canvas = await html2canvas(widgetRef.current, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#1a1a1a',
          scale: 2, // Higher scale for better quality
          logging: true,
          imageTimeout: 20000, // Longer timeout
          removeContainer: false,
          width: widgetRef.current.offsetWidth,
          height: widgetRef.current.offsetHeight,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });
        console.log("✅ High-quality capture successful, canvas size:", canvas.width, "x", canvas.height);
      } catch (error) {
        console.log("❌ High-quality capture failed, trying fallback method:", error);
        
        // Fallback with different settings
        canvas = await html2canvas(widgetRef.current, {
          useCORS: false,
          allowTaint: true,
          backgroundColor: '#1a1a1a',
          scale: 1.5, // Medium scale
          logging: true,
          imageTimeout: 15000,
          foreignObjectRendering: false,
          ignoreElements: (element) => {
            // Ignore potential problematic elements
            return element.tagName === 'IFRAME' && element.getAttribute('src')?.includes('tradingview');
          }
        });
        console.log("✅ Fallback capture successful, canvas size:", canvas.width, "x", canvas.height);
      }

      if (!canvas) {
        throw new Error("Failed to create canvas");
      }

      // Enhanced content validation
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      if (!imageData) {
        throw new Error("Failed to get image data from canvas");
      }

      // More sophisticated content analysis
      const pixels = imageData.data;
      let colorVariations = new Set();
      let nonBlackPixels = 0;
      const totalPixels = pixels.length / 4;
      
      // Sample every 10th pixel for performance
      for (let i = 0; i < pixels.length; i += 40) { // Every 10th pixel
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        if (a > 0) {
          const colorKey = `${Math.floor(r/10)}-${Math.floor(g/10)}-${Math.floor(b/10)}`;
          colorVariations.add(colorKey);
          
          // Count non-black/dark pixels
          if (r > 20 || g > 20 || b > 20) {
            nonBlackPixels++;
          }
        }
      }
      
      const contentPercentage = (nonBlackPixels / (totalPixels / 10)) * 100;
      const colorDiversity = colorVariations.size;
      
      console.log("📊 Enhanced image analysis:", {
        totalPixels,
        sampledPixels: totalPixels / 10,
        nonBlackPixels,
        contentPercentage: contentPercentage.toFixed(2) + "%",
        colorVariations: colorDiversity,
        canvasSize: `${canvas.width}x${canvas.height}`
      });
      
      // More lenient validation but still check for meaningful content
      if (contentPercentage < 2 || colorDiversity < 5) {
        throw new Error(`Captured image appears to lack chart content (${contentPercentage.toFixed(1)}% content, ${colorDiversity} color variations). The TradingView widget may not have loaded properly.`);
      }

      // Create preview URL for validation
      const previewUrl = canvas.toDataURL('image/png', 0.95); // High quality
      setLastCapturedImage(previewUrl);
      console.log("🖼️ High-quality preview URL created, size:", previewUrl.length, "characters");

      // Convert to blob with high quality
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            console.log("✅ High-quality blob created, size:", result.size, "bytes");
            resolve(result);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        }, 'image/png', 0.95);
      });

      // Create file from blob
      const timestamp = Date.now();
      const file = new File([blob], `chart-${selectedSymbol.replace(':', '-')}-${selectedTimeframe}-${timestamp}.png`, { type: 'image/png' });
      
      // Extract clean symbol name for analysis
      const symbolParts = selectedSymbol.split(':');
      const cleanSymbol = symbolParts[1] || selectedSymbol;
      
      // Get timeframe label
      const timeframeObj = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
      const timeframeLabel = timeframeObj?.label || selectedTimeframe;
      
      console.log("🚀 Sending enhanced capture to analysis:", {
        fileName: file.name,
        fileSize: file.size,
        cleanSymbol,
        timeframeLabel,
        canvasSize: `${canvas.width}x${canvas.height}`,
        contentPercentage: contentPercentage.toFixed(2) + "%",
        colorDiversity
      });
      
      onAnalyze(file, cleanSymbol, timeframeLabel);

    } catch (error) {
      console.error("❌ Error in enhanced capture:", error);
      
      let errorMessage = "Failed to capture the chart. ";
      
      if (error instanceof Error) {
        if (error.message.includes("content") || error.message.includes("variations")) {
          errorMessage += error.message + " Try waiting longer for the chart to load, or use Manual Upload instead.";
        } else if (error.message.includes("CORS") || error.message.includes("cross-origin")) {
          errorMessage += "Browser security restrictions detected. Please use Manual Upload to upload a screenshot.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Please try again or use Manual Upload.";
      }
      
      toast({
        title: "Enhanced Capture Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const previewLastCapture = () => {
    if (lastCapturedImage) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<img src="${lastCapturedImage}" style="max-width: 100%; height: auto;" />`);
      }
    }
  };

  const getSelectedSymbolLabel = () => {
    const symbol = POPULAR_SYMBOLS.find(s => s.value === selectedSymbol);
    return symbol?.label || selectedSymbol;
  };

  return (
    <Card className="w-full bg-chart-card border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Enhanced Automated Chart Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Symbol and Timeframe Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="symbol-select" className="text-white">Trading Pair</Label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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

          <div className="space-y-2">
            <Label htmlFor="timeframe-select" className="text-white">Timeframe</Label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Live Chart Preview</h3>
            <p className="text-gray-400 text-sm mb-4">
              Currently showing: {getSelectedSymbolLabel()} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
            </p>
            {/* Enhanced chart container with better responsive design */}
            <div 
              ref={widgetRef} 
              className="w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900"
              style={{ 
                minHeight: "600px",
                height: "700px"
              }}
            >
              <AutoTradingViewWidget 
                symbol={selectedSymbol}
                interval={selectedTimeframe}
                onLoad={handleWidgetLoad}
              />
            </div>
          </div>

          {/* Enhanced Status Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isWidgetLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-400">
                {isWidgetLoaded ? 'Chart loaded and ready for high-quality capture' : 'Loading chart...'}
              </span>
            </div>
            {lastCapturedImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={previewLastCapture}
                className="text-xs"
              >
                <Eye className="mr-1 h-3 w-3" />
                Preview Last Capture
              </Button>
            )}
          </div>

          {/* Enhanced Debug Info */}
          {isWidgetLoaded && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
              <p className="text-blue-400 text-sm">
                <strong>Enhanced Capture Ready:</strong> Using high-quality capture (2x scale) for {getSelectedSymbolLabel()} on {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label} timeframe. 
                Extended wait time and content validation ensure better analysis accuracy.
              </p>
            </div>
          )}

          {/* Enhanced Analyze Button */}
          <Button 
            onClick={captureAndAnalyze}
            disabled={!isWidgetLoaded || isCapturing || isAnalyzing}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            {isCapturing ? 'Capturing Chart (Enhanced)...' : isAnalyzing ? 'Analyzing...' : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Enhanced Capture & Analyze Chart
              </>
            )}
          </Button>

          {/* Enhanced Help Text */}
          <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-orange-400 font-medium text-sm mb-1">Enhanced Capture Method</h4>
                <p className="text-gray-400 text-xs">
                  This version uses high-quality capture (2x resolution), extended loading time, and enhanced content validation. 
                  If issues persist, the TradingView widget may have built-in restrictions. Manual Upload remains available as a reliable alternative.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoChartGenerator;
