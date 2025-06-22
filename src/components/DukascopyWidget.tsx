
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, BarChart3, RefreshCw } from 'lucide-react';

const DukascopyWidget = () => {
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log(`[DukascopyWidget] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const initializeWidget = () => {
    if (!widgetContainerRef.current) {
      addDebugInfo('Widget container not found');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      addDebugInfo('Initializing Dukascopy widget...');
      
      // Clear any existing content
      widgetContainerRef.current.innerHTML = '';
      
      // Create the widget configuration
      const widgetConfig = {
        width: '100%',
        height: '550',
        symbol: 'EURUSD',
        interval: 'D1',
        timezone: 'Europe/Zurich',
        theme: 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: 'dukascopy_widget_container'
      };

      // Set up the global DukascopyApplet configuration
      (window as any).DukascopyApplet = {
        ...widgetConfig,
        onLoad: () => {
          addDebugInfo('Widget loaded successfully');
          setIsLoading(false);
          setHasError(false);
        },
        onError: (error: any) => {
          addDebugInfo(`Widget error: ${error}`);
          setIsLoading(false);
          setHasError(true);
        }
      };

      // Create script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://freeserv.dukascopy.com/2.0/core.js';
      script.async = true;
      
      script.onload = () => {
        addDebugInfo('Dukascopy script loaded');
        // Give the widget time to initialize
        setTimeout(() => {
          if (isLoading) {
            addDebugInfo('Widget initialization timeout');
            setIsLoading(false);
            setHasError(true);
          }
        }, 10000);
      };
      
      script.onerror = () => {
        addDebugInfo('Failed to load Dukascopy script');
        setIsLoading(false);
        setHasError(true);
      };

      // Add the container div with the expected ID
      const widgetDiv = document.createElement('div');
      widgetDiv.id = 'dukascopy_widget_container';
      widgetDiv.style.width = '100%';
      widgetDiv.style.height = '550px';
      widgetContainerRef.current.appendChild(widgetDiv);

      // Append script to head
      document.head.appendChild(script);

    } catch (error) {
      addDebugInfo(`Widget initialization error: ${error}`);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setLoadAttempts(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
    addDebugInfo(`Manual retry attempt ${loadAttempts + 1}`);
    
    // Clean up existing scripts
    const existingScripts = document.querySelectorAll('script[src*="dukascopy.com"]');
    existingScripts.forEach(script => script.remove());
    
    // Reinitialize
    initializeWidget();
  };

  useEffect(() => {
    addDebugInfo('Component mounted, initializing widget');
    initializeWidget();

    // Cleanup function
    return () => {
      addDebugInfo('Component unmounting, cleaning up');
      
      // Clean up the global DukascopyApplet
      if ((window as any).DukascopyApplet) {
        delete (window as any).DukascopyApplet;
      }
      
      // Remove scripts
      const scripts = document.querySelectorAll('script[src*="dukascopy.com"]');
      scripts.forEach(script => script.remove());
      
      // Clear container
      if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = '';
      }
    };
  }, []); // Empty dependency array - run once on mount

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

          {/* Debug information */}
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
              <p className="text-gray-500 text-xs mt-1">Initializing with React integration</p>
            </div>
          </div>
        )}
        
        {/* Widget container for direct DOM integration */}
        <div
          ref={widgetContainerRef}
          style={{
            width: '100%',
            height: '550px',
            backgroundColor: 'white',
            minHeight: '550px'
          }}
        />

        {/* Debug panel */}
        {process.env.NODE_ENV === 'development' && !isLoading && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
            <div>Status: {hasError ? 'Error' : 'Loaded'}</div>
            <div>Attempts: {loadAttempts}</div>
            <div>Debug entries: {debugInfo.length}</div>
            <div>Method: Direct DOM</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DukascopyWidget;
