
import React, { useState, useEffect } from 'react';
import { ChevronDown, Info, Calculator, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RiskManagementCalculatorProps {
  entryPrice: number;
  stopLoss: number;
  currency: string;
  onCalculate?: (positionSize: number) => void;
}

const RiskManagementCalculator: React.FC<RiskManagementCalculatorProps> = ({
  entryPrice,
  stopLoss,
  currency,
  onCalculate
}) => {
  const [accountBalance, setAccountBalance] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [positionSize, setPositionSize] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [leverage, setLeverage] = useState('1:1');
  const [showInLots, setShowInLots] = useState(false);

  const riskPresets = [0.5, 1, 2, 5];

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('riskSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setAccountBalance(settings.accountBalance || 1000);
        setRiskPercent(settings.riskPercent || 1);
      } catch (error) {
        console.error('Error loading risk settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('riskSettings', JSON.stringify({
      accountBalance,
      riskPercent
    }));
  }, [accountBalance, riskPercent]);

  // Calculate position size
  const calculatePositionSize = () => {
    if (!entryPrice || !stopLoss || accountBalance <= 0 || riskPercent <= 0) {
      return 0;
    }
    
    const riskAmount = accountBalance * (riskPercent / 100);
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    
    if (riskPerUnit <= 0) return 0;
    
    return riskAmount / riskPerUnit;
  };

  // Auto-calculate when inputs change
  useEffect(() => {
    const newPositionSize = calculatePositionSize();
    setPositionSize(newPositionSize);
    
    if (onCalculate) {
      onCalculate(newPositionSize);
    }
  }, [accountBalance, riskPercent, entryPrice, stopLoss]);

  // Handle calculate button
  const handleCalculate = () => {
    const size = calculatePositionSize();
    setPositionSize(size);
    
    if (onCalculate) {
      onCalculate(size);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setAccountBalance(1000);
    setRiskPercent(1);
    setPositionSize(0);
    setShowAdvanced(false);
    setLeverage('1:1');
  };

  // Format position size display
  const formatPositionSize = (size: number) => {
    if (size === 0) return '0';
    
    const isForexPair = currency.includes('/') || currency.includes('USD');
    const baseCurrency = currency.split('/')[0] || currency.replace('USD', '');
    
    if (isForexPair && showInLots) {
      // 1 standard lot = 100,000 units
      const lots = size / 100000;
      return `${lots.toFixed(2)} lots`;
    }
    
    return `${size.toFixed(4)} ${baseCurrency}`;
  };

  // Calculate risk-reward ratio
  const calculateRiskReward = () => {
    if (!entryPrice || !stopLoss) return 0;
    // Assuming 2:1 RR ratio for now - could be made dynamic
    return 2;
  };

  // Check if data is available
  const hasValidData = entryPrice > 0 && stopLoss > 0;

  return (
    <TooltipProvider>
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="bg-blue-600/20 p-2 rounded-full">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            Risk Management Calculator
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!hasValidData ? (
            <div className="text-red-500 py-8 text-center bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="font-medium">Entry price or stop loss not available</div>
              <div className="text-sm mt-1">Please run an analysis first to get trading levels</div>
            </div>
          ) : (
            <>
              {/* Account Balance */}
              <div>
                <Label className="flex items-center gap-1">
                  Account Balance ($)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your total trading account balance</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              {/* Risk Percentage */}
              <div>
                <Label className="flex items-center gap-1">
                  Risk Percentage (%)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of account you're willing to risk per trade</p>
                      <p>Recommended: 1-2% per trade</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                
                {/* Risk Presets */}
                <div className="flex space-x-2 mt-1 mb-2">
                  {riskPresets.map(preset => (
                    <Button
                      key={preset}
                      variant={riskPercent === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRiskPercent(preset)}
                      className="text-xs"
                    >
                      {preset}%
                    </Button>
                  ))}
                </div>
                
                <Input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                  className={`${riskPercent > 5 ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {riskPercent > 5 && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    ⚠️ Risk exceeds recommended 5%!
                  </p>
                )}
              </div>

              {/* Entry Price & Stop Loss */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entry Price</Label>
                  <Input
                    type="number"
                    readOnly
                    value={entryPrice.toFixed(5)}
                    className="bg-gray-100 dark:bg-gray-700 mt-1"
                  />
                </div>
                
                <div>
                  <Label>Stop Loss</Label>
                  <Input
                    type="number"
                    readOnly
                    value={stopLoss.toFixed(5)}
                    className="bg-gray-100 dark:bg-gray-700 mt-1"
                  />
                </div>
              </div>

              {/* Position Size Result */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Position Size:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInLots(!showInLots)}
                      className="text-xs"
                    >
                      {showInLots ? 'Units' : 'Lots'}
                    </Button>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatPositionSize(positionSize)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Risk Amount: ${(accountBalance * (riskPercent / 100)).toFixed(2)}
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-blue-600 dark:text-blue-400 text-sm flex items-center p-0 h-auto"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </Button>
                
                {showAdvanced && (
                  <div className="mt-3 space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-fade-in">
                    <div>
                      <Label>Leverage</Label>
                      <Select value={leverage} onValueChange={setLeverage}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">1:1</SelectItem>
                          <SelectItem value="1:10">1:10</SelectItem>
                          <SelectItem value="1:20">1:20</SelectItem>
                          <SelectItem value="1:50">1:50</SelectItem>
                          <SelectItem value="1:100">1:100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Risk-Reward Ratio</Label>
                      <Input
                        type="number"
                        value={calculateRiskReward()}
                        readOnly
                        className="bg-gray-100 dark:bg-gray-600 mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <Button
                  onClick={handleCalculate}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  Calculate
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default RiskManagementCalculator;
