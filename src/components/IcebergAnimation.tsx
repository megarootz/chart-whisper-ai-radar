
import React from 'react';

const IcebergAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        {/* Iceberg SVG with animation */}
        <div className="relative w-32 h-32 mb-6">
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Water surface */}
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="iceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F0F9FF" />
                <stop offset="50%" stopColor="#E0F2FE" />
                <stop offset="100%" stopColor="#BAE6FD" />
              </linearGradient>
            </defs>
            
            {/* Water background */}
            <rect x="0" y="120" width="200" height="80" fill="url(#waterGradient)" />
            
            {/* Iceberg tip (visible part) */}
            <polygon 
              points="100,60 70,120 130,120" 
              fill="url(#iceGradient)" 
              stroke="#0EA5E9" 
              strokeWidth="2"
              className="animate-[float_3s_ease-in-out_infinite]"
            />
            
            {/* Iceberg underwater (larger hidden part) */}
            <polygon 
              points="100,120 40,180 160,180 140,140 60,140" 
              fill="url(#iceGradient)" 
              opacity="0.7"
              stroke="#0EA5E9" 
              strokeWidth="1"
              className="animate-[float_3s_ease-in-out_infinite_0.5s]"
            />
            
            {/* Water waves */}
            <path 
              d="M 0 120 Q 25 115 50 120 T 100 120 T 150 120 T 200 120" 
              stroke="#0EA5E9" 
              strokeWidth="2" 
              fill="none"
              className="animate-[wave_2s_ease-in-out_infinite]"
            />
          </svg>
        </div>
        
        {/* Ripple effects */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 border-2 border-blue-300 rounded-full animate-ping opacity-30"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-2 border-blue-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
      
      <h3 className="text-white font-medium text-xl mb-2">Deep Historical Analysis</h3>
      <p className="text-gray-400 text-center max-w-md">
        Diving deep into historical market data to uncover patterns and insights hidden beneath the surface
      </p>
    </div>
  );
};

export default IcebergAnimation;
