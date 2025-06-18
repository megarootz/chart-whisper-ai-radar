
import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "OANDA:EURUSD",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "withdateranges": true,
        "range": "YTD",
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "watchlist": [
          "OANDA:EURUSD",
          "OANDA:GBPUSD",
          "OANDA:GBPJPY",
          "OANDA:USDJPY",
          "OANDA:USDCAD",
          "OANDA:AUDUSD",
          "OANDA:USDCHF",
          "OANDA:EURJPY",
          "OANDA:NZDUSD",
          "OANDA:EURAUD",
          "OANDA:AUDJPY",
          "OANDA:EURGBP",
          "OANDA:AUDCAD",
          "OANDA:GBPCAD",
          "OANDA:GBPAUD",
          "OANDA:CADJPY",
          "OANDA:EURCAD",
          "OANDA:GBPCHF",
          "OANDA:GBPNZD",
          "OANDA:NZDJPY",
          "OANDA:AUDCHF",
          "OANDA:EURNZD",
          "OANDA:EURCHF",
          "OANDA:CHFJPY",
          "OANDA:NZDCAD",
          "OANDA:AUDNZD",
          "OANDA:CADCHF",
          "OANDA:NZDCHF",
          "OANDA:XAUUSD"
        ],
        "details": true,
        "hotlist": true,
        "support_host": "https://www.tradingview.com"
      }`;
    
    container.current.appendChild(script);
  }, []);

  return (
    <div 
      className="tradingview-widget-container h-full w-full" 
      ref={container} 
      style={{ height: "100%", width: "100%" }}
    >
      <div 
        className="tradingview-widget-container__widget h-full w-full" 
        style={{ height: "100%", width: "100%" }}
      ></div>
    </div>
  );
}

export default memo(TradingViewWidget);
