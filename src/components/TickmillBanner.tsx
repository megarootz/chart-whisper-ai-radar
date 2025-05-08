import React from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
const TickmillBanner = () => {
  return <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-lg p-5 md:p-6 shadow-md overflow-hidden relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <Star className="text-yellow-400 h-5 w-5" fill="currentColor" />
            <h3 className="text-lg md:text-xl font-bold text-white">Highly Recommended Broker</h3>
            <div className="ml-1 px-2 py-0.5 bg-primary/20 rounded-md text-xs text-primary font-medium">
              Premium
            </div>
          </div>
          
          <p className="text-sm md:text-base text-gray-200">
            Trade forex, indices, commodities and more with competitive spreads and robust trading tools
          </p>
          
          <ul className="text-xs md:text-sm text-gray-300 space-y-2 pt-1">
            <li className="flex items-center">
              <span className="mr-2 text-primary">•</span> Fast execution & deep liquidity
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-primary">•</span> Low spreads from 0.0 pips
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-primary">•</span> No requotes, no rejections
            </li>
          </ul>
        </div>
        
        <Button className="shrink-0 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20" size="lg" onClick={() => window.open('https://tickmill.link/42ZXbEB', '_blank')}>
          Open Account <ExternalLink className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
      
      <div className="hidden md:block absolute -top-14 -right-14 w-48 h-48 bg-primary/10 rounded-full blur-xl"></div>
      <div className="hidden md:block absolute -bottom-16 -right-4 w-36 h-36 bg-primary/5 rounded-full blur-lg"></div>
      <div className="hidden md:block absolute -bottom-8 -left-8 w-24 h-24 bg-yellow-500/5 rounded-full blur-md"></div>
    </div>;
};
export default TickmillBanner;