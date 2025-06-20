
import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AutoTradingViewWidget, { AutoTradingViewWidgetRef } from '@/components/AutoTradingViewWidget';
import { useIsMobile } from '@/hooks/use-mobile';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChartPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const widgetRef = useRef<AutoTradingViewWidgetRef>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<'waiting' | 'ready' | 'capturing' | 'success' | 'error'>('waiting');
  const { toast } = useToast();

  // Get symbol and interval from URL parameters, with defaults
  const symbol = searchParams.get('symbol') || 'OANDA:EURUSD';
  const interval = searchParams.get('interval') || '1D';
  const autoCapture = searchParams.get('autoCapture') === 'true';
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    // Auto-capture when chart is ready
    if (autoCapture && chartLoaded && !isCapturing && captureStatus === 'ready') {
      console.log('🚀 Auto-capture triggered - waiting for chart stabilization');
      
      toast({
        title: "Chart Ready",
        description: "Chart loaded. Preparing for capture...",
        variant: "default",
      });
      
      // Longer wait time for chart to fully load with live data
      setTimeout(() => {
        console.log('📊 Starting capture after stabilization wait');
        handleScreenshotCapture();
      }, 4000); // Increased to 4 seconds for better data loading
    }
  }, [autoCapture, chartLoaded, isCapturing, captureStatus]);

  const handleChartLoad = () => {
    console.log('📊 Chart loaded successfully - preparing for capture');
    setChartLoaded(true);
    setCaptureStatus('ready');
    
    if (autoCapture) {
      toast({
        title: "Chart Loading",
        description: "Chart widget ready. Preparing for capture...",
        variant: "default",
      });
    }
  };

  const handleScreenshotCapture = async () => {
    if (!widgetRef.current || isCapturing) return;

    setIsCapturing(true);
    setCaptureStatus('capturing');
    console.log('📸 Starting screenshot capture process...');

    try {
      toast({
        title: "Capturing Screenshot",
        description: "Taking screenshot of chart data...",
        variant: "default",
      });

      const result = await widgetRef.current.captureScreenshot();
      
      if (result.success && result.dataUrl) {
        console.log('✅ Screenshot captured successfully');
        setCaptureStatus('success');
        
        toast({
          title: "Screenshot Captured",
          description: "Chart screenshot captured successfully!",
          variant: "default",
        });
        
        // If this was triggered by auto-analysis, send the data back
        if (autoCapture && returnTo) {
          // Store the screenshot data in sessionStorage for the analyze page
          sessionStorage.setItem('chartScreenshot', result.dataUrl);
          sessionStorage.setItem('chartSymbol', symbol);
          sessionStorage.setItem('chartInterval', interval);
          
          console.log('📤 Screenshot data stored, navigating back to analyze page');
          
          toast({
            title: "Analyzing Chart",
            description: "Sending chart data to AI for analysis...",
            variant: "default",
          });
          
          // Quick navigation back
          setTimeout(() => {
            navigate(returnTo);
          }, 1000);
        }
      } else {
        console.error('❌ Screenshot capture failed:', result.error);
        setCaptureStatus('error');
        
        toast({
          title: "Screenshot Failed",
          description: result.error || "Failed to capture chart screenshot",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Screenshot error:', error);
      setCaptureStatus('error');
      
      toast({
        title: "Error",
        description: "An unexpected error occurred during screenshot capture",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleBackToAnalyze = () => {
    navigate('/analyze');
  };

  const getStatusIcon = () => {
    switch (captureStatus) {
      case 'waiting':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'capturing':
        return <Camera className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (captureStatus) {
      case 'waiting':
        return 'Loading chart...';
      case 'ready':
        return 'Ready to capture chart';
      case 'capturing':
        return 'Capturing screenshot...';
      case 'success':
        return 'Captured successfully!';
      case 'error':
        return 'Capture failed';
      default:
        return 'Unknown status';
    }
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
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-gray-400 text-sm">
                {symbol} ({interval}) - {getStatusText()}
              </span>
            </div>
          </div>
          
          {captureStatus === 'ready' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleScreenshotCapture}
              disabled={isCapturing}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              <Camera className="h-4 w-4 mr-1" />
              {isCapturing ? 'Capturing...' : 'Capture Chart'}
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
