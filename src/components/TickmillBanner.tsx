
import React from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TickmillBanner = () => {
  return (
    <div className="bg-chart-card border border-gray-700 rounded-lg p-4 md:p-6 overflow-hidden relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-full">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center">
              <p className="text-white font-medium">Powered by</p>
              <span className="text-primary font-bold ml-2">Tickmill</span>
            </div>
            <p className="text-sm text-gray-400">Professional trading tools and deep liquidity</p>
          </div>
        </div>
        
        <Button 
          className="shrink-0 bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20" 
          onClick={() => window.open('https://tickmill.link/42ZXbEB', '_blank')}
        >
          Open Account <ExternalLink className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
      
      <div className="hidden md:block absolute -top-14 -right-14 w-48 h-48 bg-primary/10 rounded-full blur-xl"></div>
      <div className="hidden md:block absolute -bottom-16 -right-4 w-36 h-36 bg-primary/5 rounded-full blur-lg"></div>
    </div>
  );
};

export default TickmillBanner;
