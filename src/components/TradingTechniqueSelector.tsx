
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const TRADING_TECHNIQUES = [
  { value: 'general', label: 'General Technical Analysis' },
  { value: 'breakout', label: 'Breakout Technique' },
  { value: 'supply-demand', label: 'Supply and Demand (SnD)' },
  { value: 'support-resistance', label: 'Support and Resistance (SnR)' },
  { value: 'fibonacci', label: 'Fibonacci Analysis' },
  { value: 'ict', label: 'ICT (Inner Circle Trader) Concepts' },
  { value: 'smart-money', label: 'Smart Money Concepts' },
  { value: 'price-action', label: 'Price Action Analysis' },
  { value: 'harmonic', label: 'Harmonic Patterns' },
  { value: 'elliott-wave', label: 'Elliott Wave Theory' },
] as const;

export type TradingTechnique = typeof TRADING_TECHNIQUES[number]['value'];

interface TradingTechniqueSelectorProps {
  selectedTechnique: TradingTechnique;
  onTechniqueChange: (technique: TradingTechnique) => void;
}

const TradingTechniqueSelector = ({ selectedTechnique, onTechniqueChange }: TradingTechniqueSelectorProps) => {
  return (
    <Card className="bg-chart-card border-gray-700 mb-6">
      <CardContent className="p-4">
        <Label htmlFor="technique-select" className="text-white font-semibold mb-4 block">
          Trading Technique Focus
        </Label>
        <Select value={selectedTechnique} onValueChange={onTechniqueChange}>
          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Select a trading technique" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            {TRADING_TECHNIQUES.map((technique) => (
              <SelectItem 
                key={technique.value} 
                value={technique.value}
                className="text-white hover:bg-gray-700"
              >
                {technique.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-gray-400 text-sm mt-2">
          The AI will focus on analyzing your charts using the selected trading technique and methodology.
        </p>
      </CardContent>
    </Card>
  );
};

export default TradingTechniqueSelector;
