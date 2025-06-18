
import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AutoTradingViewWidget, { AutoTradingViewWidgetRef } from '@/components/AutoTradingViewWidget';
import { useIsMobile } from '@/hooks/use-mobile';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft } from 'lucide-react';

const ChartPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const widgetRef = useRef<AutoTradingViewWidgetRef>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);

  // Get symbol and interval from URL parameters, with defaults
  const symbol = searchParams.get('symbol') || 'OANDA:EURUSD';
  const interval = searchParams.get('interval') || '1D';
  const autoCapture = searchParams.get('autoCapture') === 'true';
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    // If autoCapture is true and chart is loaded, automatically capture screenshot
    if (autoCapture && chartLoaded && !isCapturing) {
      handleScreenshotCapture();
    }
  }, [autoCapture, chartLoaded, isCapturing]);

  const handleChartLoad = () => {
    console.log('📊 Chart loaded successfully');
    setChartLoaded(true);
  };

  const handleScreenshotCapture = async () => {
    if (!widgetRef.current || isCapturing) return;

    setIsCapturing(true);
    console.log('📸 Starting manual screenshot capture...');

    try {
      const result = await widgetRef.current.captureScreenshot();
      
      if (result.success && result.dataUrl) {
        console.log('✅ Screenshot captured successfully');
        
        // If this was triggered by auto-analysis, send the data back
        if (autoCapture && returnTo) {
          // Store the screenshot data in sessionStorage for the analyze page
          sessionStorage.setItem('chartScreenshot', result.dataUrl);
          sessionStorage.setItem('chartSymbol', symbol);
          sessionStorage.setItem('chartInterval', interval);
          
          // Navigate back to the analyze page
          navigate(returnTo);
        } else {
          // Manual capture - could show a success message or download
          console.log('📸 Manual screenshot captured');
        }
      } else {
        console.error('❌ Screenshot capture failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Screenshot error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleBackToAnalyze = () => {
    navigate('/analyze');
  };

  return (
    <div className="flex flex-col h-screen bg-chart-bg overflow-hidden">
      <SEOHead
        title={`TradingView Chart ${symbol} - ForexRadar7`}
        description={`Professional TradingView charts for ${symbol} analysis. View real-time forex pairs with advanced charting tools and technical indicators.`}
        keywords={`tradingview chart, forex charts, technical analysis, forex trading, currency pairs, ${symbol}`}
      />
      
      <Header />
      
      {/* Chart Controls */}
      {(autoCapture || returnTo) && (
        <div className="bg-chart-card border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToAnalyze}
              className="text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Analyze
            </Button>
            <span className="text-gray-400 text-sm">
              Loading {symbol} ({interval}) for analysis...
            </span>
          </div>
          
          {chartLoaded && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleScreenshotCapture}
              disabled={isCapturing}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              <Camera className="h-4 w-4 mr-1" />
              {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
            </Button>
          )}
        </div>
      )}
      
      <main className={`flex-1 ${isMobile ? 'mt-16 mb-14' : 'mt-14'} overflow-hidden`}>
        <div className="h-full w-full">
          <AutoTradingViewWidget 
            ref={widgetRef}
            symbol={symbol}
            interval={interval}
            onLoad={handleChartLoad}
          />
        </div>
      </main>
    </div>
  );
};

export default ChartPage;
