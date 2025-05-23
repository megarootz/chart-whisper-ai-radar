
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const RadarAnimation = ({ isOpen = true }) => {
  const [rotation, setRotation] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const animationRef = useRef<number>();
  const scanRef = useRef<number>();

  const tradingDataTypes = [
    "Trend Direction",
    "Key Support Levels", 
    "Key Resistance Levels",
    "Chart Patterns",
    "Technical Indicators",
    "Trading Insights"
  ];

  // Radar rotation animation
  useEffect(() => {
    const animate = () => {
      setRotation((prev) => (prev + 1.5) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Scanning progress and detection simulation
  useEffect(() => {
    const scanAnimation = () => {
      setScanProgress((prev) => {
        const newProgress = (prev + 1.2) % 100;
        
        // Simulate detection of trading data
        if (newProgress < prev) {
          const randomItem = tradingDataTypes[Math.floor(Math.random() * tradingDataTypes.length)];
          setDetectedItems(current => {
            if (!current.includes(randomItem) && current.length < tradingDataTypes.length) {
              return [...current, randomItem];
            }
            return current;
          });
        }
        
        return newProgress;
      });
      scanRef.current = requestAnimationFrame(scanAnimation);
    };

    scanRef.current = requestAnimationFrame(scanAnimation);

    return () => {
      if (scanRef.current) {
        cancelAnimationFrame(scanRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-black/95 border-2 border-blue-500/30 backdrop-blur-xl p-0 sm:max-w-5xl max-w-[98vw] max-h-[98vh] overflow-hidden shadow-2xl shadow-blue-500/20">
        <div className="relative w-full min-h-[600px] sm:min-h-[700px] lg:min-h-[800px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 sm:p-6 lg:p-8">
          
          {/* Animated Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              animation: 'pulse 4s ease-in-out infinite'
            }}></div>
          </div>

          {/* Floating Tech Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/60 rounded-full animate-pulse"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Main Radar Display */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 mb-6 sm:mb-8">
            
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-500/20 blur-lg animate-pulse"></div>
            
            {/* Main Outer Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-400/70 shadow-lg shadow-blue-400/30">
              {/* Enhanced Degree Markings */}
              {Array.from({ length: 36 }, (_, i) => (
                <div
                  key={i}
                  className={`absolute ${i % 9 === 0 ? 'w-1 h-6 bg-blue-300' : 'w-0.5 h-3 bg-blue-400/60'}`}
                  style={{
                    top: i % 9 === 0 ? '2px' : '4px',
                    left: '50%',
                    transformOrigin: `50% ${i % 9 === 0 ? '126px' : '124px'}`,
                    transform: `translateX(-50%) rotate(${i * 10}deg)`
                  }}
                />
              ))}
              
              {/* Cardinal Direction Labels */}
              {[
                { deg: 0, label: 'N', pos: { top: '-25px', left: '50%', transform: 'translateX(-50%)' } },
                { deg: 90, label: 'E', pos: { top: '50%', right: '-25px', transform: 'translateY(-50%)' } },
                { deg: 180, label: 'S', pos: { bottom: '-25px', left: '50%', transform: 'translateX(-50%)' } },
                { deg: 270, label: 'W', pos: { top: '50%', left: '-25px', transform: 'translateY(-50%)' } }
              ].map(({ label, pos }) => (
                <div
                  key={label}
                  className="absolute text-blue-300 text-sm font-bold font-mono tracking-wider"
                  style={pos}
                >
                  {label}
                </div>
              ))}
            </div>
            
            {/* Concentric Radar Rings */}
            {[75, 60, 45, 30, 15].map((percent, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-blue-400/40"
                style={{
                  inset: `${(100 - percent) / 2}%`,
                  boxShadow: `inset 0 0 ${10 + i * 2}px rgba(59, 130, 246, 0.1)`
                }}
              />
            ))}
            
            {/* Radar Cross Lines */}
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent transform -translate-y-0.5"></div>
              <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-400/60 to-transparent transform -translate-x-0.5"></div>
            </div>

            {/* Enhanced Central Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 shadow-lg shadow-blue-400/50 animate-pulse">
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-600/80 to-cyan-500/80 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              </div>
              {/* Pulsing rings around center */}
              <div className="absolute inset-0 rounded-full border-2 border-blue-300/40 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-0 rounded-full border border-cyan-300/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            </div>

            {/* Enhanced Rotating Radar Sweep */}
            <div 
              className="absolute inset-0 origin-center pointer-events-none"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {/* Main Sweep Beam */}
              <div 
                className="absolute top-0 left-1/2 w-2 h-1/2 transform -translate-x-1/2 origin-bottom"
                style={{
                  background: `linear-gradient(to top, 
                    rgba(59, 130, 246, 0.9), 
                    rgba(34, 211, 238, 0.7) 20%, 
                    rgba(59, 130, 246, 0.5) 40%, 
                    rgba(34, 211, 238, 0.3) 60%,
                    rgba(59, 130, 246, 0.1) 80%,
                    transparent 100%
                  )`,
                  filter: 'blur(1px)',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)'
                }}
              ></div>
              
              {/* Sweep Trail Effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-40"
                style={{
                  background: `conic-gradient(
                    from ${rotation}deg, 
                    transparent, 
                    rgba(59, 130, 246, 0.4) 15deg, 
                    rgba(34, 211, 238, 0.3) 30deg, 
                    rgba(59, 130, 246, 0.2) 45deg,
                    transparent 60deg
                  )`
                }}
              ></div>
            </div>

            {/* Enhanced Detection Blips */}
            {detectedItems.map((item, i) => {
              const angle = (i * 60 + rotation) * Math.PI / 180;
              const radius = 30 + (i % 3) * 15;
              return (
                <div
                  key={item}
                  className="absolute w-4 h-4 rounded-full animate-pulse"
                  style={{
                    top: `${50 + Math.sin(angle) * radius}%`,
                    left: `${50 + Math.cos(angle) * radius}%`,
                    background: 'radial-gradient(circle, #10B981, #059669)',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.8), inset 0 0 5px rgba(255, 255, 255, 0.3)',
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '1.5s'
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-emerald-300/40 animate-ping"></div>
                  <div className="absolute inset-1 rounded-full bg-emerald-200/60"></div>
                </div>
              );
            })}

            {/* Enhanced Corner Tech Elements */}
            {[
              { top: '-4px', left: '-4px', rotate: '0deg' },
              { top: '-4px', right: '-4px', rotate: '90deg' },
              { bottom: '-4px', right: '-4px', rotate: '180deg' },
              { bottom: '-4px', left: '-4px', rotate: '270deg' }
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-12 h-12 border-l-2 border-t-2 border-blue-400/70"
                style={{ ...pos, transform: `rotate(${pos.rotate})` }}
              >
                <div className="absolute top-0 left-0 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Enhanced Status Display */}
          <div className="text-center space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-5xl w-full">
            {/* Main Title */}
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 tracking-wider font-mono">
                AI CHART ANALYSIS IN PROGRESS
              </h2>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* Enhanced Progress Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-500/30 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-blue-300 font-mono text-sm sm:text-base font-semibold">SCAN PROGRESS</span>
                  <span className="text-cyan-300 font-mono text-sm sm:text-base font-bold">{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full bg-gray-800/80 rounded-full h-3 overflow-hidden border border-blue-500/20">
                  <div 
                    className="h-3 rounded-full transition-all duration-200 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 shadow-lg"
                    style={{ 
                      width: `${scanProgress}%`,
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 10px rgba(59, 130, 246, 0.5)'
                    }}
                  ></div>
                </div>
              </div>

              {/* Enhanced Detection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {tradingDataTypes.map((dataType, index) => {
                  const isDetected = detectedItems.includes(dataType);
                  return (
                    <div 
                      key={dataType}
                      className={`p-3 sm:p-4 rounded-lg border transition-all duration-700 backdrop-blur-sm ${
                        isDetected
                          ? 'bg-emerald-900/40 border-emerald-400/60 text-emerald-200 shadow-lg shadow-emerald-400/20'
                          : 'bg-gray-800/60 border-gray-500/40 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                          isDetected 
                            ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50' 
                            : 'bg-gray-500'
                        }`}></div>
                        <span className="text-xs sm:text-sm font-mono font-medium">{dataType}</span>
                        {isDetected && (
                          <div className="ml-auto">
                            <div className="w-2 h-2 bg-emerald-300 rounded-full animate-ping"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enhanced System Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 max-w-lg mx-auto">
              {[
                { label: 'AI ENGINE', value: 'GPT-4', color: 'from-blue-500 to-cyan-400' },
                { label: 'SPEED', value: '<3s', color: 'from-cyan-400 to-blue-500' },
                { label: 'ACCURACY', value: '99%', color: 'from-blue-500 to-cyan-400' }
              ].map((stat, i) => (
                <div 
                  key={stat.label}
                  className="text-center space-y-1 sm:space-y-2 p-3 sm:p-4 bg-gray-800/70 backdrop-blur-sm rounded-lg border border-blue-500/30 shadow-lg hover:shadow-blue-400/20 transition-all duration-300"
                >
                  <div className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color} font-bold text-sm sm:text-lg font-mono`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-xs font-mono tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RadarAnimation;
