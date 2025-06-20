
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
      foreignObjectRendering: false, // Disable for better iframe compatibility
      logging: true, // Enable logging to see what's happening
      width: widgetContainer.offsetWidth,
      height: widgetContainer.offsetHeight,
      backgroundColor: null, // Let the natural background show
      removeContainer: false,
      imageTimeout: 15000, // 15 second timeout for images
      onclone: (clonedDoc, element) => {
        console.log('🔄 html2canvas cloning document...');
        // Try to preserve iframe content in the clone
        const iframes = element.querySelectorAll('iframe');
        console.log('📊 Found iframes in clone:', iframes.length);
      }
    });
    
    console.log('✅ html2canvas completed');
    console.log('📊 Canvas details:', {
      width: canvas.width,
      height: canvas.height,
      hasContext: !!canvas.getContext('2d')
    });
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png', 0.9);
    
    console.log('✅ Screenshot data URL created:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      dataUrlLength: dataUrl.length,
      sizeKB: Math.round(dataUrl.length / 1024)
    });
    
    // Basic validation - check if we have a meaningful data URL
    if (!dataUrl || dataUrl.length < 500) {
      console.warn('⚠️ Screenshot appears invalid:', dataUrl.length);
      return {
        success: false,
        error: `Screenshot capture failed - invalid result (${dataUrl.length} chars)`
      };
    }
    
    // Check if the canvas has any content
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
    if (imageData) {
      const pixels = imageData.data;
      let hasContent = false;
      
      // Check if canvas has any non-transparent pixels
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 0) { // Alpha channel > 0
          hasContent = true;
          break;
        }
      }
      
      console.log('🔍 Content validation:', { 
        hasContent,
        canvasSize: `${canvas.width}x${canvas.height}`,
        sizeKB: Math.round(dataUrl.length / 1024)
      });
      
      if (!hasContent) {
        console.warn('⚠️ Canvas appears to be empty/transparent');
        return {
          success: false,
          error: 'Screenshot appears to be empty. The chart may not have loaded properly.'
        };
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
