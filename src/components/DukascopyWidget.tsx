
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, BarChart3 } from 'lucide-react';

const DukascopyWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadWidget = () => {
      try {
        // Only inject the script if it isn't already present
        if (!document.getElementById("dukascopy-core-js")) {
          const script = document.createElement('script');
          script.id = "dukascopy-core-js";
          script.src = 'https://freeserv-static.dukascopy.com/2.0/core.js';
          script.async = true;
          
          script.onload = () => {
            console.log('Dukascopy script loaded successfully');
            initializeWidget();
          };
          
          script.onerror = () => {
            console.error('Failed to load Dukascopy script');
            setHasError(true);
            setIsLoading(false);
          };
          
          document.head.appendChild(script);
        } else {
          console.log('Dukascopy script already exists, reinitializing widget');
          initializeWidget();
        }
      } catch (error) {
        console.error('Error loading Dukascopy widget:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    const initializeWidget = () => {
      try {
        // Set up the DukascopyApplet configuration
        if (typeof window !== 'undefined') {
          (window as any).DukascopyApplet = {
            type: "historical_data_feed",
            params: {
              header: false,
              availableInstruments: "l:",
              width: "100%",
              height: "550",
              adv: "popup",
              container: containerRef.current
            }
          };
          
          console.log('DukascopyApplet configured:', (window as any).DukascopyApplet);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Dukascopy widget:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    // Add a timeout to show fallback if widget doesn't load
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Widget loading timeout, showing fallback');
        setHasError(true);
        setIsLoading(false);
      }
    }, 10000);

    loadWidget();

    return () => {
      clearTimeout(timeout);
    };
  }, [isLoading]);

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
            <p className="text-gray-400 mb-6">
              Get comprehensive historical market data with advanced charting tools and technical indicators.
            </p>
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
          
          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <h5 className="text-white font-medium mb-2">Features Available:</h5>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Historical price data for major currency pairs</li>
              <li>• Multiple timeframes (1M, 5M, 1H, 4H, 1D)</li>
              <li>• Technical indicators and drawing tools</li>
              <li>• Export data in various formats</li>
              <li>• Professional-grade charting interface</li>
            </ul>
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
              <p className="text-gray-400 text-sm">Loading Dukascopy widget...</p>
            </div>
          </div>
        )}
        
        {/* Container div for the Dukascopy widget */}
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%', 
            height: '550px',
            minHeight: '550px'
          }}
        />
      </div>
    </div>
  );
};

export default DukascopyWidget;
