
import React from 'react';
import { ChartCandlestick } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between bg-chart-card">
      <div className="flex items-center space-x-2">
        <ChartCandlestick className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-white">ForexRadar<span className="text-primary">7</span></h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm">
          Help
        </Button>
        <Button size="sm">
          My Analysis
        </Button>
      </div>
    </header>
  );
};

export default Header;
