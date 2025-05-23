
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
      setRotation((prev) => (prev + 2) % 360);
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
        const increment = Math.max(1, 3 * Math.random());
        const newProgress = Math.min(prev + increment, 95);
        return newProgress;
      });
    }, 500);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-gray-950 border border-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl sm:max-w-lg max-w-[95vw]">
        <div className="flex flex-col items-center w-full max-w-lg mx-auto">
          {/* Radar Container */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
            {/* Background Circles */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 bg-gradient-to-br from-gray-900/80 to-black/90 backdrop-blur-sm">
              <div className="absolute inset-4 rounded-full border border-blue-400/30"></div>
              <div className="absolute inset-8 rounded-full border border-blue-300/40"></div>
              <div className="absolute inset-12 rounded-full border border-blue-200/50"></div>
            </div>

            {/* Grid Lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-0.5 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>
            </div>

            {/* Rotating Sweep */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-b from-blue-400 via-blue-500/80 to-transparent transform -translate-x-1/2 shadow-lg shadow-blue-500/50"></div>
              <div 
                className="absolute inset-0 rounded-full opacity-60"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.3) 30deg, transparent 60deg, transparent 360deg)`
                }}
              ></div>
            </div>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative p-3 rounded-full bg-blue-600/20 border border-blue-400/50">
                <Radar className="w-8 h-8 text-blue-400 animate-pulse-slow" />
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
              </div>
            </div>

            {/* Decorative Dots */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-pulse-slow"
                style={{
                  top: `${50 + 42 * Math.sin((i * 30) * Math.PI / 180)}%`,
                  left: `${50 + 42 * Math.cos((i * 30) * Math.PI / 180)}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>

          {/* Progress Section */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300 font-medium">Processing Chart</span>
              <span className="text-blue-400 font-bold">{Math.round(progress)}%</span>
            </div>
            
            <div className="relative">
              <Progress value={progress} className="h-3 bg-gray-800/80 border border-gray-700">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-lg shadow-blue-500/30"
                  style={{ width: `${progress}%` }}
                ></div>
              </Progress>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse-slow"></div>
            </div>
          </div>
          
          {/* Text Content */}
          <div className="text-center space-y-3 mt-6">
            <h3 className="text-2xl font-bold text-white">AI Analysis in Progress</h3>
            <p className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed">
              Our advanced AI is scanning your chart to identify patterns, support & resistance levels, and trading opportunities
            </p>
          </div>
          
          {/* Loading Dots */}
          <div className="flex space-x-2 mt-6">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 bg-blue-500 rounded-full animate-radar-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RadarAnimation;
