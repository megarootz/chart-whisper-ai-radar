import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Download } from 'lucide-react';
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
      // Wait a bit more to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try multiple capture strategies
      let canvas;
      
      // Strategy 1: Try to capture the entire widget container
      try {
        canvas = await html2canvas(widgetRef.current, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#1a1a1a',
          scale: 1,
          logging: false,
          imageTimeout: 15000,
          removeContainer: false,
        });
      } catch (error) {
        console.log("Strategy 1 failed, trying strategy 2:", error);
        
        // Strategy 2: Try with different options
        canvas = await html2canvas(widgetRef.current, {
          useCORS: false,
          allowTaint: true,
          backgroundColor: '#1a1a1a',
          scale: 1,
          logging: false,
          imageTimeout: 10000,
          foreignObjectRendering: false,
        });
      }

      if (!canvas) {
        throw new Error("Failed to create canvas");
      }

      // Check if canvas has content (not just blank)
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      if (!imageData || imageData.data.every(pixel => pixel === 0)) {
        throw new Error("Captured image appears to be blank. This may be due to browser security restrictions with the TradingView widget.");
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        }, 'image/png', 0.9);
      });

      // Create file from blob
      const file = new File([blob], `chart-${Date.now()}.png`, { type: 'image/png' });
      
      // Extract clean symbol name for analysis
      const symbolParts = selectedSymbol.split(':');
      const cleanSymbol = symbolParts[1] || selectedSymbol;
      
      // Get timeframe label
      const timeframeObj = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
      const timeframeLabel = timeframeObj?.label || selectedTimeframe;
      
      onAnalyze(file, cleanSymbol, timeframeLabel);

    } catch (error) {
      console.error("Error capturing chart:", error);
      
      let errorMessage = "Failed to capture the chart. ";
      
      if (error instanceof Error) {
        if (error.message.includes("blank")) {
          errorMessage += "The captured image appears to be blank. This usually happens due to browser security restrictions with external widgets. Please try using the Manual Upload option instead.";
        } else if (error.message.includes("CORS") || error.message.includes("cross-origin")) {
          errorMessage += "Browser security restrictions prevent capturing this widget. Please use the Manual Upload option to upload a screenshot instead.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Please try again or use the Manual Upload option.";
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

  return (
    <Card className="w-full bg-chart-card border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Automated Chart Analysis
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
            <div ref={widgetRef}>
              <AutoTradingViewWidget 
                symbol={selectedSymbol}
                interval={selectedTimeframe}
                onLoad={handleWidgetLoad}
              />
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isWidgetLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-400">
                {isWidgetLoaded ? 'Chart loaded and ready' : 'Loading chart...'}
              </span>
            </div>
          </div>

          {/* Analyze Button */}
          <Button 
            onClick={captureAndAnalyze}
            disabled={!isWidgetLoaded || isCapturing || isAnalyzing}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            {isCapturing ? 'Capturing Chart...' : isAnalyzing ? 'Analyzing...' : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Capture & Analyze Chart
              </>
            )}
          </Button>

          {/* Help Text */}
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> Due to browser security restrictions, automatic chart capture may not always work with external widgets. 
              If you encounter issues, please use the "Manual Upload" tab to upload a screenshot of your chart instead.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoChartGenerator;
