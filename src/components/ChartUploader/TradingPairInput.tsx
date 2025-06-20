
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TradingPairInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TradingPairInput = ({ value, onChange, placeholder = "e.g., EUR/USD, XAU/USD, BTC/USD" }: TradingPairInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="pair-name" className="text-white text-sm">Trading Pair (Optional)</Label>
      <Input
        id="pair-name"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 text-sm"
      />
    </div>
  );
};

export default TradingPairInput;
