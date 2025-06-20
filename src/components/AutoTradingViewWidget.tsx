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
        
        // Additional wait to ensure chart rendering is complete
        console.log('⏳ Final wait for chart rendering...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { captureWidgetScreenshot } = await import('@/utils/screenshotUtils');
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
          "popup_height": "650",
          "save_image": false
        }`;
      
      script.onload = () => {
        console.log("✅ TradingView widget script loaded for symbol:", symbol);
        scriptLoaded.current = true;
        
        // Wait for widget to initialize and render
        loadingTimeout.current = setTimeout(() => {
          console.log("🏁 TradingView widget should be ready for:", symbol);
          
          // Check that iframe is present
          const iframe = container.current?.querySelector('iframe');
          if (iframe) {
            console.log("📊 Iframe confirmed, chart ready");
            onLoad?.();
          } else {
            console.warn("⚠️ Iframe not found, but calling onLoad anyway");
            onLoad?.();
          }
        }, 5000); // 5 seconds should be enough for initial load
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
