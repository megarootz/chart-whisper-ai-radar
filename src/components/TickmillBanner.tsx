
import React from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const TickmillBanner = () => {
  const isMobile = useIsMobile();

  const handleOpenAccount = () => {
    window.open('https://my.tickmill.com?utm_campaign=ib_link&utm_content=IB36882052&utm_medium=Open+Account&utm_source=link&lp=https%3A%2F%2Fmy.tickmill.com%2Fen%2Fsign-up', '_blank');
  };

  return (
    <div className={`bg-chart-card border border-gray-700 rounded-lg overflow-hidden relative ${isMobile ? 'p-4' : 'p-6'}`}>
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row items-center justify-between gap-4'}`}>
        <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-3'}`}>
          <div className={`bg-primary/20 rounded-full ${isMobile ? 'p-2 flex-shrink-0' : 'p-2'}`}>
            <Star className={`text-primary ${isMobile ? 'h-5 w-5' : 'h-5 w-5'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <p className={`text-white font-medium ${isMobile ? 'text-base' : 'text-base'}`}>Highly Recommended</p>
              <span className={`text-primary font-bold ml-2 ${isMobile ? 'text-base' : 'text-base'}`}>Broker</span>
            </div>
            <p className={`text-gray-400 ${isMobile ? 'text-sm mt-1' : 'text-sm'}`}>Low spreads &amp; fast execution built for all traders.</p>
          </div>
        </div>
        
        <Button 
          type="button"
          size={isMobile ? "default" : "sm"}
          className={`bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer z-10 relative font-medium ${isMobile ? 'w-full text-base py-3' : 'shrink-0 text-sm'}`} 
          onClick={handleOpenAccount}
        >
          Open Account <ExternalLink className={`${isMobile ? 'ml-2 h-4 w-4' : 'ml-1.5 h-4 w-4'}`} />
        </Button>
      </div>
      
      {!isMobile && (
        <>
          <div className="absolute -top-14 -right-14 w-48 h-48 bg-primary/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-16 -right-4 w-36 h-36 bg-primary/5 rounded-full blur-lg"></div>
        </>
      )}
    </div>
  );
};

export default TickmillBanner;
