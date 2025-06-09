
import React, { useEffect, useRef, memo, useCallback } from 'react';

interface AutoTradingViewWidgetProps {
  symbol: string;
  interval: string;
  onLoad?: () => void;
}

function AutoTradingViewWidget({ symbol, interval, onLoad }: AutoTradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const currentSymbol = useRef<string>('');
  const currentInterval = useRef<string>('');
  const widgetInstance = useRef<any>(null);

  const createWidget = useCallback(() => {
    if (!container.current) return;

    // Clear previous widget completely
    container.current.innerHTML = '';
    scriptLoaded.current = false;
    widgetInstance.current = null;

    console.log("🔄 Creating TradingView widget with symbol:", symbol, "interval:", interval);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Enhanced widget configuration for better data freshness
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
        "container_id": "tradingview_widget",
        "autosize": true,
        "studies": [],
        "show_popup_button": false,
        "popup_width": "1000",
        "popup_height": "650",
        "no_referral_id": true,
        "withdateranges": true,
        "hide_side_toolbar": false,
        "details": true,
        "hotlist": true,
        "calendar": true,
        "news": [],
        "studies_overrides": {},
        "overrides": {
          "mainSeriesProperties.candleStyle.upColor": "#26a69a",
          "mainSeriesProperties.candleStyle.downColor": "#ef5350"
        }
      }`;
    
    script.onload = () => {
      console.log("✅ TradingView widget script loaded successfully for symbol:", symbol);
      scriptLoaded.current = true;
      
      // Enhanced waiting strategy for widget to fully load with fresh data
      const checkWidgetReady = () => {
        const iframe = container.current?.querySelector('iframe');
        if (iframe) {
          console.log("📊 Widget iframe detected, waiting for data refresh...");
          
          // Wait longer for fresh data to load, especially for symbol changes
          const waitTime = currentSymbol.current !== symbol ? 12000 : 8000;
          
          setTimeout(() => {
            console.log("🏁 TradingView widget render completed for:", symbol, "after", waitTime, "ms");
            widgetInstance.current = iframe;
            onLoad?.();
          }, waitTime);
        } else {
          // If no iframe yet, check again
          setTimeout(checkWidgetReady, 1000);
        }
      };
      
      checkWidgetReady();
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
    console.log("🔄 TradingView widget effect triggered:", { symbol, interval });
    
    // Always recreate widget when symbol or interval changes for fresh data
    const symbolChanged = currentSymbol.current !== symbol;
    const intervalChanged = currentInterval.current !== interval;
    
    if (symbolChanged || intervalChanged || !scriptLoaded.current) {
      console.log("🆕 Recreating widget for fresh data:", {
        oldSymbol: currentSymbol.current,
        newSymbol: symbol,
        oldInterval: currentInterval.current,
        newInterval: interval,
        symbolChanged,
        intervalChanged,
        scriptLoaded: scriptLoaded.current
      });
      
      // Add extra delay if symbol changed to ensure clean transition
      if (symbolChanged) {
        setTimeout(() => createWidget(), 500);
      } else {
        createWidget();
      }
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
        id="tradingview_widget"
      ></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(AutoTradingViewWidget);
