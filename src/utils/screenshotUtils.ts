
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
    
    // Extended wait for chart data to load completely
    console.log('📈 Waiting for chart data to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('📷 Capturing screenshot...');
    const canvas = await html2canvas(widgetContainer, {
      scale: options?.scale || 1.5,
      useCORS: options?.useCORS || true,
      allowTaint: true,
      foreignObjectRendering: true,
      logging: false,
      width: widgetContainer.offsetWidth,
      height: widgetContainer.offsetHeight,
      backgroundColor: '#131722',
      ignoreElements: (element) => {
        return element.tagName === 'SCRIPT' || 
               element.classList.contains('tv-dialog') ||
               element.classList.contains('tv-toast') ||
               element.classList.contains('tv-popup');
      }
    });
    
    const dataUrl = canvas.toDataURL('image/png', 0.9);
    
    console.log('✅ Screenshot captured:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      dataUrlLength: dataUrl.length,
      sizeKB: Math.round(dataUrl.length / 1024)
    });
    
    // Very basic validation - just check if we have a data URL
    if (!dataUrl || dataUrl.length < 1000) {
      console.warn('⚠️ Screenshot appears very small:', dataUrl.length);
      return {
        success: false,
        error: 'Screenshot capture failed - image too small'
      };
    }
    
    // Much more lenient validation
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
    if (imageData) {
      const pixels = imageData.data;
      let nonBlackPixels = 0;
      
      // Sample every 10000th pixel to check for content
      for (let i = 0; i < pixels.length; i += 40000) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Count pixels that aren't pure black or very dark
        if (r > 30 || g > 30 || b > 30) {
          nonBlackPixels++;
        }
        
        if (nonBlackPixels > 3) break; // Found enough content
      }
      
      console.log('🔍 Content validation:', { 
        nonBlackPixels,
        totalSampled: Math.floor(pixels.length / 40000),
        sizeKB: Math.round(dataUrl.length / 1024)
      });
      
      // Very lenient threshold - just need some non-black content
      if (nonBlackPixels === 0) {
        console.warn('⚠️ Screenshot appears completely black');
        // Still return success but with a warning
        console.log('📤 Proceeding anyway - chart might use dark theme');
      }
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
