
import React, { useEffect, useState } from 'react';
import { Radar } from 'lucide-react';

const SpinningRadar = () => {
  const [rotation, setRotation] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(0.5);

  useEffect(() => {
    const animateRotation = () => {
      setRotation((prev) => (prev + 0.5) % 360);
    };

    const animatePulse = () => {
      setPulseIntensity((prev) => {
        const newIntensity = 0.3 + Math.sin(Date.now() * 0.003) * 0.4;
        return Math.max(0.1, Math.min(1, newIntensity));
      });
    };

    const rotationInterval = setInterval(animateRotation, 16);
    const pulseInterval = setInterval(animatePulse, 50);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center max-w-full mx-auto">
      {/* Outer glow ring */}
      <div 
        className="absolute inset-0 rounded-full border-2 border-primary/20"
        style={{
          boxShadow: `0 0 ${30 + pulseIntensity * 20}px rgba(124, 58, 237, ${0.2 + pulseIntensity * 0.3})`
        }}
      />
      
      {/* Middle ring */}
      <div className="absolute inset-4 md:inset-8 rounded-full border border-primary/30 flex items-center justify-center">
        {/* Inner ring */}
        <div className="absolute inset-4 md:inset-8 rounded-full border border-primary/40 flex items-center justify-center">
          {/* Center dot */}
          <div 
            className="w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full"
            style={{
              boxShadow: `0 0 ${10 + pulseIntensity * 15}px rgba(124, 58, 237, ${0.5 + pulseIntensity * 0.5})`
            }}
          />
        </div>
      </div>

      {/* Rotating radar sweep */}
      <div 
        className="absolute inset-0 origin-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Radar line */}
        <div className="absolute top-0 left-1/2 w-0.5 md:w-1 h-1/2 bg-gradient-to-t from-primary to-transparent transform -translate-x-1/2" />
        
        {/* Radar sweep area */}
        <div 
          className="absolute top-1/2 left-1/2 w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 transform -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
          style={{
            background: `conic-gradient(from ${rotation}deg, transparent, rgba(124, 58, 237, 0.6) 45deg, transparent 90deg)`
          }}
        />
      </div>

      {/* Central radar icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Radar 
          size={32} 
          className="text-primary md:w-10 md:h-10 lg:w-12 lg:h-12"
          style={{
            filter: `drop-shadow(0 0 ${5 + pulseIntensity * 10}px rgba(124, 58, 237, ${0.4 + pulseIntensity * 0.4}))`
          }}
        />
      </div>

      {/* Floating dots for extra visual interest */}
      <div 
        className="absolute w-1.5 h-1.5 md:w-2 md:h-2 bg-primary/70 rounded-full"
        style={{
          top: '25%',
          left: '70%',
          transform: `translate(${Math.sin(rotation * 0.02) * 8}px, ${Math.cos(rotation * 0.02) * 6}px)`,
          opacity: 0.4 + pulseIntensity * 0.6
        }}
      />
      <div 
        className="absolute w-1 h-1 md:w-1.5 md:h-1.5 bg-primary/50 rounded-full"
        style={{
          top: '60%',
          left: '25%',
          transform: `translate(${Math.sin(rotation * 0.015 + 1) * 10}px, ${Math.cos(rotation * 0.015 + 1) * 8}px)`,
          opacity: 0.3 + pulseIntensity * 0.7
        }}
      />
      <div 
        className="absolute w-0.5 h-0.5 md:w-1 md:h-1 bg-primary/60 rounded-full"
        style={{
          top: '40%',
          left: '80%',
          transform: `translate(${Math.sin(rotation * 0.025 + 2) * 6}px, ${Math.cos(rotation * 0.025 + 2) * 4}px)`,
          opacity: 0.5 + pulseIntensity * 0.5
        }}
      />
    </div>
  );
};

export default SpinningRadar;
