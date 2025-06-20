
import React, { useEffect, useRef } from 'react';

const DukascopyWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const widgetInitializedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current && widgetInitializedRef.current) return;

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

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://freeserv-static.dukascopy.com/2.0/core.js"]');
    
    if (existingScript && !widgetInitializedRef.current) {
      // Script already exists, try to initialize widget
      console.log('Script already loaded, initializing widget...');
      initializeWidget();
      return;
    }

    if (!scriptLoadedRef.current) {
      // Create and load the script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://freeserv-static.dukascopy.com/2.0/core.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Dukascopy script loaded successfully');
        scriptLoadedRef.current = true;
        initializeWidget();
      };

      script.onerror = (error) => {
        console.error('Failed to load Dukascopy script:', error);
      };

      // Append script to document head
      document.head.appendChild(script);
    }

    function initializeWidget() {
      if (widgetInitializedRef.current) return;
      
      setTimeout(() => {
        if (containerRef.current) {
          // Clear the loading message
          containerRef.current.innerHTML = '';
          
          // Create a div for the widget
          const widgetDiv = document.createElement('div');
          widgetDiv.id = 'dukascopy-widget-container';
          containerRef.current.appendChild(widgetDiv);
          
          // Try to initialize the widget
          if ((window as any).dukascopy) {
            console.log('Initializing Dukascopy widget...');
            try {
              (window as any).dukascopy.embed(widgetDiv);
              widgetInitializedRef.current = true;
              console.log('Widget initialized successfully');
            } catch (error) {
              console.error('Error initializing widget:', error);
              // Fallback: let the script auto-initialize
              widgetDiv.innerHTML = '<script type="text/javascript">DukascopyApplet = {"type":"historical_data_feed","params":{"header":false,"availableInstruments":"l:","width":"100%","height":"550","adv":"popup"}};</script>';
            }
          } else {
            console.log('Dukascopy object not found, using fallback method');
            // Fallback method - inject the widget code directly
            widgetDiv.innerHTML = `
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
            `;
            widgetInitializedRef.current = true;
          }
        }
      }, 500);
    }

    // Cleanup function
    return () => {
      // Clean up global variable
      if ((window as any).DukascopyApplet) {
        delete (window as any).DukascopyApplet;
      }
      widgetInitializedRef.current = false;
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
        {/* Default loading state */}
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
