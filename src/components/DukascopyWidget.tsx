
import React from 'react';

const DukascopyWidget = () => {
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Historical Market Data</h3>
      <div className="w-full rounded-lg overflow-hidden border border-gray-700">
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
          allow="scripts"
        />
      </div>
    </div>
  );
};

export default DukascopyWidget;
