
import html2canvas from 'html2canvas';

export interface ScreenshotResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

export const captureWidgetScreenshot = async (
  widgetContainer: HTMLElement,
  options?: {
    scale?: number;
    useCORS?: boolean;
  }
): Promise<ScreenshotResult> => {
  try {
    console.log('📸 Starting widget screenshot capture...');
    
    // Wait longer for TradingView widget to load fresh market data
    // TradingView widgets need time to connect to servers and load latest prices
    console.log('⏳ Waiting for TradingView widget to load latest market data...');
    await new Promise(resolve => setTimeout(resolve, 8000)); // Increased from 2s to 8s
    
    // Additional check to ensure the widget has loaded content
    const iframe = widgetContainer.querySelector('iframe');
    if (iframe) {
      console.log('📊 TradingView iframe detected, waiting for chart rendering...');
      // Wait additional time for chart rendering inside iframe
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('📷 Capturing chart screenshot with latest data...');
    const canvas = await html2canvas(widgetContainer, {
      scale: options?.scale || 1,
      useCORS: options?.useCORS || true,
      allowTaint: true,
      foreignObjectRendering: true,
      logging: false,
      width: widgetContainer.offsetWidth,
      height: widgetContainer.offsetHeight,
      backgroundColor: '#131722'
    });
    
    const dataUrl = canvas.toDataURL('image/png', 0.9);
    
    console.log('✅ Fresh chart screenshot captured successfully, size:', dataUrl.length);
    
    return {
      success: true,
      dataUrl
    };
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown screenshot error'
    };
  }
};

export const dataUrlToFile = (dataUrl: string, filename: string = 'chart-screenshot.png'): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};
