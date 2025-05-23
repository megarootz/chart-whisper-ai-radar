
import React, { useEffect, useRef, useState } from 'react';
import { Radar, Zap, Activity } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const RadarAnimation = ({ isOpen = true }) => {
  const [rotation, setRotation] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const animationRef = useRef<number>();
  const pulseRef = useRef<number>();

  // Smooth radar rotation
  useEffect(() => {
    const animate = () => {
      setRotation((prev) => (prev + 1.2) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Pulse effect for scanning
  useEffect(() => {
    const pulse = () => {
      setPulseIntensity((prev) => (prev + 0.05) % (Math.PI * 2));
      pulseRef.current = requestAnimationFrame(pulse);
    };

    pulseRef.current = requestAnimationFrame(pulse);

    return () => {
      if (pulseRef.current) {
        cancelAnimationFrame(pulseRef.current);
      }
    };
  }, []);

  const pulseScale = 1 + Math.sin(pulseIntensity) * 0.1;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-primary/20 p-0 sm:max-w-2xl max-w-[95vw] overflow-hidden">
        <div className="relative w-full h-[600px] sm:h-[700px] flex flex-col items-center justify-center">
          
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(124, 58, 237, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(124, 58, 237, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Main Radar Container */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[450px] md:h-[450px]">
            
            {/* Outer Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse"></div>
            <div className="absolute inset-6 rounded-full border border-primary/20"></div>
            <div className="absolute inset-12 rounded-full border border-primary/15"></div>
            <div className="absolute inset-20 rounded-full border border-primary/10"></div>
            
            {/* Glowing Center */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-primary to-blue-400 animate-pulse"
              style={{
                boxShadow: `
                  0 0 40px rgba(124, 58, 237, 0.8),
                  0 0 80px rgba(124, 58, 237, 0.4),
                  inset 0 0 20px rgba(255, 255, 255, 0.2)
                `,
                transform: `translate(-50%, -50%) scale(${pulseScale})`
              }}
            >
              <div className="absolute inset-2 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
              </div>
            </div>

            {/* Radar Sweep */}
            <div 
              className="absolute inset-0 origin-center"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {/* Main Sweep Line */}
              <div 
                className="absolute top-0 left-1/2 w-1 h-1/2 transform -translate-x-1/2 origin-bottom"
                style={{
                  background: `linear-gradient(to top, 
                    rgba(124, 58, 237, 1), 
                    rgba(124, 58, 237, 0.8) 30%, 
                    rgba(124, 58, 237, 0.4) 60%, 
                    transparent 100%
                  )`
                }}
              ></div>
              
              {/* Sweep Glow Effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-40"
                style={{
                  background: `conic-gradient(
                    from ${rotation}deg, 
                    transparent, 
                    rgba(124, 58, 237, 0.6) 30deg, 
                    rgba(59, 130, 246, 0.4) 60deg, 
                    transparent 90deg
                  )`
                }}
              ></div>
            </div>

            {/* Scanning Particles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full animate-ping"
                style={{
                  top: `${20 + Math.sin((rotation + i * 60) * Math.PI / 180) * 30 + 30}%`,
                  left: `${50 + Math.cos((rotation + i * 60) * Math.PI / 180) * 30}%`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.7
                }}
              ></div>
            ))}

            {/* Corner Indicators */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-primary/60"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-primary/60"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-primary/60"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-primary/60"></div>
          </div>

          {/* Status Display */}
          <div className="mt-8 sm:mt-12 text-center space-y-4 px-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wider">
                AI ANALYZING
              </h2>
              <Zap className="w-6 h-6 text-primary animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm sm:text-base">Neural Networks Processing</span>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
              
              <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Advanced AI algorithms are analyzing chart patterns, support & resistance levels, and market opportunities
              </p>
            </div>

            {/* Tech Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-sm mx-auto">
              <div className="text-center space-y-1">
                <div className="text-primary font-bold text-lg sm:text-xl">98.7%</div>
                <div className="text-gray-400 text-xs">Accuracy</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-primary font-bold text-lg sm:text-xl">&lt;3s</div>
                <div className="text-gray-400 text-xs">Speed</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-primary font-bold text-lg sm:text-xl">AI</div>
                <div className="text-gray-400 text-xs">Powered</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RadarAnimation;
