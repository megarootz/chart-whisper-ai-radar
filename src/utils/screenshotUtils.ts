
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
    
    // Wait for widget to render completely
    console.log('⏳ Waiting for widget to fully render...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for iframe and validate it's loaded
    const iframe = widgetContainer.querySelector('iframe');
    if (iframe) {
      console.log('📊 TradingView iframe found, validating chart data...');
      console.log('🔍 Iframe details:', {
        src: iframe.src,
        width: iframe.offsetWidth,
        height: iframe.offsetHeight,
        style: iframe.style.cssText
      });
      
      // Additional wait to ensure chart data is loaded
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.error('❌ No TradingView iframe found in widget container!');
      return {
        success: false,
        error: 'TradingView chart iframe not found. Chart may not be loaded properly.'
      };
    }
    
    console.log('📷 Capturing screenshot with enhanced settings...');
    const canvas = await html2canvas(widgetContainer, {
      scale: options?.scale || 2,
      useCORS: options?.useCORS || true,
      allowTaint: true,
      foreignObjectRendering: true,
      logging: false, // Disable to reduce console noise
      width: widgetContainer.offsetWidth,
      height: widgetContainer.offsetHeight,
      backgroundColor: '#131722',
      // Enhanced settings for better chart capture
      ignoreElements: (element) => {
        // Ignore elements that might interfere with capture
        return element.tagName === 'SCRIPT' || 
               element.classList.contains('tv-dialog') ||
               element.classList.contains('tv-toast');
      },
      onclone: (clonedDoc) => {
        // Ensure iframe content is visible in clone
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
      dataUrlLength: dataUrl.length,
      dataUrlStart: dataUrl.substring(0, 100)
    });
    
    // Enhanced validation for screenshot quality
    if (dataUrl.length < 100000) {
      console.warn('⚠️ Screenshot appears too small, likely missing chart data');
      return {
        success: false,
        error: 'Screenshot appears incomplete. Chart may not contain live data yet.'
      };
    }
    
    // Check if the image is mostly empty (background color)
    const canvas2d = document.createElement('canvas');
    const ctx = canvas2d.getContext('2d');
    if (ctx) {
      canvas2d.width = canvas.width;
      canvas2d.height = canvas.height;
      ctx.drawImage(canvas, 0, 0);
      
      // Sample pixels to check for content variety
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let uniqueColors = new Set();
      
      // Sample every 100th pixel to check color variety
      for (let i = 0; i < pixels.length; i += 400) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        uniqueColors.add(`${r},${g},${b}`);
        
        // If we have enough color variety, the chart likely has content
        if (uniqueColors.size > 10) break;
      }
      
      console.log('🎨 Color analysis:', {
        uniqueColors: uniqueColors.size,
        sampleColors: Array.from(uniqueColors).slice(0, 5)
      });
      
      if (uniqueColors.size < 5) {
        console.warn('⚠️ Screenshot appears to have limited color variety');
        return {
          success: false,
          error: 'Screenshot may not contain chart data. Try waiting longer for the chart to load.'
        };
      }
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
