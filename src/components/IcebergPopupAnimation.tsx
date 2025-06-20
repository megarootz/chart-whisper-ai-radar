
import React, { useEffect, useState } from 'react';

interface IcebergPopupAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const IcebergPopupAnimation = ({ isVisible, onComplete }: IcebergPopupAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center animate-scale-in">
        {/* Large Iceberg Animation */}
        <div className="relative w-80 h-80 mb-8">
          <svg 
            viewBox="0 0 400 400" 
            className="w-full h-full animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Enhanced Gradients */}
            <defs>
              <linearGradient id="waterGradientLarge" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="iceGradientLarge" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#F0F9FF" />
                <stop offset="70%" stopColor="#E0F2FE" />
                <stop offset="100%" stopColor="#BAE6FD" />
              </linearGradient>
              <linearGradient id="deepIceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            
            {/* Water background with waves */}
            <rect x="0" y="240" width="400" height="160" fill="url(#waterGradientLarge)" />
            
            {/* Animated water waves */}
            <path 
              d="M 0 240 Q 50 230 100 240 T 200 240 T 300 240 T 400 240" 
              stroke="#0EA5E9" 
              strokeWidth="3" 
              fill="none"
              className="animate-[wave_2s_ease-in-out_infinite]"
            />
            <path 
              d="M 0 250 Q 60 245 120 250 T 240 250 T 360 250 T 400 250" 
              stroke="#3B82F6" 
              strokeWidth="2" 
              fill="none"
              className="animate-[wave_2.5s_ease-in-out_infinite_0.5s]"
              opacity="0.7"
            />
            
            {/* Iceberg tip (visible part) - larger */}
            <polygon 
              points="200,120 120,240 280,240" 
              fill="url(#iceGradientLarge)" 
              stroke="#0EA5E9" 
              strokeWidth="3"
              className="animate-[float_4s_ease-in-out_infinite]"
            />
            
            {/* Iceberg underwater (massive hidden part) */}
            <polygon 
              points="200,240 60,360 340,360 300,280 100,280" 
              fill="url(#deepIceGradient)" 
              opacity="0.8"
              stroke="#0EA5E9" 
              strokeWidth="2"
              className="animate-[float_4s_ease-in-out_infinite_0.8s]"
            />
            
            {/* Additional deep ice formations */}
            <polygon 
              points="200,300 80,350 320,350 280,320 120,320" 
              fill="url(#deepIceGradient)" 
              opacity="0.6"
              stroke="#0369A1" 
              strokeWidth="1"
              className="animate-[float_5s_ease-in-out_infinite_1.2s]"
            />
            
            {/* Sparkle effects */}
            <circle cx="160" cy="180" r="2" fill="#FFFFFF" className="animate-ping" style={{ animationDelay: '0.5s' }} />
            <circle cx="240" cy="160" r="1.5" fill="#FFFFFF" className="animate-ping" style={{ animationDelay: '1s' }} />
            <circle cx="200" cy="200" r="1" fill="#FFFFFF" className="animate-ping" style={{ animationDelay: '1.5s' }} />
          </svg>
        </div>
        
        {/* Large ripple effects */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-32 border-4 border-blue-300 rounded-full animate-ping opacity-20"></div>
          <div className="absolute top-4 left-4 w-24 h-24 border-3 border-blue-400 rounded-full animate-ping opacity-30" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute top-8 left-8 w-16 h-16 border-2 border-blue-500 rounded-full animate-ping opacity-40" style={{ animationDelay: '1.6s' }}></div>
        </div>
        
        {/* Text with fade-in animation */}
        <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-4xl font-bold text-white mb-4">Diving Deep...</h2>
          <p className="text-xl text-blue-200 max-w-md mx-auto">
            Exploring the depths of historical market data to uncover hidden patterns and insights
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full animate-[fill_3s_ease-out_forwards]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IcebergPopupAnimation;
