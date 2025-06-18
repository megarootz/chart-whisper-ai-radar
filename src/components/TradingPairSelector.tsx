
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TradingPairSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TRADING_PAIRS = [
  { value: 'OANDA:EURUSD', label: 'EUR/USD', description: 'Euro / US Dollar' },
  { value: 'OANDA:GBPUSD', label: 'GBP/USD', description: 'British Pound / US Dollar' },
  { value: 'OANDA:USDJPY', label: 'USD/JPY', description: 'US Dollar / Japanese Yen' },
  { value: 'OANDA:USDCHF', label: 'USD/CHF', description: 'US Dollar / Swiss Franc' },
  { value: 'OANDA:USDCAD', label: 'USD/CAD', description: 'US Dollar / Canadian Dollar' },
  { value: 'OANDA:AUDUSD', label: 'AUD/USD', description: 'Australian Dollar / US Dollar' },
  { value: 'OANDA:NZDUSD', label: 'NZD/USD', description: 'New Zealand Dollar / US Dollar' },
  { value: 'OANDA:EURJPY', label: 'EUR/JPY', description: 'Euro / Japanese Yen' },
  { value: 'OANDA:GBPJPY', label: 'GBP/JPY', description: 'British Pound / Japanese Yen' },
  { value: 'OANDA:EURGBP', label: 'EUR/GBP', description: 'Euro / British Pound' },
  { value: 'OANDA:EURCHF', label: 'EUR/CHF', description: 'Euro / Swiss Franc' },
  { value: 'OANDA:GBPCHF', label: 'GBP/CHF', description: 'British Pound / Swiss Franc' },
  { value: 'OANDA:AUDJPY', label: 'AUD/JPY', description: 'Australian Dollar / Japanese Yen' },
  { value: 'OANDA:CADJPY', label: 'CAD/JPY', description: 'Canadian Dollar / Japanese Yen' },
  { value: 'OANDA:CHFJPY', label: 'CHF/JPY', description: 'Swiss Franc / Japanese Yen' },
  { value: 'OANDA:XAUUSD', label: 'XAU/USD', description: 'Gold / US Dollar' }
];

const TradingPairSelector: React.FC<TradingPairSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-white font-medium">Trading Pair</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
          <SelectValue placeholder="Select a trading pair" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {TRADING_PAIRS.map((pair) => (
            <SelectItem 
              key={pair.value} 
              value={pair.value}
              className="text-white hover:bg-gray-700 focus:bg-gray-700"
            >
              <div className="flex flex-col">
                <span className="font-medium">{pair.label}</span>
                <span className="text-xs text-gray-400">{pair.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TradingPairSelector;
