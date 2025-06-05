
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Crown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface AnalysisModeSelectorProps {
  selectedMode: 'single' | 'multi';
  onModeChange: (mode: 'single' | 'multi') => void;
}

const AnalysisModeSelector = ({ selectedMode, onModeChange }: AnalysisModeSelectorProps) => {
  const { subscription } = useSubscription();
  const isFreeTier = !subscription || subscription.subscription_tier === 'free';

  return (
    <Card className="bg-chart-card border-gray-700 mb-6">
      <CardContent className="p-4">
        <h3 className="text-white font-semibold mb-4">Analysis Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant={selectedMode === 'single' ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-center gap-2 ${
              selectedMode === 'single' 
                ? 'bg-primary text-white' 
                : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800'
            }`}
            onClick={() => onModeChange('single')}
          >
            <TrendingUp className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Single Chart Analysis</div>
              <div className="text-xs opacity-75">Analyze one chart image</div>
              <div className="text-xs text-green-400 mt-1">All Plans</div>
            </div>
          </Button>

          <Button
            variant={selectedMode === 'multi' ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-center gap-2 ${
              selectedMode === 'multi' 
                ? 'bg-primary text-white' 
                : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800'
            } ${isFreeTier ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isFreeTier && onModeChange('multi')}
            disabled={isFreeTier}
          >
            <BarChart3 className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium flex items-center gap-1">
                Multi-Timeframe Analysis
                <Crown className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-xs opacity-75">Analyze up to 3 timeframes</div>
              <div className="text-xs text-yellow-400 mt-1">Starter & Pro Only</div>
            </div>
          </Button>
        </div>
        
        {isFreeTier && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
            <p className="text-yellow-400 text-sm">
              Multi-timeframe analysis is available for Starter and Pro subscribers. 
              <a href="/pricing" className="underline ml-1">Upgrade now</a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisModeSelector;
