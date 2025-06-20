
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TimeframeSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TimeframeSelect = ({ value, onChange, placeholder = "AI will auto-detect" }: TimeframeSelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="timeframe" className="text-white text-sm">Timeframe (Optional)</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600">
          <SelectItem value="1 Minute">1 Minute</SelectItem>
          <SelectItem value="5 Minutes">5 Minutes</SelectItem>
          <SelectItem value="15 Minutes">15 Minutes</SelectItem>
          <SelectItem value="30 Minutes">30 Minutes</SelectItem>
          <SelectItem value="1 Hour">1 Hour</SelectItem>
          <SelectItem value="4 Hours">4 Hours</SelectItem>
          <SelectItem value="Daily">Daily</SelectItem>
          <SelectItem value="Weekly">Weekly</SelectItem>
          <SelectItem value="Monthly">Monthly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimeframeSelect;
