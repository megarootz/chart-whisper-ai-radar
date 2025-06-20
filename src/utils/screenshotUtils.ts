
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
    console.log('📊 Widget container details:', {
      width: widgetContainer.offsetWidth,
      height: widgetContainer.offsetHeight,
      hasIframe: !!widgetContainer.querySelector('iframe')
    });
    
    // Wait for widget container to be properly sized
    console.log('⏳ Waiting for widget to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for iframe
    const iframe = widgetContainer.querySelector('iframe');
    if (!iframe) {
      console.error('❌ No TradingView iframe found in widget container!');
      return {
        success: false,
        error: 'TradingView chart iframe not found. Chart may not be loaded properly.'
      };
    }
    
    console.log('📊 TradingView iframe found');
    console.log('🔍 Iframe details:', {
      src: iframe.src,
      width: iframe.offsetWidth,
      height: iframe.offsetHeight
    });
    
    // Wait for chart data to load
    console.log('📈 Waiting for chart data to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📷 Capturing screenshot with html2canvas...');
    
    // Use more permissive html2canvas settings
    const canvas = await html2canvas(widgetContainer, {
      scale: options?.scale || 1,
      useCORS: options?.useCORS !== false,
      allowTaint: true,
      foreignObjectRendering: false,
      logging: false, // Reduce console noise
      width: widgetContainer.offsetWidth,
      height: widgetContainer.offsetHeight,
      backgroundColor: '#1a1a1a', // Dark background to match theme
      removeContainer: false,
      imageTimeout: 15000,
      ignoreElements: (element) => {
        // Skip problematic elements that might cause issues
        return element.tagName === 'SCRIPT' || element.tagName === 'NOSCRIPT';
      }
    });
    
    console.log('✅ html2canvas completed');
    console.log('📊 Canvas details:', {
      width: canvas.width,
      height: canvas.height,
      hasContext: !!canvas.getContext('2d')
    });
    
    // Convert to data URL with high quality
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    console.log('✅ Screenshot data URL created:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      dataUrlLength: dataUrl.length,
      sizeKB: Math.round(dataUrl.length / 1024)
    });
    
    // Relaxed validation - just check if we have a valid data URL
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      console.warn('⚠️ Invalid data URL format');
      return {
        success: false,
        error: 'Screenshot capture failed - invalid image format'
      };
    }
    
    // Much more lenient size check - just ensure it's not completely empty
    if (dataUrl.length < 1000) {
      console.warn('⚠️ Screenshot appears too small:', dataUrl.length);
      return {
        success: false,
        error: `Screenshot appears to be empty (${dataUrl.length} chars)`
      };
    }
    
    // Simple canvas content validation
    if (canvas.width < 100 || canvas.height < 100) {
      console.warn('⚠️ Canvas dimensions too small:', `${canvas.width}x${canvas.height}`);
      return {
        success: false,
        error: `Canvas too small: ${canvas.width}x${canvas.height}. Chart may not be loaded.`
      };
    }
    
    console.log('✅ Screenshot validation passed');
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
