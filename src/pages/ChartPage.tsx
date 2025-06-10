import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Camera, ArrowLeft, Plus } from 'lucide-react';
import AutoTradingViewWidget from '@/components/AutoTradingViewWidget';
import { useToast } from '@/hooks/use-toast';
import { useChartAnalysis } from '@/hooks/useChartAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import RadarAnimation from '@/components/RadarAnimation';

// Same trading pairs as before
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

const ChartPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("OANDA:EURUSD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("D");
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPair, setCustomPair] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { analyzeChart, isAnalyzing } = useChartAnalysis();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleWidgetLoad = useCallback(() => {
    console.log("📊 Widget loaded for symbol:", selectedSymbol);
    setIsWidgetLoaded(true);
  }, [selectedSymbol]);

  const findAndClickCameraButton = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log("🔍 Searching for TradingView camera button...");
      
      // Multiple attempts to find the camera button
      let attempts = 0;
      const maxAttempts = 20;
      
      const searchInterval = setInterval(() => {
        attempts++;
        
        // Look for various camera button selectors in TradingView
        const selectors = [
          '[data-name="take-screenshot"]',
          '[aria-label*="screenshot" i]',
          '[aria-label*="camera" i]',
          '[title*="screenshot" i]',
          '[title*="camera" i]',
          'button[class*="camera"]',
          'button[class*="screenshot"]',
          '.tv-header__screenshot',
          '.js-screenshot-button'
        ];
        
        let cameraButton: HTMLElement | null = null;
        
        // Search in widget container and iframes
        const containers = [
          document,
          ...(widgetRef.current ? [widgetRef.current] : []),
          ...Array.from(document.querySelectorAll('iframe')).map(iframe => {
            try {
              return iframe.contentDocument || iframe.contentWindow?.document;
            } catch (e) {
              return null;
            }
          }).filter(Boolean)
        ];
        
        for (const container of containers) {
          if (!container) continue;
          
          for (const selector of selectors) {
            const element = container.querySelector(selector) as HTMLElement;
            if (element && element.offsetParent !== null) {
              cameraButton = element;
              break;
            }
          }
          
          if (cameraButton) break;
        }
        
        if (cameraButton) {
          console.log("📸 Found camera button! Clicking...");
          clearInterval(searchInterval);
          
          // Click the camera button
          cameraButton.click();
          
          // Give time for the download to initiate
          setTimeout(() => {
            resolve(true);
          }, 1000);
        } else if (attempts >= maxAttempts) {
          console.log("❌ Camera button not found after", maxAttempts, "attempts");
          clearInterval(searchInterval);
          resolve(false);
        }
      }, 500);
    });
  };

  const monitorDownload = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      console.log("📥 Monitoring for downloaded image...");
      
      // Create a temporary input element to capture file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          console.log("📁 Image file captured:", file.name, file.size);
          resolve(file);
        } else {
          reject(new Error("No file selected"));
        }
        document.body.removeChild(input);
      };
      
      document.body.appendChild(input);
      
      // Fallback: If TradingView doesn't trigger download, create a manual screenshot
      setTimeout(() => {
        console.log("⏰ Download timeout - attempting manual screenshot...");
        
        // Try to get canvas from TradingView widget
        const canvas = widgetRef.current?.querySelector('canvas');
        if (canvas) {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `chart-${Date.now()}.png`, { type: 'image/png' });
              console.log("📸 Manual screenshot captured:", file.size);
              resolve(file);
            } else {
              reject(new Error("Failed to capture chart screenshot"));
            }
          }, 'image/png');
        } else {
          reject(new Error("Could not find chart canvas for screenshot"));
        }
        
        document.body.removeChild(input);
      }, 5000);
    });
  };

  const captureChartWithCamera = async () => {
    if (!widgetRef.current || !isWidgetLoaded) {
      toast({
        title: "Chart Not Ready",
        description: "Please wait for the chart to fully load before analyzing",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze charts",
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
      
      const timeframeObj = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
      const timeframeLabel = timeframeObj?.label || selectedTimeframe;
      
      console.log("📸 Starting TradingView camera capture for:", { cleanSymbol, timeframeLabel });
      
      // Attempt to click camera button and get download
      const cameraClicked = await findAndClickCameraButton();
      
      let imageFile: File;
      
      if (cameraClicked) {
        // Monitor for download
        imageFile = await monitorDownload();
      } else {
        // Fallback: manual canvas capture
        const canvas = widgetRef.current.querySelector('canvas');
        if (!canvas) {
          throw new Error("Cannot capture chart - no canvas found");
        }
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to convert canvas to blob"));
          }, 'image/png');
        });
        
        imageFile = new File([blob], `chart-${cleanSymbol.replace('/', '-')}-${selectedTimeframe}-${Date.now()}.png`, { 
          type: 'image/png' 
        });
      }
      
      console.log("🚀 Sending chart image for analysis:", {
        fileName: imageFile.name,
        fileSize: Math.round(imageFile.size / 1024) + "KB",
        cleanSymbol,
        timeframeLabel
      });
      
      toast({
        title: "Chart Captured",
        description: `${cleanSymbol} chart captured (${Math.round(imageFile.size / 1024)}KB). Analyzing with GPT-4.1-mini...`,
        variant: "default"
      });
      
      // Send for analysis
      analyzeChart(imageFile, cleanSymbol, timeframeLabel);
      
      // Navigate back to analysis page to show results
      setTimeout(() => {
        navigate('/analyze');
      }, 1000);

    } catch (error) {
      console.error("❌ Error capturing chart:", error);
      
      toast({
        title: "Capture Failed",
        description: error instanceof Error ? error.message : "Failed to capture the chart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
    setIsWidgetLoaded(false);
    setShowCustomInput(false);
  };

  const handleTimeframeChange = (newTimeframe: string) => {
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
    
    setSelectedSymbol(tradingViewSymbol);
    setIsWidgetLoaded(false);
  };

  const getSelectedSymbolLabel = () => {
    if (showCustomInput && customPair) {
      return customPair.toUpperCase();
    }
    const symbol = FOREX_PAIRS.find(s => s.value === selectedSymbol);
    return symbol?.label || selectedSymbol;
  };

  // Group pairs by category
  const groupedPairs = FOREX_PAIRS.reduce((acc, pair) => {
    if (!acc[pair.category]) {
      acc[pair.category] = [];
    }
    acc[pair.category].push(pair);
    return acc;
  }, {} as Record<string, typeof FOREX_PAIRS>);

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      {/* Analysis Animation */}
      {isAnalyzing && <RadarAnimation />}
      
      {/* Top Controls Bar */}
      <div className="bg-chart-card border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/analyze')}
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analysis
            </Button>
            
            <div className="text-white font-medium">
              Full-Screen Chart Analysis
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isWidgetLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-gray-400 text-sm">
              {isWidgetLoaded ? 'Chart Ready' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-chart-card border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Symbol Selection */}
            <div className="space-y-2">
              <Label className="text-white">Trading Pair</Label>
              {!showCustomInput ? (
                <div className="space-y-2">
                  <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
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
                    size="sm"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Custom Pair
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Enter pair (e.g., EUR/USD)"
                    value={customPair}
                    onChange={(e) => setCustomPair(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomPairSubmit()}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCustomPairSubmit} className="flex-1 bg-primary hover:bg-primary/90">
                      Use Pair
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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

            {/* Timeframe */}
            <div className="space-y-2">
              <Label className="text-white">Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
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

            {/* Analyze Button */}
            <div className="space-y-2">
              <Label className="text-white">Analysis</Label>
              <Button 
                onClick={captureChartWithCamera}
                disabled={!isWidgetLoaded || isCapturing || isAnalyzing}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                {isCapturing ? 'Capturing Chart...' : isAnalyzing ? 'Analyzing...' : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture & Analyze Chart
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-gray-400 text-sm">
              Currently viewing: {getSelectedSymbolLabel()} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Full-Screen Chart */}
      <div className="flex-1 p-4">
        <div className="h-full max-w-7xl mx-auto">
          <div 
            ref={widgetRef} 
            className="w-full h-full overflow-hidden rounded-lg border border-gray-700 bg-[#131722]"
            style={{ minHeight: 'calc(100vh - 200px)' }}
          >
            <AutoTradingViewWidget 
              symbol={selectedSymbol}
              interval={selectedTimeframe}
              onLoad={handleWidgetLoad}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartPage;
