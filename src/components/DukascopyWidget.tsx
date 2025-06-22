
import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

const DukascopyWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleIframeLoad = () => {
    console.log('Dukascopy iframe loaded');
    setIsLoading(false);
  };

  const handleIframeError = () => {
    console.error('Dukascopy iframe failed to load');
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Historical Market Data</h3>
      
      {hasError ? (
        <div className="w-full rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
          <p className="text-gray-400 mb-4">Unable to load the interactive widget</p>
          <a 
            href="https://www.dukascopy.com/swiss/english/marketwatch/historical/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink size={16} />
            Access Dukascopy Historical Data
          </a>
        </div>
      ) : (
        <div className="w-full rounded-lg overflow-hidden border border-gray-700 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading widget...</p>
              </div>
            </div>
          )}
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
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      )}
    </div>
  );
};

export default DukascopyWidget;
