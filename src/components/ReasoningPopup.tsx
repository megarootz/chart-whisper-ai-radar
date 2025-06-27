
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Brain, Sparkles } from 'lucide-react';

interface ReasoningPopupProps {
  isOpen: boolean;
}

const ReasoningPopup: React.FC<ReasoningPopupProps> = ({ isOpen }) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <div className="flex flex-col items-center space-y-4 py-6">
          {/* Animated brain icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
            <div className="relative bg-purple-600/10 p-4 rounded-full border border-purple-500/30">
              <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
            </div>
          </div>
          
          {/* Title */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-white">
              AI Reasoning in Progress
            </h3>
            <p className="text-gray-400 text-sm">
              Advanced AI model is analyzing your data...
            </p>
          </div>
          
          {/* Animated reasoning steps */}
          <div className="space-y-3 w-full max-w-xs">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-sm text-gray-300">Processing historical data...</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
              </div>
              <span className="text-sm text-gray-300">Analyzing market patterns...</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-700"></div>
              </div>
              <span className="text-sm text-gray-300">Generating insights...</span>
            </div>
          </div>
          
          {/* Sparkles decoration */}
          <div className="flex justify-center space-x-2 pt-2">
            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
            <Sparkles className="h-3 w-3 text-blue-400 animate-pulse delay-500" />
            <Sparkles className="h-4 w-4 text-purple-400 animate-pulse delay-1000" />
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full animate-pulse"></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReasoningPopup;
