
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
      hasIframe: !!widgetContainer.querySelector('iframe'),
      innerHTML: widgetContainer.innerHTML.substring(0, 200)
    });
    
    // Wait for widget to render
    console.log('⏳ Waiting for widget to render...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for iframe and wait for it to load
    const iframe = widgetContainer.querySelector('iframe');
    if (iframe) {
      console.log('📊 TradingView iframe found, waiting for chart data...');
      // Wait for iframe content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to access iframe content to verify it's loaded
      try {
        console.log('🔍 Iframe src:', iframe.src);
        console.log('🔍 Iframe dimensions:', iframe.offsetWidth, 'x', iframe.offsetHeight);
      } catch (e) {
        console.log('⚠️ Cannot access iframe content (expected due to CORS)');
      }
    } else {
      console.warn('❌ No TradingView iframe found in widget container!');
    }
    
    console.log('📷 Capturing screenshot...');
    const canvas = await html2canvas(widgetContainer, {
      scale: options?.scale || 2, // Increased scale for better quality
      useCORS: options?.useCORS || true,
      allowTaint: true,
      foreignObjectRendering: true,
      logging: true, // Enable logging to see what's happening
      width: widgetContainer.offsetWidth,
      height: widgetContainer.offsetHeight,
      backgroundColor: '#131722'
    });
    
    const dataUrl = canvas.toDataURL('image/png', 1.0); // Maximum quality
    
    console.log('✅ Screenshot captured successfully:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      dataUrlLength: dataUrl.length,
      dataUrlStart: dataUrl.substring(0, 100)
    });
    
    // Verify the image contains actual chart data
    if (dataUrl.length < 50000) {
      console.warn('⚠️ Screenshot seems too small, might not contain chart data');
    }
    
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
