
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
    
    // Quick wait for widget to render (reduced from 2 seconds)
    console.log('⏳ Brief wait for widget stability...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    
    // Additional short wait for chart data (reduced from 3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('📷 Capturing screenshot...');
    const canvas = await html2canvas(widgetContainer, {
      scale: options?.scale || 2,
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
               element.classList.contains('tv-toast');
      },
      onclone: (clonedDoc) => {
        const clonedIframes = clonedDoc.querySelectorAll('iframe');
        clonedIframes.forEach(clonedIframe => {
          clonedIframe.style.visibility = 'visible';
          clonedIframe.style.display = 'block';
        });
      }
    });
    
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    console.log('✅ Screenshot captured successfully:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      dataUrlLength: dataUrl.length
    });
    
    // Basic validation (reduced threshold)
    if (dataUrl.length < 50000) {
      console.warn('⚠️ Screenshot appears small, but proceeding with analysis');
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
