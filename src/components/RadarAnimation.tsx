
import React, { useEffect, useRef, useState } from 'react';
import { Radar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const RadarAnimation = ({ isOpen = true }) => {
  const [rotation, setRotation] = useState(0);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Animate the radar rotation
  useEffect(() => {
    const animate = () => {
      setRotation((prev) => (prev + 0.5) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Simulate progress for the analysis
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        // Slowly increase progress, but make it seem non-linear
        const increment = Math.max(1, 5 * Math.random());
        const newProgress = Math.min(prev + increment, 95);
        return newProgress;
      });
    }, 400);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-black border border-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl sm:max-w-lg max-w-[95vw]">
        <div className="flex flex-col items-center w-full max-w-lg mx-auto">
          <div className="relative w-56 h-56 md:w-80 md:h-80">
            {/* Main circular container */}
            <div className="absolute inset-0 rounded-full border border-gray-700 flex items-center justify-center overflow-hidden bg-gray-900/50 backdrop-blur-sm">
              {/* Animated gradient background */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(16, 24, 39, 0) 70%)`,
                  animation: 'pulse 4s ease-in-out infinite alternate'
                }}
              ></div>
              
              {/* Outer ring */}
              <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full"></div>
              
              {/* Middle ring with pulse */}
              <div className="absolute w-3/4 h-3/4 border border-blue-400/40 rounded-full"
                style={{ boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}></div>
              
              {/* Inner ring */}
              <div className="absolute w-1/2 h-1/2 border border-blue-300/50 rounded-full"></div>
              
              {/* Center dot */}
              <div className="absolute w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
              
              {/* Radar scan line */}
              <div 
                className="absolute inset-0 origin-center"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div className="h-1/2 w-1 bg-gradient-to-t from-blue-500 to-transparent mx-auto"></div>
                
                {/* Scan glow effect */}
                <div className="w-full h-full absolute top-0 left-0 opacity-70"
                  style={{
                    background: `conic-gradient(from ${rotation}deg, transparent, rgba(59, 130, 246, 0.6) 30deg, transparent 60deg)`,
                    backgroundSize: '100% 100%'
                  }}
                ></div>
              </div>
              
              {/* Grid overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-full h-full border-2 border-blue-300/30 rounded-full"></div>
                {/* Horizontal line */}
                <div className="absolute w-full h-px bg-blue-300/30"></div>
                {/* Vertical line */}
                <div className="absolute w-px h-full bg-blue-300/30"></div>
              </div>
              
              {/* Grid dots */}
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/50 rounded-full"
                  style={{
                    top: `${50 + 38 * Math.sin(i * Math.PI / 4)}%`,
                    left: `${50 + 38 * Math.cos(i * Math.PI / 4)}%`
                  }}
                ></div>
              ))}
            </div>

            {/* Radar icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Radar size={46} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30"></div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full mt-8">
            <div className="flex justify-between text-sm text-gray-400 mb-1.5">
              <span>Processing</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-800">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </Progress>
          </div>
          
          <h3 className="text-white font-medium text-2xl mt-8">Analyzing Chart</h3>
          <p className="text-gray-400 text-center text-sm md:text-base max-w-md mt-2">
            Our AI is processing your chart to identify patterns, support & resistance levels, and trading opportunities
          </p>
          
          {/* Processing indicators */}
          <div className="flex gap-3 mt-6">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 rounded-full bg-blue-500"
                style={{
                  animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite both`
                }}
              ></div>
            ))}
          </div>
          
          <style jsx="true">{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulse {
              0% { opacity: 0.1; }
              50% { opacity: 0.3; }
              100% { opacity: 0.1; }
            }
          `}</style>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RadarAnimation;
