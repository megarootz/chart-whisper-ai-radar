
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
    
    // Extended wait for chart data to load completely
    console.log('📈 Waiting for live chart data to load...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Additional wait to ensure all chart elements are rendered
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📷 Capturing screenshot with enhanced settings...');
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
               element.classList.contains('tv-toast') ||
               element.classList.contains('tv-popup');
      },
      onclone: (clonedDoc) => {
        const clonedIframes = clonedDoc.querySelectorAll('iframe');
        clonedIframes.forEach(clonedIframe => {
          clonedIframe.style.visibility = 'visible';
          clonedIframe.style.display = 'block';
          clonedIframe.style.opacity = '1';
        });
      }
    });
    
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    console.log('✅ Screenshot captured successfully:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      dataUrlLength: dataUrl.length
    });
    
    // Basic validation for screenshot quality - less strict
    if (dataUrl.length < 50000) {
      console.warn('⚠️ Screenshot appears very small, may not contain chart data');
      return {
        success: false,
        error: 'Screenshot appears to be too small or empty. Chart may not have loaded properly.'
      };
    }
    
    // Simplified color variety check - more lenient
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
    if (imageData) {
      const pixels = imageData.data;
      const colorSet = new Set();
      
      // Sample fewer pixels and be more lenient
      for (let i = 0; i < pixels.length; i += 8000) { // Sample every 2000th pixel
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        colorSet.add(`${r},${g},${b}`);
        
        if (colorSet.size > 3) break; // Lower threshold for color variety
      }
      
      if (colorSet.size < 2) {
        console.warn('⚠️ Screenshot lacks color variety, may be blank');
        return {
          success: false,
          error: 'Screenshot appears to be blank. Please ensure the chart has loaded completely.'
        };
      }
      
      console.log('✅ Screenshot quality validated:', { 
        colorVariety: colorSet.size,
        sizeKB: Math.round(dataUrl.length / 1024)
      });
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
