
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, BarChart3, RefreshCw } from 'lucide-react';

const DukascopyWidget = () => {
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  const initializeWidget = () => {
    if (!widgetContainerRef.current) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Initializing Dukascopy historical data widget...');
      
      // Clear any existing content
      widgetContainerRef.current.innerHTML = '';
      
      // Set up the global DukascopyApplet configuration for historical data feed
      (window as any).DukascopyApplet = {
        type: "historical_data_feed",
        params: {
          header: true,
          availableInstruments: "l:EUR/USD,USD/JPY,GBP/USD,EUR/JPY,USD/CAD,AUD/USD,XAU/USD,XAG/USD,AUD/CAD,AUD/CHF,AUD/JPY,AUD/NZD,CAD/CHF,CAD/JPY,CHF/JPY,EUR/AUD,EUR/CAD,EUR/CHF,EUR/GBP,EUR/NZD,GBP/AUD,GBP/CAD,GBP/CHF,GBP/JPY,GBP/NZD,NZD/CAD,NZD/CHF,NZD/USD,USD/CHF",
          width: "100%",
          height: "100%",
          adv: "hover",
          lang: "en"
        }
      };

      // Remove any existing script
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://freeserv-static.dukascopy.com/2.0/core.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Dukascopy historical data script loaded successfully');
        setIsLoading(false);
        setHasError(false);
      };
      
      script.onerror = () => {
        console.error('Failed to load Dukascopy script');
        setIsLoading(false);
        setHasError(true);
      };

      // Store script reference for cleanup
      scriptRef.current = script;
      
      // Append script to head to initialize the widget
      document.head.appendChild(script);

      // Set timeout for loading
      setTimeout(() => {
        if (isLoading) {
          console.log('Widget initialization timeout');
          setIsLoading(false);
          setHasError(true);
        }
      }, 10000);

    } catch (error) {
      console.error('Widget initialization error:', error);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setLoadAttempts(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
    console.log(`Retry attempt ${loadAttempts + 1}`);
    
    // Clean up existing scripts
    const existingScripts = document.querySelectorAll('script[src*="dukascopy"]');
    existingScripts.forEach(script => script.remove());
    
    // Clean up global variable
    if ((window as any).DukascopyApplet) {
      delete (window as any).DukascopyApplet;
    }
    
    // Reinitialize
    initializeWidget();
  };

  useEffect(() => {
    console.log('DukascopyWidget mounted, initializing...');
    initializeWidget();

    // Cleanup function
    return () => {
      console.log('DukascopyWidget unmounting, cleaning up...');
      
      // Clean up the global DukascopyApplet
      if ((window as any).DukascopyApplet) {
        delete (window as any).DukascopyApplet;
      }
      
      // Remove script
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      
      // Clear container
      if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (hasError) {
    return (
      <div className="w-full">
        <h3 className="text-xl font-bold text-white mb-4">Historical Market Data</h3>
        
        <div className="w-full rounded-lg border border-gray-700 bg-gray-800 p-8">
          <div className="text-center mb-6">
            <div className="bg-gray-700 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Access Professional Historical Data</h4>
            <p className="text-gray-400 mb-4">
              The widget couldn't load. You can retry or access the data directly through these professional platforms.
            </p>
            
            {loadAttempts < 3 && (
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto mb-6"
              >
                <RefreshCw size={16} />
                Retry Widget
              </button>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <a 
              href="https://www.dukascopy.com/swiss/english/marketwatch/historical/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <ExternalLink size={18} />
              Dukascopy Historical Data
            </a>
            
            <a 
              href="https://www.tradingview.com/chart/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <BarChart3 size={18} />
              TradingView Charts
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Historical Market Data</h3>
      
      <div className="w-full rounded-lg overflow-hidden border border-gray-700 relative bg-white">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading Historical Data Widget...</p>
              <p className="text-gray-500 text-xs mt-1">Connecting to Dukascopy servers</p>
            </div>
          </div>
        )}
        
        {/* Widget will be automatically inserted here by the Dukascopy script */}
        <div
          ref={widgetContainerRef}
          style={{
            width: '100%',
            height: '600px',
            minHeight: '600px'
          }}
        />
      </div>
    </div>
  );
};

export default DukascopyWidget;
