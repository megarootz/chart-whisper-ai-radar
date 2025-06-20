
import React, { useEffect, useRef } from 'react';

const DukascopyWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create and configure the Dukascopy applet
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

    script.onerror = () => {
      console.error('Failed to load Dukascopy script');
    };

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
    <div 
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden border border-gray-700 bg-gray-900"
      style={{ minHeight: '550px' }}
    >
      {/* Loading placeholder */}
      <div className="flex items-center justify-center h-full min-h-[550px] text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading Historical Data Widget...</p>
        </div>
      </div>
    </div>
  );
};

export default DukascopyWidget;
