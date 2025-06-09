
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
    
    // Enhanced image validation
    if (!base64Image || !base64Image.startsWith('data:image/')) {
      console.error("❌ Invalid image format:", { 
        hasImage: !!base64Image, 
        hasHeader: base64Image?.startsWith('data:image/'),
        imageStart: base64Image?.substring(0, 50) 
      });
      throw new Error("Invalid image format. Expected base64 encoded image with proper data URI header.");
    }
    
    const imageSize = base64Image?.length || 0;
    if (imageSize < 1000) {
      console.error("❌ Image too small, likely invalid:", { imageSize });
      throw new Error("Image appears to be too small or invalid. Please ensure the chart is fully loaded.");
    }
    
    console.log("📊 GPT-4.1-mini Vision analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      base64Length: imageSize,
      hasValidHeader: base64Image.startsWith('data:image/'),
      imageType: base64Image.split(';')[0]?.split('/')[1] || 'unknown'
    });
    
    // Enhanced prompt specifically designed for GPT-4.1-mini vision analysis
    const analysisPrompt = `You are a professional Forex technical analyst with advanced vision capabilities using GPT-4.1-mini. I am providing you with a REAL trading chart screenshot for ${pairName} on the ${timeframe} timeframe.

CRITICAL INSTRUCTIONS:
- You have GPT-4.1-mini vision capabilities and MUST analyze the actual chart image I'm providing
- This is a real screenshot from TradingView with actual price data, candlesticks, and patterns
- DO NOT say you cannot analyze images - you have vision capabilities
- Provide specific analysis based on what you actually see in the chart image
- Reference actual price levels, patterns, and formations visible in the image

Please analyze the chart image and provide detailed technical analysis including:

1. **Current Price Analysis**:
   - What is the current/latest price level visible on the chart?
   - Recent price movement direction and momentum
   - Visible support and resistance levels with specific price values

2. **Candlestick Pattern Analysis**:
   - Describe actual candlestick patterns you can see in the image
   - Recent candle formations and their implications
   - Any reversal or continuation patterns visible

3. **Trend Analysis**:
   - Overall trend direction observed in the chart
   - Trend strength and any visible trend lines
   - Key price levels to watch

4. **Technical Indicators** (if visible):
   - Any indicators shown on the chart and their readings
   - Signal interpretations from visible indicators

5. **Trading Opportunities**:
   - Potential entry points based on chart analysis
   - Suggested stop loss and take profit levels
   - Risk/reward assessment

IMPORTANT: You MUST reference actual price levels, patterns, and formations visible in the image. This is a real chart analysis using your vision capabilities, not a template response.`;
    
    const requestData = {
      model: "gpt-4.1-mini-2025-04-14",
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

    console.log("🚀 Sending request to OpenRouter GPT-4.1-mini Vision API:", {
      pair: pairName,
      timeframe,
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageDetail: "high",
      imageSize: Math.round(imageSize / 1024) + "KB"
    });
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Forex Chart Analyzer - GPT-4.1-mini Vision Analysis'
    };
    
    // Enhanced retry logic with better error handling
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📤 API call attempt ${attempts}/${maxAttempts} to GPT-4.1-mini Vision`);
      
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          console.log("✅ GPT-4.1-mini Vision API call successful");
          break;
        } else {
          const errorText = await response.text();
          console.error(`❌ API call failed (attempt ${attempts}):`, response.status, errorText);
          
          if (response.status === 400) {
            throw new Error(`Invalid request to GPT-4.1-mini Vision: ${errorText}. Please check the chart image quality.`);
          } else if (response.status === 401) {
            throw new Error("Authentication failed with GPT-4.1-mini Vision API. Please check API key configuration.");
          } else if (response.status === 429) {
            console.log("⚠️ Rate limit hit, waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
          }
          
          if (attempts === maxAttempts) {
            throw new Error(`GPT-4.1-mini Vision API call failed after ${maxAttempts} attempts: ${response.status} - ${errorText}`);
          }
        }
        
        if (!response.ok && response.status !== 429) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
        
      } catch (error) {
        console.error(`❌ API call error (attempt ${attempts}):`, error);
        
        if (attempts === maxAttempts) {
          throw error;
        }
        console.log(`⚠️ Attempt ${attempts} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    console.log("📈 GPT-4.1-mini Vision API Response status:", response!.status);
    
    const responseText = await response!.text();
    
    if (!response!.ok) {
      console.error("❌ GPT-4.1-mini Vision API Error Response:", responseText);
      throw new Error(`Failed to analyze chart with GPT-4.1-mini Vision: ${response!.status} - ${responseText}`);
    }
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse GPT-4.1-mini Vision API response:", parseError);
      console.error("❌ Raw response:", responseText);
      throw new Error("Invalid response format from GPT-4.1-mini Vision API");
    }
    
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
      console.error("❌ Invalid response structure from GPT-4.1-mini Vision:", parsedResponse);
      throw new Error("No analysis content received from GPT-4.1-mini Vision API");
    }
    
    const analysisContent = parsedResponse.choices[0].message?.content;
    if (!analysisContent || analysisContent.trim().length === 0) {
      console.error("❌ Empty analysis content from GPT-4.1-mini Vision:", parsedResponse.choices[0]);
      throw new Error("Empty analysis content received from GPT-4.1-mini Vision API");
    }
    
    // Enhanced detection of vision failure responses
    const isVisionFailure = 
      analysisContent.toLowerCase().includes("i can't analyze the chart directly") ||
      analysisContent.toLowerCase().includes("i'm unable to analyze the chart image") ||
      analysisContent.toLowerCase().includes("i cannot analyze images directly") ||
      analysisContent.toLowerCase().includes("i'm unable to analyze images directly") ||
      analysisContent.toLowerCase().includes("i cannot see the specific chart") ||
      analysisContent.toLowerCase().includes("i'm not able to see the actual chart") ||
      analysisContent.toLowerCase().includes("i don't have the ability to analyze images") ||
      analysisContent.toLowerCase().includes("i cannot process images") ||
      analysisContent.toLowerCase().includes("however, i can help you understand how to analyze");
    
    if (isVisionFailure) {
      console.error("❌ GPT-4.1-mini Vision failed to analyze the chart image");
      console.error("❌ Response content:", analysisContent.substring(0, 500));
      throw new Error("GPT-4.1-mini Vision failed to analyze the chart image. The AI reported it cannot see the image. Please ensure the chart is fully loaded and try again.");
    }
    
    // Check for specific chart analysis indicators
    const hasSpecificAnalysis = 
      analysisContent.toLowerCase().includes("price") ||
      analysisContent.toLowerCase().includes("level") ||
      analysisContent.toLowerCase().includes("support") ||
      analysisContent.toLowerCase().includes("resistance") ||
      analysisContent.toLowerCase().includes("candlestick") ||
      analysisContent.toLowerCase().includes("trend") ||
      analysisContent.toLowerCase().includes("chart");
    
    if (!hasSpecificAnalysis) {
      console.warn("⚠️ GPT-4.1-mini Vision response lacks specific chart analysis terms");
      console.warn("⚠️ Response preview:", analysisContent.substring(0, 200));
    }
    
    const usage = parsedResponse.usage;
    console.log("✅ GPT-4.1-mini Vision chart analysis completed successfully:", {
      pairName,
      timeframe,
      responseLength: responseText.length,
      analysisLength: analysisContent.length,
      tokensUsed: usage ? {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      } : 'not available',
      model: parsedResponse.model || 'gpt-4.1-mini-2025-04-14',
      containsSpecificAnalysis: hasSpecificAnalysis
    });
    
    const enhancedResponse = {
      ...parsedResponse,
      metadata: {
        analysis_type: "real_chart_analysis_gpt41mini",
        image_validated: true,
        tokens_used: usage?.total_tokens || 0,
        pair: pairName,
        timeframe: timeframe,
        has_specific_analysis: hasSpecificAnalysis,
        model_used: "gpt-4.1-mini-2025-04-14",
        image_size_kb: Math.round(imageSize / 1024)
      }
    };
    
    return new Response(JSON.stringify(enhancedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in GPT-4.1-mini Vision analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the chart with GPT-4.1-mini Vision",
        error_type: "analysis_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
