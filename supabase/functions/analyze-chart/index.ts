
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
    
    // Ultra-enhanced image validation
    if (!base64Image || !base64Image.startsWith('data:image/')) {
      console.error("❌ Invalid image format:", { 
        hasImage: !!base64Image, 
        hasHeader: base64Image?.startsWith('data:image/'),
        imageStart: base64Image?.substring(0, 50) 
      });
      throw new Error("Invalid image format. Expected base64 encoded image with proper data URI header.");
    }
    
    const imageSize = base64Image?.length || 0;
    if (imageSize < 10000) {
      console.error("❌ Image too small, likely invalid:", { imageSize });
      throw new Error("Image appears to be too small or invalid. Please ensure the chart is fully loaded with current prices.");
    }
    
    console.log("📊 GPT-4.1-mini REAL Chart Analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      base64Length: imageSize,
      hasValidHeader: base64Image.startsWith('data:image/'),
      imageType: base64Image.split(';')[0]?.split('/')[1] || 'unknown'
    });
    
    // CRITICAL: Enhanced prompt for REAL current price analysis
    const analysisPrompt = `You are a world-class professional Forex technical analyst with GPT-4.1-mini vision capabilities. I am providing you with a LIVE, high-resolution trading chart screenshot for ${pairName} on the ${timeframe} timeframe captured in REAL-TIME with CURRENT MARKET PRICES.

🚨 CRITICAL INSTRUCTION: YOU MUST ANALYZE THE ACTUAL CHART IMAGE I AM SHOWING YOU RIGHT NOW

**MANDATORY REQUIREMENTS:**
1. READ THE EXACT CURRENT PRICE from the chart image - look at the rightmost price labels
2. The price you mention MUST be what you can SEE in this specific image
3. DO NOT use any historical or cached price data
4. ALL analysis must be based on what's VISIBLE in this image only

🔍 REQUIRED ANALYSIS STEPS:

**1. CURRENT VISIBLE PRICE (MANDATORY FIRST):**
Look at the right side of the chart where the current price is displayed.
State: "Based on the chart image, I can see the current price is: [EXACT PRICE FROM IMAGE]"

**2. RECENT PRICE ACTION (From This Chart Image):**
- Describe the latest 5-10 candlesticks you can see on the right side
- What direction is the most recent price movement?
- Are the latest candles bullish or bearish?

**3. VISIBLE SUPPORT & RESISTANCE (From This Image):**
- Identify price levels where you can SEE price reactions in this chart
- Provide EXACT price numbers visible on the price scale
- Only mention levels that are clearly VISIBLE in this image

**4. TREND ANALYSIS (Based on This Chart):**
- What trend do you see in this specific chart image?
- Describe the pattern from what's visible here

**5. TRADING RECOMMENDATIONS (Using Current Visible Prices):**
- Entry levels based on the current prices you can see
- Stop loss based on visible support/resistance  
- Take profit targets using the price scale you can see

🚨 VERIFICATION CHECKLIST:
- ✅ I mentioned the exact current price visible in the image
- ✅ All price levels come from what I can see in this chart
- ✅ I analyzed the actual candlesticks visible in the image
- ✅ I did not use any external or historical price data

Start your response with: "Based on the current ${pairName} ${timeframe} chart image you've provided, I can see the following REAL market conditions:"

CRITICAL: If you cannot clearly see price information in the image, state that explicitly. Do not guess or use external data.`;
    
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
      temperature: 0.05, // Very low for factual accuracy
      max_tokens: 4000
    };

    console.log("🚀 Sending REAL chart analysis request to GPT-4.1-mini:", {
      pair: pairName,
      timeframe,
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageDetail: "high",
      imageSize: Math.round(imageSize / 1024) + "KB",
      temperature: requestData.temperature
    });
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'REAL Current Price Forex Chart Analyzer - GPT-4.1-mini Vision Analysis'
    };
    
    // Enhanced retry logic
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📤 REAL chart API call attempt ${attempts}/${maxAttempts} to GPT-4.1-mini`);
      
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          console.log("✅ GPT-4.1-mini REAL Chart API call successful");
          break;
        } else {
          const errorText = await response.text();
          console.error(`❌ API call failed (attempt ${attempts}):`, response.status, errorText);
          
          if (response.status === 400) {
            throw new Error(`Invalid request for REAL chart analysis: ${errorText}. Please check the chart image.`);
          } else if (response.status === 401) {
            throw new Error("Authentication failed with GPT-4.1-mini API. Please check API key configuration.");
          } else if (response.status === 429) {
            console.log("⚠️ Rate limit hit, waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 3000 * attempts));
          }
          
          if (attempts === maxAttempts) {
            throw new Error(`REAL chart analysis failed after ${maxAttempts} attempts: ${response.status} - ${errorText}`);
          }
        }
        
        if (!response.ok && response.status !== 429) {
          await new Promise(resolve => setTimeout(resolve, 1500 * attempts));
        }
        
      } catch (error) {
        console.error(`❌ REAL chart API call error (attempt ${attempts}):`, error);
        
        if (attempts === maxAttempts) {
          throw error;
        }
        console.log(`⚠️ Attempt ${attempts} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1500 * attempts));
      }
    }

    console.log("📈 GPT-4.1-mini REAL Chart API Response status:", response!.status);
    
    const responseText = await response!.text();
    
    if (!response!.ok) {
      console.error("❌ GPT-4.1-mini REAL Chart API Error Response:", responseText);
      throw new Error(`Failed to analyze REAL chart: ${response!.status} - ${responseText}`);
    }
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse REAL chart API response:", parseError);
      console.error("❌ Raw response:", responseText);
      throw new Error("Invalid response format from GPT-4.1-mini REAL chart analysis");
    }
    
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
      console.error("❌ Invalid response structure:", parsedResponse);
      throw new Error("No REAL chart analysis content received");
    }
    
    const analysisContent = parsedResponse.choices[0].message?.content;
    if (!analysisContent || analysisContent.trim().length === 0) {
      console.error("❌ Empty REAL chart analysis content:", parsedResponse.choices[0]);
      throw new Error("Empty REAL chart analysis received");
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
      analysisContent.toLowerCase().includes("i'm unable to process") ||
      analysisContent.toLowerCase().includes("i can't see the image") ||
      analysisContent.toLowerCase().includes("i cannot view") ||
      analysisContent.toLowerCase().includes("cannot clearly see") ||
      analysisContent.toLowerCase().includes("unable to see specific") ||
      analysisContent.toLowerCase().includes("cannot read the exact");
    
    if (isVisionFailure) {
      console.error("❌ GPT-4.1-mini failed to analyze REAL chart");
      console.error("❌ Response content:", analysisContent.substring(0, 500));
      throw new Error("GPT-4.1-mini failed to analyze the REAL chart image. The image may not contain visible price data or chart content.");
    }
    
    // Enhanced validation for REAL price analysis
    const hasCurrentPriceAnalysis = 
      /current price.{0,50}(\d{1,5}[.,]\d{1,4})/i.test(analysisContent) ||
      /visible.{0,30}price.{0,30}(\d{1,5}[.,]\d{1,4})/i.test(analysisContent) ||
      analysisContent.toLowerCase().includes("based on the chart image") ||
      /(\d{3,5}[.,]\d{1,4})/.test(analysisContent);
    
    if (!hasCurrentPriceAnalysis) {
      console.warn("⚠️ Response may lack specific current price analysis from image");
      console.warn("⚠️ Response preview:", analysisContent.substring(0, 300));
    }
    
    const usage = parsedResponse.usage;
    console.log("✅ GPT-4.1-mini REAL Chart Analysis completed:", {
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
      hasCurrentPriceAnalysis,
      containsRealPrices: /(\d{3,5}[.,]\d{1,4})/.test(analysisContent)
    });
    
    const enhancedResponse = {
      ...parsedResponse,
      metadata: {
        analysis_type: "real_chart_analysis_gpt41mini",
        image_validated: true,
        tokens_used: usage?.total_tokens || 0,
        pair: pairName,
        timeframe: timeframe,
        has_current_price_analysis: hasCurrentPriceAnalysis,
        model_used: "gpt-4.1-mini-2025-04-14",
        image_size_kb: Math.round(imageSize / 1024),
        contains_real_prices: /(\d{3,5}[.,]\d{1,4})/.test(analysisContent),
        quality_level: "real_chart_maximum_precision",
        temperature_used: requestData.temperature
      }
    };
    
    return new Response(JSON.stringify(enhancedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in REAL chart analysis:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred during REAL chart analysis",
        error_type: "real_chart_analysis_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
