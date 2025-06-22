
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, BarChart3, RefreshCw } from 'lucide-react';

const DukascopyWidget = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log(`[DukascopyWidget] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const handleRetry = () => {
    setLoadAttempts(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
    addDebugInfo(`Manual retry attempt ${loadAttempts + 1}`);
    
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src; // Force reload
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'dukascopy-widget') {
        const { status, data } = event.data;
        
        addDebugInfo(`Received message: ${status}`);
        
        switch (status) {
          case 'loading':
            setIsLoading(true);
            setHasError(false);
            break;
          case 'loaded':
            setIsLoading(false);
            setHasError(false);
            addDebugInfo('Widget loaded successfully');
            break;
          case 'error':
            setIsLoading(false);
            setHasError(true);
            addDebugInfo(`Widget error after ${data?.attempts || 0} attempts`);
            break;
          case 'max-attempts-reached':
            setIsLoading(false);
            setHasError(true);
            addDebugInfo('Maximum load attempts reached');
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Fallback timeout
    const timeoutId = setTimeout(() => {
      if (isLoading && !hasError) {
        addDebugInfo('Widget loading timeout - showing fallback');
        setIsLoading(false);
        setHasError(true);
      }
    }, 20000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
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
              <p className="text-gray-500 text-xs mt-1">Initializing historical data feed</p>
            </div>
          </div>
        )}
        
        {/* Iframe container for the Dukascopy widget */}
        <iframe
          ref={iframeRef}
          src="/dukascopy-widget-iframe.html"
          width="100%"
          height="550"
          frameBorder="0"
          scrolling="no"
          title="Dukascopy Historical Data Widget"
          style={{
            backgroundColor: 'white',
            minHeight: '550px'
          }}
          onLoad={() => addDebugInfo('Iframe loaded')}
          onError={() => {
            addDebugInfo('Iframe load error');
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {/* Debug panel */}
        {process.env.NODE_ENV === 'development' && !isLoading && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
            <div>Status: {hasError ? 'Error' : 'Loaded'}</div>
            <div>Attempts: {loadAttempts}</div>
            <div>Debug entries: {debugInfo.length}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DukascopyWidget;
