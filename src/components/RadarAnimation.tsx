
import React, { useEffect, useRef, useState } from 'react';
import { Radar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";

const RadarAnimation = ({ isOpen = true }) => {
  const [rotation, setRotation] = useState(0);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Animate the radar rotation
  useEffect(() => {
    const animate = () => {
      setRotation((prev) => (prev + 0.3) % 360);
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
      <DialogContent className="bg-chart-card border-gray-700 p-8 sm:max-w-lg max-w-[95vw]">
        <div className="flex flex-col items-center w-full max-w-lg mx-auto">
          <div className="relative w-56 h-56 md:w-80 md:h-80">
            {/* Outer circle */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 flex items-center justify-center">
              {/* Middle circle with glow effect */}
              <div className="w-3/4 h-3/4 rounded-full border-2 border-primary/40 flex items-center justify-center" 
                  style={{ boxShadow: '0 0 25px rgba(124, 58, 237, 0.35)' }}>
                {/* Inner circle */}
                <div className="w-1/2 h-1/2 rounded-full bg-primary/10 flex items-center justify-center">
                  {/* Pulsing dot in center */}
                  <div className="w-5 h-5 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Radar scan line */}
            <div 
              className="absolute inset-0 origin-center"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className="h-1/2 w-2 bg-gradient-to-t from-primary to-transparent mx-auto"></div>
              <div className="w-28 h-28 md:w-40 md:h-40 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-40 rounded-full"
                  style={{
                    background: `conic-gradient(from ${rotation}deg, transparent, rgba(124, 58, 237, 0.8) 60deg, transparent 120deg)`
                  }}
              ></div>
            </div>

            {/* Radar icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Radar size={56} className="text-primary animate-pulse" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full mt-10">
            <Progress value={progress} className="h-3 bg-gray-800" />
            <div className="flex justify-between text-sm text-gray-400 mt-3">
              <span>Processing</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
          
          <h3 className="text-white font-medium text-2xl mt-8">Analyzing Chart</h3>
          <p className="text-gray-400 text-center text-base md:text-lg max-w-md mt-3">
            Our AI is processing your chart to identify patterns, support & resistance levels, and trading opportunities
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RadarAnimation;
