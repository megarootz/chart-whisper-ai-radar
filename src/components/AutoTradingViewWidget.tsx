
import React, { useEffect, useRef, memo, useCallback, forwardRef, useImperativeHandle } from 'react';

interface AutoTradingViewWidgetProps {
  symbol: string;
  interval: string;
  onLoad?: () => void;
}

export interface AutoTradingViewWidgetRef {
  captureScreenshot: () => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  getContainer: () => HTMLDivElement | null;
}

const AutoTradingViewWidget = forwardRef<AutoTradingViewWidgetRef, AutoTradingViewWidgetProps>(
  ({ symbol, interval, onLoad }, ref) => {
    const container = useRef<HTMLDivElement>(null);
    const scriptLoaded = useRef(false);
    const currentSymbol = useRef<string>('');
    const currentInterval = useRef<string>('');
    const loadingTimeout = useRef<NodeJS.Timeout>();

    const captureScreenshot = useCallback(async () => {
      if (!container.current) {
        return { success: false, error: 'Container not available' };
      }

      try {
        console.log('📸 Starting screenshot capture process...');
        
        // Wait additional time to ensure chart data is loaded
        console.log('⏳ Waiting for chart data to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if iframe is present and loaded
        const iframe = container.current.querySelector('iframe');
        if (!iframe) {
          console.error('❌ No TradingView iframe found');
          return { success: false, error: 'TradingView chart not loaded' };
        }
        
        console.log('📊 TradingView iframe found, proceeding with capture');
        
        const { captureWidgetScreenshot } = await import('@/utils/screenshotUtils');
        const result = await captureWidgetScreenshot(container.current, {
          scale: 2,
          useCORS: true
        });
        
        if (result.success && result.dataUrl) {
          // Validate screenshot size to ensure it contains chart data
          if (result.dataUrl.length < 100000) {
            console.warn('⚠️ Screenshot appears too small, might not contain chart data');
            return { 
              success: false, 
              error: 'Screenshot appears incomplete. Chart may not be fully loaded.' 
            };
          }
          console.log('✅ Screenshot captured successfully, size:', result.dataUrl.length);
        }
        
        return result;
      } catch (error) {
        console.error('Screenshot capture failed:', error);
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

    const createWidget = useCallback(() => {
      if (!container.current) return;

      // Clear any existing timeout
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }

      // Clear previous widget
      container.current.innerHTML = '';
      scriptLoaded.current = false;

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
          "popup_height": "650"
        }`;
      
      script.onload = () => {
        console.log("✅ TradingView widget script loaded for symbol:", symbol);
        scriptLoaded.current = true;
        
        // Set a longer timeout to ensure the chart loads with real data
        loadingTimeout.current = setTimeout(() => {
          console.log("🏁 TradingView widget ready with chart data for:", symbol);
          
          // Double-check that iframe is present before calling onLoad
          const iframe = container.current?.querySelector('iframe');
          if (iframe) {
            console.log("📊 Iframe confirmed present, calling onLoad");
            onLoad?.();
          } else {
            console.warn("⚠️ Iframe not found after timeout, retrying...");
            // Retry after another 3 seconds
            setTimeout(() => {
              const retryIframe = container.current?.querySelector('iframe');
              if (retryIframe) {
                console.log("📊 Iframe found on retry, calling onLoad");
                onLoad?.();
              } else {
                console.error("❌ Iframe still not found after retry");
              }
            }, 3000);
          }
        }, 10000); // Increased to 10 seconds for better chart loading
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
      // Always recreate widget when symbol or interval changes to ensure fresh data
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
      <div 
        className="tradingview-widget-container" 
        ref={container} 
        style={{ height: "100%", width: "100%" }}
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
    );
  }
);

AutoTradingViewWidget.displayName = 'AutoTradingViewWidget';

export default memo(AutoTradingViewWidget);
