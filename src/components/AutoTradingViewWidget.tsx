
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

    const captureScreenshot = useCallback(async () => {
      if (!container.current) {
        return { success: false, error: 'Container not available' };
      }

      try {
        const { captureWidgetScreenshot } = await import('@/utils/screenshotUtils');
        return await captureWidgetScreenshot(container.current);
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

      // Clear previous widget
      container.current.innerHTML = '';
      scriptLoaded.current = false;

      console.log("🔄 Creating TradingView widget with OANDA symbol:", symbol, "interval:", interval);

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
          "support_host": "https://www.tradingview.com"
        }`;
      
      script.onload = () => {
        console.log("✅ TradingView widget script loaded successfully for OANDA symbol:", symbol);
        scriptLoaded.current = true;
        // Wait longer to ensure chart is fully loaded with data
        setTimeout(() => {
          console.log("🏁 TradingView widget should be ready with chart data:", symbol);
          onLoad?.();
        }, 8000); // Increased to 8s to ensure chart data is loaded
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
      console.log("🔄 TradingView widget effect triggered for OANDA pair:", { symbol, interval });
      // Always recreate widget when symbol or interval changes to ensure fresh data
      if (currentSymbol.current !== symbol || currentInterval.current !== interval || !scriptLoaded.current) {
        console.log("🆕 Recreating widget for OANDA pair:", {
          oldSymbol: currentSymbol.current,
          newSymbol: symbol,
          oldInterval: currentInterval.current,
          newInterval: interval,
          scriptLoaded: scriptLoaded.current
        });
        createWidget();
      }
    }, [symbol, interval, createWidget]);

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
