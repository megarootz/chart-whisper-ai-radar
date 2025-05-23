
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
    "Support Levels", 
    "Resistance Levels",
    "Chart Patterns",
    "Technical Indicators",
    "Trading Insights"
  ];

  // Radar rotation animation
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

  // Scanning progress and detection simulation
  useEffect(() => {
    const scanAnimation = () => {
      setScanProgress((prev) => {
        const newProgress = (prev + 0.8) % 100;
        
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

  const radarSize = "w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px]";

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-gradient-to-br from-slate-950/98 via-blue-950/95 to-slate-900/98 backdrop-blur-xl border border-cyan-500/30 p-0 sm:max-w-4xl max-w-[95vw] overflow-hidden">
        <div className="relative w-full h-[700px] sm:h-[800px] lg:h-[900px] flex flex-col items-center justify-center">
          
          {/* Tech Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }}></div>
          </div>

          {/* Main Radar Display */}
          <div className={`relative ${radarSize} mb-8`}>
            
            {/* Outer Ring with Markings */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60">
              {/* Degree markings */}
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-4 bg-cyan-400/60"
                  style={{
                    top: '2px',
                    left: '50%',
                    transformOrigin: '50% 198px',
                    transform: `translateX(-50%) rotate(${i * 15}deg)`
                  }}
                />
              ))}
              {/* Main cardinal points */}
              {[0, 90, 180, 270].map((deg, i) => (
                <div
                  key={deg}
                  className="absolute text-cyan-400 text-xs font-mono"
                  style={{
                    top: deg === 0 ? '-20px' : deg === 180 ? 'calc(100% + 8px)' : '50%',
                    left: deg === 90 ? 'calc(100% + 8px)' : deg === 270 ? '-24px' : '50%',
                    transform: `translate(${deg === 90 ? '0' : deg === 270 ? '0' : '-50%'}, ${deg === 0 || deg === 180 ? '0' : '-50%'})`
                  }}
                >
                  {['000', '090', '180', '270'][i]}
                </div>
              ))}
            </div>
            
            {/* Inner Radar Rings */}
            <div className="absolute inset-6 rounded-full border border-cyan-400/30"></div>
            <div className="absolute inset-12 rounded-full border border-cyan-400/20"></div>
            <div className="absolute inset-20 rounded-full border border-cyan-400/15"></div>
            <div className="absolute inset-28 rounded-full border border-cyan-400/10"></div>
            
            {/* Radar Lines */}
            <div className="absolute inset-0">
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 w-full h-px bg-cyan-400/30 transform -translate-y-0.5"></div>
              {/* Vertical line */}
              <div className="absolute top-0 left-1/2 w-px h-full bg-cyan-400/30 transform -translate-x-0.5"></div>
            </div>

            {/* Central Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400">
              <div className="absolute inset-1 rounded-full bg-white/30 flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Rotating Radar Sweep */}
            <div 
              className="absolute inset-0 origin-center pointer-events-none"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {/* Main sweep beam */}
              <div 
                className="absolute top-0 left-1/2 w-1 h-1/2 transform -translate-x-1/2 origin-bottom"
                style={{
                  background: `linear-gradient(to top, 
                    rgba(6, 182, 212, 1), 
                    rgba(6, 182, 212, 0.8) 20%, 
                    rgba(6, 182, 212, 0.4) 40%, 
                    rgba(6, 182, 212, 0.1) 70%,
                    transparent 100%
                  )`
                }}
              ></div>
              
              {/* Sweep glow effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-60"
                style={{
                  background: `conic-gradient(
                    from ${rotation}deg, 
                    transparent, 
                    rgba(6, 182, 212, 0.3) 20deg, 
                    rgba(34, 211, 238, 0.2) 40deg, 
                    transparent 60deg
                  )`
                }}
              ></div>
            </div>

            {/* Detected Blips */}
            {detectedItems.map((item, i) => (
              <div
                key={item}
                className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping"
                style={{
                  top: `${30 + Math.sin((i * 60 + rotation) * Math.PI / 180) * 25 + 25}%`,
                  left: `${50 + Math.cos((i * 60 + rotation) * Math.PI / 180) * 25}%`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.8
                }}
              >
                <div className="absolute inset-0 bg-green-400 rounded-full"></div>
              </div>
            ))}

            {/* Corner Tech Elements */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-cyan-400/80"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2 border-cyan-400/80"></div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-2 border-b-2 border-cyan-400/80"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-cyan-400/80"></div>
          </div>

          {/* Status Display */}
          <div className="text-center space-y-6 px-6 max-w-4xl">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wider font-mono">
                SCANNING CHART DATA
              </h2>
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* Scan Progress */}
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-cyan-400 font-mono text-sm">SCAN PROGRESS</span>
                  <span className="text-cyan-400 font-mono text-sm">{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Detection Display */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {tradingDataTypes.map((dataType, index) => (
                  <div 
                    key={dataType}
                    className={`p-3 rounded-lg border transition-all duration-500 ${
                      detectedItems.includes(dataType)
                        ? 'bg-green-900/30 border-green-400/50 text-green-400'
                        : 'bg-slate-800/30 border-slate-600/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        detectedItems.includes(dataType) 
                          ? 'bg-green-400 animate-pulse' 
                          : 'bg-slate-500'
                      }`}></div>
                      <span className="text-xs font-mono">{dataType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
              <div className="text-center space-y-1 p-3 bg-slate-800/30 rounded-lg border border-cyan-500/20">
                <div className="text-cyan-400 font-bold text-lg font-mono">AI</div>
                <div className="text-slate-400 text-xs font-mono">ENGINE</div>
              </div>
              <div className="text-center space-y-1 p-3 bg-slate-800/30 rounded-lg border border-cyan-500/20">
                <div className="text-cyan-400 font-bold text-lg font-mono">&lt;3s</div>
                <div className="text-slate-400 text-xs font-mono">SPEED</div>
              </div>
              <div className="text-center space-y-1 p-3 bg-slate-800/30 rounded-lg border border-cyan-500/20">
                <div className="text-cyan-400 font-bold text-lg font-mono">99%</div>
                <div className="text-slate-400 text-xs font-mono">ACCURACY</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RadarAnimation;
