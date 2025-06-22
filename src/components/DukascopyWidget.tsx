
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, BarChart3 } from 'lucide-react';

const DukascopyWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log(`[DukascopyWidget] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const loadWidget = async () => {
      try {
        addDebugInfo('Starting widget initialization');
        
        // Clear any existing content and ensure clean state
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Remove any existing DukascopyApplet configuration
        if ((window as any).DukascopyApplet) {
          delete (window as any).DukascopyApplet;
          addDebugInfo('Cleared existing DukascopyApplet');
        }

        // Remove existing script if present to ensure clean reload
        const existingScript = document.getElementById('dukascopy-core-js');
        if (existingScript) {
          existingScript.remove();
          addDebugInfo('Removed existing Dukascopy script');
        }

        // Set up the DukascopyApplet configuration BEFORE loading script
        // This matches the exact format from the provided HTML widget code
        (window as any).DukascopyApplet = {
          "type": "historical_data_feed",
          "params": {
            "header": false,
            "availableInstruments": "l:",
            "width": "100%",
            "height": "550",
            "adv": "popup"
          }
        };

        addDebugInfo('DukascopyApplet configured');
        console.log('DukascopyApplet configuration:', (window as any).DukascopyApplet);

        // Create and add the widget container with specific ID that Dukascopy might expect
        if (containerRef.current) {
          const widgetContainer = document.createElement('div');
          widgetContainer.id = 'dukascopy-widget-container';
          widgetContainer.style.width = '100%';
          widgetContainer.style.height = '550px';
          widgetContainer.style.minHeight = '550px';
          containerRef.current.appendChild(widgetContainer);
          addDebugInfo('Created widget container');
        }

        // Load the script with proper error handling
        const script = document.createElement('script');
        script.id = 'dukascopy-core-js';
        script.type = 'text/javascript';
        script.src = 'https://freeserv-static.dukascopy.com/2.0/core.js';
        script.async = false; // Changed to synchronous to match HTML behavior
        
        script.onload = () => {
          addDebugInfo('Dukascopy script loaded successfully');
          
          // Give the script time to initialize and render the widget
          setTimeout(() => {
            // Check if widget has been rendered
            const widgetElements = document.querySelectorAll('iframe[src*="dukascopy"], div[id*="dukascopy"]');
            if (widgetElements.length > 0) {
              addDebugInfo(`Widget detected: ${widgetElements.length} elements found`);
              setIsLoading(false);
            } else {
              addDebugInfo('No widget elements detected after script load');
              // Try to manually trigger widget if it exists on window
              if ((window as any).dukascopy || (window as any).Dukascopy) {
                addDebugInfo('Attempting manual widget initialization');
                // Additional initialization attempts could go here
              }
              
              // Still mark as loaded even if no elements detected
              setTimeout(() => {
                setIsLoading(false);
              }, 2000);
            }
          }, 1500);
        };
        
        script.onerror = (error) => {
          addDebugInfo(`Script loading failed: ${error}`);
          setHasError(true);
          setIsLoading(false);
        };
        
        // Append script to document head to match typical widget behavior
        document.head.appendChild(script);
        addDebugInfo('Script appended to document head');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addDebugInfo(`Error during widget initialization: ${errorMessage}`);
        setHasError(true);
        setIsLoading(false);
      }
    };

    // Set timeout for fallback
    timeoutId = setTimeout(() => {
      if (isLoading && !hasError) {
        addDebugInfo('Widget loading timeout - showing fallback');
        setHasError(true);
        setIsLoading(false);
      }
    }, 20000); // 20 second timeout

    loadWidget();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, hasError]);

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

          {/* Debug information (only in development) */}
          {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
            <details className="mt-6">
              <summary className="text-gray-400 cursor-pointer text-sm">Debug Information</summary>
              <div className="mt-2 text-xs text-gray-500 bg-gray-900 p-3 rounded max-h-40 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index}>{info}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Historical Market Data</h3>
      
      <div className="w-full rounded-lg overflow-hidden border border-gray-700 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading Dukascopy widget...</p>
              <p className="text-gray-500 text-xs mt-1">Initializing historical data feed</p>
            </div>
          </div>
        )}
        
        {/* Main container for the Dukascopy widget */}
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%', 
            height: '550px',
            minHeight: '550px',
            backgroundColor: 'white',
            position: 'relative'
          }}
        />

        {/* Debug panel for development */}
        {process.env.NODE_ENV === 'development' && !isLoading && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
            <div>Widget Status: {hasError ? 'Error' : 'Loaded'}</div>
            <div>Debug entries: {debugInfo.length}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DukascopyWidget;
