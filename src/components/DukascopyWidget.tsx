
import React, { useEffect, useRef } from 'react';

const DukascopyWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInitialized = useRef(false);

  useEffect(() => {
    if (widgetInitialized.current) return;

    console.log('Loading Dukascopy widget...');

    // Clear any existing content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      // Create the exact embed code structure as shown on Dukascopy website
      const widgetHTML = `
        <script type="text/javascript">
          DukascopyApplet = {
            "type": "historical_data_feed",
            "params": {
              "header": false,
              "availableInstruments": "l:",
              "width": "100%",
              "height": "550",
              "adv": "popup"
            }
          };
        </script>
        <script type="text/javascript" src="https://freeserv-static.dukascopy.com/2.0/core.js"></script>
      `;
      
      // Insert the HTML directly
      containerRef.current.innerHTML = widgetHTML;
      
      // Execute the scripts
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
          newScript.async = true;
        } else {
          newScript.textContent = script.textContent;
        }
        newScript.type = 'text/javascript';
        document.head.appendChild(newScript);
      });
      
      widgetInitialized.current = true;
      console.log('Dukascopy widget embed code injected');
    }

    return () => {
      // Cleanup
      widgetInitialized.current = false;
    };
  }, []);

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Historical Market Data</h3>
      <div 
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border border-gray-700 bg-white"
        style={{ minHeight: '550px' }}
      >
        {/* Loading state */}
        <div className="flex items-center justify-center h-full min-h-[550px] text-gray-600">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading Dukascopy Historical Data Widget...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DukascopyWidget;
