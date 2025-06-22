
import React, { useState, useEffect } from 'react';
import { ExternalLink, BarChart3 } from 'lucide-react';

const DukascopyWidget = () => {
  const [hasError, setHasError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Show fallback after 5 seconds if widget doesn't load
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeError = () => {
    console.error('Dukascopy iframe failed to load');
    setHasError(true);
    setShowFallback(true);
  };

  if (hasError || showFallback) {
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
      
      <div className="w-full rounded-lg overflow-hidden border border-gray-700 relative">
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading widget...</p>
          </div>
        </div>
        <iframe
          src="/dukascopy-widget.html"
          width="100%"
          height="550"
          frameBorder="0"
          style={{ 
            border: 'none',
            display: 'block',
            background: 'white'
          }}
          title="Dukascopy Historical Data Widget"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
          allow="scripts; popups; same-origin; forms"
          onError={handleIframeError}
        />
      </div>
    </div>
  );
};

export default DukascopyWidget;
