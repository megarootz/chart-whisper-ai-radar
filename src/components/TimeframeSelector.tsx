
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TimeframeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TIMEFRAMES = [
  { value: 'M1', label: '1M', description: '1 Minute' },
  { value: 'M5', label: '5M', description: '5 Minutes' },
  { value: 'M15', label: '15M', description: '15 Minutes' },
  { value: 'M30', label: '30M', description: '30 Minutes' },
  { value: 'H1', label: '1H', description: '1 Hour' },
  { value: 'H4', label: '4H', description: '4 Hours' },
  { value: 'D1', label: '1D', description: '1 Day' }
];

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-white font-medium">Timeframe</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
          <SelectValue placeholder="Select timeframe" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {TIMEFRAMES.map((timeframe) => (
            <SelectItem 
              key={timeframe.value} 
              value={timeframe.value}
              className="text-white hover:bg-gray-700 focus:bg-gray-700"
            >
              <div className="flex flex-col">
                <span className="font-medium">{timeframe.label}</span>
                <span className="text-xs text-gray-400">{timeframe.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimeframeSelector;
