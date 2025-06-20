
import React, { useEffect, useRef } from 'react';

const DukascopyWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    console.log('Initializing Dukascopy widget...');

    // Set up the Dukascopy configuration on window object
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

    // Create and load the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://freeserv-static.dukascopy.com/2.0/core.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Dukascopy script loaded successfully');
      scriptLoadedRef.current = true;
    };

    script.onerror = (error) => {
      console.error('Failed to load Dukascopy script:', error);
    };

    // Append script to document head for proper loading
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Clean up global variable
      if ((window as any).DukascopyApplet) {
        delete (window as any).DukascopyApplet;
      }
      scriptLoadedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Historical Market Data</h3>
      <div 
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border border-gray-700 bg-gray-900"
        style={{ minHeight: '550px' }}
      >
        {/* The Dukascopy widget will automatically render here based on the configuration */}
        <div className="flex items-center justify-center h-full min-h-[550px] text-gray-400">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading Historical Data Widget...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DukascopyWidget;
