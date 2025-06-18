
import React from 'react';
import Header from '@/components/Header';
import TradingViewWidget from '@/components/TradingViewWidget';
import { useIsMobile } from '@/hooks/use-mobile';
import SEOHead from '@/components/SEOHead';

const ChartPage = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-screen bg-chart-bg">
      <SEOHead
        title="TradingView Chart - ForexRadar7"
        description="Professional TradingView charts for forex analysis. View real-time forex pairs with advanced charting tools and technical indicators."
        keywords="tradingview chart, forex charts, technical analysis, forex trading, currency pairs, EURUSD, GBPUSD"
      />
      
      <Header />
      
      <main className={`flex-1 ${isMobile ? 'mt-16 mb-14' : 'mt-14'} overflow-hidden`}>
        <div className="h-full w-full">
          <TradingViewWidget />
        </div>
      </main>
    </div>
  );
};

export default ChartPage;
