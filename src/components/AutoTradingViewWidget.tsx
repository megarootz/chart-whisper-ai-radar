
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
        "allow_symbol_change": false,
        "support_host": "https://www.tradingview.com",
        "withdateranges": true,
        "hide_side_toolbar": false,
        "hide_top_toolbar": false,
        "save_image": false,
        "container_id": "tradingview_chart_${Date.now()}",
        "studies": [],
        "show_popup_button": false,
        "popup_width": "1000",
        "popup_height": "650",
        "details": true,
        "hotlist": true,
        "calendar": false,
        "studies_overrides": {},
        "overrides": {
          "mainSeriesProperties.candleStyle.upColor": "#26a69a",
          "mainSeriesProperties.candleStyle.downColor": "#ef5350",
          "mainSeriesProperties.candleStyle.drawWick": true,
          "mainSeriesProperties.candleStyle.drawBorder": true,
          "mainSeriesProperties.candleStyle.borderColor": "#378658",
          "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
          "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
          "paneProperties.background": "#1a1a1a",
          "paneProperties.vertGridProperties.color": "#363636",
          "paneProperties.horzGridProperties.color": "#363636",
          "symbolWatermarkProperties.transparency": 90
        }
      }`;
    
    script.onload = () => {
      console.log("✅ TradingView widget script loaded successfully for symbol:", symbol);
      scriptLoaded.current = true;
      // Give the widget time to fully render with the correct symbol
      setTimeout(() => {
        console.log("🏁 TradingView widget render completed for:", symbol);
        onLoad?.();
      }, 6000); // Increased wait time to ensure proper symbol loading
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
      className="tradingview-widget-container w-full" 
      ref={container} 
      style={{ 
        height: "800px", 
        minHeight: "700px",
        width: "100%" 
      }}
    >
      <div 
        className="tradingview-widget-container__widget w-full" 
        style={{ 
          height: "calc(100% - 32px)", 
          width: "100%",
          minHeight: "768px"
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
