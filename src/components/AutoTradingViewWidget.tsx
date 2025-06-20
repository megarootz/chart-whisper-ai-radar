
import React, { useEffect, useRef, memo, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { Camera, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureWidgetScreenshot, dataUrlToFile } from '@/utils/screenshotUtils';

interface AutoTradingViewWidgetProps {
  symbol: string;
  interval: string;
  onLoad?: () => void;
  showCameraButton?: boolean;
}

export interface AutoTradingViewWidgetRef {
  captureScreenshot: () => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  getContainer: () => HTMLDivElement | null;
}

const AutoTradingViewWidget = forwardRef<AutoTradingViewWidgetRef, AutoTradingViewWidgetProps>(
  ({ symbol, interval, onLoad, showCameraButton = true }, ref) => {
    const container = useRef<HTMLDivElement>(null);
    const scriptLoaded = useRef(false);
    const currentSymbol = useRef<string>('');
    const currentInterval = useRef<string>('');
    const loadingTimeout = useRef<NodeJS.Timeout>();
    const [isCapturing, setIsCapturing] = useState(false);
    const [chartReady, setChartReady] = useState(false);

    const captureScreenshot = useCallback(async () => {
      if (!container.current) {
        return { success: false, error: 'Container not available' };
      }

      try {
        console.log('📸 Starting screenshot capture process...');
        console.log('📦 Container details:', {
          width: container.current.offsetWidth,
          height: container.current.offsetHeight,
          children: container.current.children.length
        });
        
        // Check if iframe is present and loaded
        const iframe = container.current.querySelector('iframe');
        if (!iframe) {
          console.error('❌ No TradingView iframe found');
          return { success: false, error: 'TradingView chart not loaded - iframe missing' };
        }
        
        console.log('📊 TradingView iframe found:', {
          src: iframe.src,
          width: iframe.offsetWidth,
          height: iframe.offsetHeight
        });
        
        // Wait a bit more for chart rendering to be complete
        console.log('⏳ Final wait for chart rendering...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📸 Calling captureWidgetScreenshot...');
        
        const result = await captureWidgetScreenshot(container.current, {
          scale: 1,
          useCORS: true
        });
        
        if (result.success && result.dataUrl) {
          console.log('✅ Screenshot captured successfully, size:', result.dataUrl.length);
        } else {
          console.error('❌ Screenshot capture failed:', result.error);
        }
        
        return result;
      } catch (error) {
        console.error('❌ Screenshot capture error:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Screenshot failed' 
        };
      }
    }, []);

    const getContainer = useCallback(() => container.current, []);

    useImperativeHandle(ref, () => ({
      captureScreenshot,
      getContainer
    }), [captureScreenshot, getContainer]);

    const handleDownloadChart = useCallback(async () => {
      if (!chartReady || isCapturing) return;

      setIsCapturing(true);
      try {
        console.log('📸 Downloading chart screenshot...');
        const result = await captureScreenshot();
        
        if (result.success && result.dataUrl) {
          // Convert to file and download
          const filename = `${symbol.replace('OANDA:', '')}-${interval}-chart.png`;
          const file = dataUrlToFile(result.dataUrl, filename);
          
          // Create download link
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          console.log('✅ Chart downloaded successfully:', filename);
        } else {
          console.error('❌ Failed to capture chart:', result.error);
          alert('Failed to capture chart: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('❌ Download error:', error);
        alert('Failed to download chart screenshot');
      } finally {
        setIsCapturing(false);
      }
    }, [captureScreenshot, symbol, interval, chartReady, isCapturing]);

    const createWidget = useCallback(() => {
      if (!container.current) return;

      // Clear any existing timeout
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }

      // Clear previous widget
      container.current.innerHTML = '';
      scriptLoaded.current = false;
      setChartReady(false);

      console.log("🔄 Creating TradingView widget with symbol:", symbol, "interval:", interval);

      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "autosize": true,
          "symbol": "${symbol}",
          "interval": "${interval}",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "allow_symbol_change": true,
          "support_host": "https://www.tradingview.com",
          "calendar": false,
          "studies": [],
          "show_popup_button": false,
          "popup_width": "1000",
          "popup_height": "650",
          "save_image": false
        }`;
      
      script.onload = () => {
        console.log("✅ TradingView widget script loaded for symbol:", symbol);
        scriptLoaded.current = true;
        
        // Wait longer for widget to initialize and render properly
        loadingTimeout.current = setTimeout(() => {
          console.log("🏁 TradingView widget should be ready for:", symbol);
          
          // Check that iframe is present
          const iframe = container.current?.querySelector('iframe');
          if (iframe) {
            console.log("📊 Iframe confirmed, chart ready");
            setChartReady(true);
            onLoad?.();
          } else {
            console.warn("⚠️ Iframe not found, but calling onLoad anyway");
            onLoad?.();
          }
        }, 6000); // Increased to 6 seconds for better loading
      };

      script.onerror = (e) => {
        console.error("❌ TradingView widget script failed to load:", e);
      };

      container.current.appendChild(script);
      
      // Update refs to track current values
      currentSymbol.current = symbol;
      currentInterval.current = interval;
    }, [symbol, interval, onLoad]);

    useEffect(() => {
      console.log("🔄 TradingView widget effect triggered for pair:", { symbol, interval });
      // Always recreate widget when symbol or interval changes
      if (currentSymbol.current !== symbol || currentInterval.current !== interval || !scriptLoaded.current) {
        console.log("🆕 Recreating widget for pair:", {
          oldSymbol: currentSymbol.current,
          newSymbol: symbol,
          oldInterval: currentInterval.current,
          newInterval: interval,
          scriptLoaded: scriptLoaded.current
        });
        createWidget();
      }
    }, [symbol, interval, createWidget]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current);
        }
      };
    }, []);

    return (
      <div className="relative w-full h-full">
        <div 
          className="tradingview-widget-container" 
          ref={container} 
          style={{ height: "100%", width: "100%", minHeight: "400px" }}
        >
          <div 
            className="tradingview-widget-container__widget" 
            style={{ height: "calc(100% - 32px)", width: "100%" }}
          ></div>
          <div className="tradingview-widget-copyright">
            <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
              <span className="blue-text">Track all markets on TradingView</span>
            </a>
          </div>
        </div>

        {/* Floating Camera Button */}
        {showCameraButton && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={handleDownloadChart}
              disabled={!chartReady || isCapturing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              title="Download Chart Screenshot"
            >
              {isCapturing ? (
                <Download className="h-4 w-4 animate-pulse" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }
);

AutoTradingViewWidget.displayName = 'AutoTradingViewWidget';

export default memo(AutoTradingViewWidget);
