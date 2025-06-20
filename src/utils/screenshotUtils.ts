
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
    console.log('📸 Starting immediate widget screenshot capture...');
    
    // Minimal wait time to ensure widget has rendered
    console.log('⏳ Brief wait for widget rendering...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced from 8s to 2s
    
    // Quick check for iframe presence
    const iframe = widgetContainer.querySelector('iframe');
    if (iframe) {
      console.log('📊 TradingView iframe detected, capturing immediately...');
      // Minimal additional wait for iframe content
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 3s to 1s
    }
    
    console.log('📷 Capturing screenshot immediately for analysis...');
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
    
    console.log('✅ Screenshot captured immediately, sending for analysis, size:', dataUrl.length);
    
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
