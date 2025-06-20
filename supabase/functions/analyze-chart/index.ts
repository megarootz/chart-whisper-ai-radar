
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    const { base64Image, pairName, timeframe } = await req.json();
    
    // Enhanced image validation with detailed logging
    console.log("🔍 Received analysis request:", { 
      pairName, 
      timeframe, 
      hasImage: !!base64Image,
      imageLength: base64Image?.length || 0
    });
    
    if (!base64Image || !base64Image.startsWith('data:image/')) {
      console.error("❌ Invalid image format:", { 
        hasImage: !!base64Image, 
        hasHeader: base64Image?.startsWith('data:image/'),
        imageStart: base64Image?.substring(0, 50) 
      });
      throw new Error("Invalid image format. Expected base64 encoded image with proper data URI header.");
    }
    
    const imageSize = base64Image?.length || 0;
    if (imageSize < 20000) {
      console.error("❌ Image too small, likely invalid:", { imageSize });
      throw new Error("Image appears to be too small or invalid. Please ensure the chart is fully loaded and try again.");
    }
    
    console.log("✅ Image validation passed:", { 
      imageSizeKB: Math.round(imageSize / 1024),
      imageType: base64Image.split(';')[0]?.split('/')[1] || 'unknown'
    });
    
    // Get current UTC time for analysis context
    const currentTime = new Date();
    const utcTimeString = currentTime.toISOString();
    
    // Enhanced prompt that forces the AI to actually analyze the image
    const analysisPrompt = `You are a professional Forex analyst. I am sending you a LIVE screenshot of a TradingView chart that was just captured at ${utcTimeString}.

CRITICAL INSTRUCTIONS:
1. You MUST analyze the ACTUAL image I'm sending you
2. Look at the CURRENT prices shown in the chart image
3. Read the price values directly from the chart
4. Describe what you actually SEE in the image

VERIFICATION REQUIREMENT: Start your analysis by stating the EXACT price you can see in the chart image.

Please provide a detailed technical analysis of this ${pairName || '[Currency Pair]'} chart on the ${timeframe || '[Timeframe]'} timeframe.

Focus on:
- The CURRENT price visible in the chart
- Recent price action and candlestick patterns
- Support and resistance levels
- Trend analysis
- Trading opportunities

Format your response as a professional trading analysis report.`;
    
    const requestData = {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    };

    console.log("🚀 Sending request to OpenRouter API:", {
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageDetail: "high",
      imageSizeKB: Math.round(imageSize / 1024)
    });
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'ForexRadar7 Chart Analysis'
    };
    
    // Enhanced retry logic
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📤 API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          console.log("✅ API call successful");
          break;
        } else {
          const errorText = await response.text();
          console.error(`❌ API call failed (attempt ${attempts}):`, response.status, errorText);
          
          if (response.status === 400) {
            throw new Error(`Invalid request: ${errorText}`);
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please check API key.");
          } else if (response.status === 429 && attempts < maxAttempts) {
            console.log("⚠️ Rate limit hit, waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
            continue;
          }
          
          if (attempts === maxAttempts) {
            throw new Error(`API call failed after ${maxAttempts} attempts: ${response.status} - ${errorText}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ API call error (attempt ${attempts}):`, error);
        
        if (attempts === maxAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    console.log("📈 API Response status:", response!.status);
    
    const responseText = await response!.text();
    console.log("📄 Response received, length:", responseText.length);
    
    if (!response!.ok) {
      console.error("❌ API Error Response:", responseText);
      throw new Error(`API request failed: ${response!.status} - ${responseText}`);
    }
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse API response:", parseError);
      console.error("❌ Raw response:", responseText.substring(0, 500));
      throw new Error("Invalid response format from AI API");
    }
    
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
      console.error("❌ Invalid response structure:", parsedResponse);
      throw new Error("No analysis content received from AI");
    }
    
    const analysisContent = parsedResponse.choices[0].message?.content;
    if (!analysisContent || analysisContent.trim().length === 0) {
      console.error("❌ Empty analysis content:", parsedResponse.choices[0]);
      throw new Error("Empty analysis content received from AI");
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
      analysisContent.toLowerCase().includes(pattern)
    );
    
    if (hasVisionFailure) {
      console.error("❌ AI vision failure detected:", analysisContent.substring(0, 300));
      throw new Error("The AI was unable to analyze the chart image. The image may not have been processed correctly.");
    }
    
    // Log successful analysis
    const usage = parsedResponse.usage;
    console.log("✅ Analysis completed successfully:", {
      pairName,
      timeframe,
      analysisLength: analysisContent.length,
      tokensUsed: usage ? {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      } : 'not available',
      model: parsedResponse.model || requestData.model
    });
    
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred during analysis",
        error_type: "analysis_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
