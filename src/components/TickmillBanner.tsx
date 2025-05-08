
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TickmillBanner = () => {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 md:p-6 shadow-md overflow-hidden relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center">
            <h3 className="text-lg md:text-xl font-semibold text-primary">
              Powered by Tickmill
            </h3>
            <div className="ml-2 px-2 py-0.5 bg-primary/20 rounded-md text-xs text-primary font-medium">
              Recommended
            </div>
          </div>
          
          <p className="text-sm md:text-base text-gray-300">
            Trade forex, indices, commodities and more with competitive spreads and robust trading tools
          </p>
          
          <ul className="text-xs md:text-sm text-gray-400 space-y-1 pt-1">
            <li className="flex items-center">
              <span className="mr-1.5 text-primary">•</span> Fast execution & deep liquidity
            </li>
            <li className="flex items-center">
              <span className="mr-1.5 text-primary">•</span> Low spreads from 0.0 pips
            </li>
            <li className="flex items-center">
              <span className="mr-1.5 text-primary">•</span> No requotes, no rejections
            </li>
          </ul>
        </div>
        
        <Button 
          className="shrink-0 bg-primary hover:bg-primary/90 transition-all"
          size={window.innerWidth < 640 ? "default" : "lg"}
          onClick={() => window.open('https://tickmill.link/42ZXbEB', '_blank')}
        >
          Open Account <ExternalLink className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
      
      <div className="hidden md:block absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full"></div>
      <div className="hidden md:block absolute -bottom-14 -right-2 w-28 h-28 bg-primary/5 rounded-full"></div>
    </div>
  );
};

export default TickmillBanner;
