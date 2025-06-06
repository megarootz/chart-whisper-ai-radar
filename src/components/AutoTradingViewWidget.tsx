
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
        "allow_symbol_change": false,
        "support_host": "https://www.tradingview.com",
        "withdateranges": true,
        "hide_side_toolbar": false,
        "hide_top_toolbar": false,
        "save_image": false,
        "container_id": "tradingview_chart"
      }`;
    
    script.onload = () => {
      scriptLoaded.current = true;
      // Give the widget time to fully render
      setTimeout(() => {
        onLoad?.();
      }, 3000);
    };

    container.current.appendChild(script);
    
    // Update refs to track current values
    currentSymbol.current = symbol;
    currentInterval.current = interval;
  }, [symbol, interval, onLoad]);

  useEffect(() => {
    // Only recreate widget if symbol or interval actually changed
    if (currentSymbol.current !== symbol || currentInterval.current !== interval || !scriptLoaded.current) {
      createWidget();
    }
  }, [symbol, interval, createWidget]);

  return (
    <div 
      className="tradingview-widget-container w-full" 
      ref={container} 
      style={{ 
        height: "600px", 
        minHeight: "500px",
        width: "100%" 
      }}
    >
      <div 
        className="tradingview-widget-container__widget w-full" 
        style={{ 
          height: "calc(100% - 32px)", 
          width: "100%",
          minHeight: "468px"
        }}
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
