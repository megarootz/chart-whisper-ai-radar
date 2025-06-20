
import React from 'react';

const DukascopyWidget = () => {
  // Create the HTML content for the iframe
  const widgetHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          background: white;
          font-family: Arial, sans-serif;
        }
        #widget-container {
          width: 100%;
          height: 550px;
        }
      </style>
    </head>
    <body>
      <div id="widget-container"></div>
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
    </body>
    </html>
  `;

  const iframeSrc = `data:text/html;charset=utf-8,${encodeURIComponent(widgetHTML)}`;

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Historical Market Data</h3>
      <div className="w-full rounded-lg overflow-hidden border border-gray-700">
        <iframe
          src={iframeSrc}
          width="100%"
          height="550"
          frameBorder="0"
          style={{ 
            border: 'none',
            display: 'block',
            background: 'white'
          }}
          title="Dukascopy Historical Data Widget"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
};

export default DukascopyWidget;
