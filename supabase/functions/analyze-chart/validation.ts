
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  imageSize?: number;
  imageType?: string;
}

export const validateImageData = (base64Image: string): ValidationResult => {
  console.log("🔍 Starting image validation...");
  
  if (!base64Image || !base64Image.startsWith('data:image/')) {
    console.error("❌ Invalid image format:", { 
      hasImage: !!base64Image, 
      hasHeader: base64Image?.startsWith('data:image/'),
      imageStart: base64Image?.substring(0, 50) 
    });
    return {
      isValid: false,
      error: "Invalid image format. Expected base64 encoded image with proper data URI header."
    };
  }
  
  const imageSize = base64Image?.length || 0;
  if (imageSize < 20000) {
    console.error("❌ Image too small, likely invalid:", { imageSize });
    return {
      isValid: false,
      error: "Image appears to be too small or invalid. Please ensure the chart is fully loaded and try again."
    };
  }
  
  const imageType = base64Image.split(';')[0]?.split('/')[1] || 'unknown';
  
  console.log("✅ Image validation passed:", { 
    imageSizeKB: Math.round(imageSize / 1024),
    imageType
  });
  
  return {
    isValid: true,
    imageSize,
    imageType
  };
};

export const validateAnalysisContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: "Empty analysis content received from AI"
    };
  }
  
  // Check if the AI actually analyzed the image
  const visionFailurePatterns = [
    "i can't analyze the chart directly",
    "i'm unable to analyze the chart image", 
    "i cannot analyze images",
    "i don't have the ability to analyze images",
    "i cannot see the image",
    "i'm not able to see the actual chart",
    "however, i can help you understand how to analyze"
  ];
  
  const hasVisionFailure = visionFailurePatterns.some(pattern => 
    content.toLowerCase().includes(pattern)
  );
  
  if (hasVisionFailure) {
    console.error("❌ AI vision failure detected:", content.substring(0, 300));
    return {
      isValid: false,
      error: "The AI was unable to analyze the chart image. The image may not have been processed correctly."
    };
  }
  
  return { isValid: true };
};
