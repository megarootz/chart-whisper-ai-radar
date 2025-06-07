
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

  const createWidget = useCallback(() => {
    if (!container.current) return;

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
        "support_host": "https://www.tradingview.com"
      }`;
    
    script.onload = () => {
      console.log("✅ TradingView widget script loaded successfully for symbol:", symbol);
      scriptLoaded.current = true;
      // Give the widget time to fully render with the correct symbol
      setTimeout(() => {
        console.log("🏁 TradingView widget render completed for:", symbol);
        onLoad?.();
      }, 6000); // Keep increased wait time to ensure proper symbol loading
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
    // Always recreate widget when symbol or interval changes
    if (currentSymbol.current !== symbol || currentInterval.current !== interval || !scriptLoaded.current) {
      console.log("🆕 Recreating widget due to change:", {
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

export default memo(AutoTradingViewWidget);
