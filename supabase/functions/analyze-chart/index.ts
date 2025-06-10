
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
    if (imageSize < 5000) {
      console.error("❌ Image too small, likely invalid:", { imageSize });
      throw new Error("Image appears to be too small or invalid. Please ensure the chart is fully loaded.");
    }
    
    console.log("📊 GPT-4.1-mini Current Price Analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      base64Length: imageSize,
      hasValidHeader: base64Image.startsWith('data:image/'),
      imageType: base64Image.split(';')[0]?.split('/')[1] || 'unknown'
    });
    
    // Ultra-enhanced prompt specifically for current price analysis
    const analysisPrompt = `You are a world-class professional Forex technical analyst with GPT-4.1-mini vision capabilities. I am providing you with a LIVE, high-resolution trading chart screenshot for ${pairName} on the ${timeframe} timeframe captured at maximum resolution with CURRENT MARKET PRICES.

🎯 CRITICAL: ANALYZE THE ACTUAL CURRENT PRICES VISIBLE IN THIS CHART IMAGE

**MANDATORY INSTRUCTIONS:**
- You MUST read and report the EXACT current price visible in this chart image
- Look at the price scale on the RIGHT SIDE of the chart for current price levels
- Look at the LATEST candlesticks (rightmost) for the most recent price action
- All price levels you mention MUST come from what you can actually SEE in this image
- DO NOT use outdated or historical price data - only analyze what's visible NOW

🔍 DETAILED CURRENT PRICE ANALYSIS REQUIRED:

**1. CURRENT LIVE PRICE (MANDATORY):**
- What is the EXACT current price level you can see on the chart's price scale?
- Read the price from the rightmost part of the chart where the latest candle is
- Look at the price labels on the right side of the chart
- State: "Current visible price: [EXACT PRICE FROM IMAGE]"

**2. RECENT PRICE MOVEMENT (From Current Chart):**
- Describe the LATEST candles you can see (last 5-10 candles)
- What direction is the current price moving?
- Are the recent candles bullish or bearish?
- What is the momentum based on the visible recent candles?

**3. VISIBLE SUPPORT & RESISTANCE LEVELS:**
- Identify price levels where you can SEE the price has reacted
- Look for horizontal lines or areas where price bounced
- Only mention levels that are VISIBLE in this chart image
- Provide EXACT price numbers from the chart's price scale

**4. CANDLESTICK PATTERNS (Currently Visible):**
- Describe the actual candlestick patterns you can see
- Focus on the most recent formations
- Are there any reversal or continuation patterns visible?

**5. TREND ANALYSIS (From This Chart):**
- What trend direction do you see in the current chart?
- Is price making higher highs/lows or lower highs/lows?
- Describe the trend based on what's visible in this timeframe

**6. TRADING RECOMMENDATIONS (Based on Current Visible Prices):**
- Suggest entry levels based on current visible price action
- Provide stop loss levels based on visible support/resistance
- Suggest take profit targets based on chart levels you can see
- All recommendations must use CURRENT prices from the image

🚨 ABSOLUTELY CRITICAL: 
- You MUST analyze the ACTUAL chart image I'm showing you
- All prices mentioned must be CURRENTLY VISIBLE in this chart
- If you mention a price level, it must be because you can SEE it in the image
- This is a LIVE chart analysis of CURRENT market conditions
- Do NOT provide generic or template responses

Start your analysis with: "Based on the current ${pairName} ${timeframe} chart image provided, I can see the following live market conditions:"

Provide a comprehensive analysis of the CURRENT market situation based on what you can actually see in this live chart image.`;
    
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

    console.log("🚀 Sending current price analysis request to GPT-4.1-mini:", {
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
      'X-Title': 'Current Price Forex Chart Analyzer - GPT-4.1-mini Vision Analysis'
    };
    
    // Enhanced retry logic with better error handling
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📤 Current price API call attempt ${attempts}/${maxAttempts} to GPT-4.1-mini`);
      
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          console.log("✅ GPT-4.1-mini Current Price API call successful");
          break;
        } else {
          const errorText = await response.text();
          console.error(`❌ API call failed (attempt ${attempts}):`, response.status, errorText);
          
          if (response.status === 400) {
            throw new Error(`Invalid request for current price analysis: ${errorText}. Please check the chart image.`);
          } else if (response.status === 401) {
            throw new Error("Authentication failed with GPT-4.1-mini API. Please check API key configuration.");
          } else if (response.status === 429) {
            console.log("⚠️ Rate limit hit, waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
          }
          
          if (attempts === maxAttempts) {
            throw new Error(`Current price analysis failed after ${maxAttempts} attempts: ${response.status} - ${errorText}`);
          }
        }
        
        if (!response.ok && response.status !== 429) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
        
      } catch (error) {
        console.error(`❌ Current price API call error (attempt ${attempts}):`, error);
        
        if (attempts === maxAttempts) {
          throw error;
        }
        console.log(`⚠️ Attempt ${attempts} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    console.log("📈 GPT-4.1-mini Current Price API Response status:", response!.status);
    
    const responseText = await response!.text();
    
    if (!response!.ok) {
      console.error("❌ GPT-4.1-mini Current Price API Error Response:", responseText);
      throw new Error(`Failed to analyze current prices: ${response!.status} - ${responseText}`);
    }
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse current price API response:", parseError);
      console.error("❌ Raw response:", responseText);
      throw new Error("Invalid response format from GPT-4.1-mini current price analysis");
    }
    
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
      console.error("❌ Invalid response structure:", parsedResponse);
      throw new Error("No current price analysis content received");
    }
    
    const analysisContent = parsedResponse.choices[0].message?.content;
    if (!analysisContent || analysisContent.trim().length === 0) {
      console.error("❌ Empty current price analysis content:", parsedResponse.choices[0]);
      throw new Error("Empty current price analysis received");
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
      analysisContent.toLowerCase().includes("i cannot view");
    
    if (isVisionFailure) {
      console.error("❌ GPT-4.1-mini failed to analyze current price chart");
      console.error("❌ Response content:", analysisContent.substring(0, 500));
      throw new Error("GPT-4.1-mini failed to analyze the current price chart. Please ensure the chart is fully loaded with current prices and try again.");
    }
    
    // Enhanced validation for current price analysis
    const hasCurrentPriceAnalysis = 
      analysisContent.toLowerCase().includes("current") ||
      analysisContent.toLowerCase().includes("price") ||
      analysisContent.toLowerCase().includes("visible") ||
      analysisContent.toLowerCase().includes("level") ||
      analysisContent.toLowerCase().includes("support") ||
      analysisContent.toLowerCase().includes("resistance") ||
      analysisContent.toLowerCase().includes("candlestick") ||
      analysisContent.toLowerCase().includes("trend") ||
      /\d{3,5}\.\d{1,2}/.test(analysisContent); // Check for price numbers like 1969.85
    
    if (!hasCurrentPriceAnalysis) {
      console.warn("⚠️ Response may lack specific current price analysis");
      console.warn("⚠️ Response preview:", analysisContent.substring(0, 200));
    }
    
    const usage = parsedResponse.usage;
    console.log("✅ GPT-4.1-mini Current Price Analysis completed:", {
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
      containsPriceNumbers: /\d{3,5}\.\d{1,2}/.test(analysisContent)
    });
    
    const enhancedResponse = {
      ...parsedResponse,
      metadata: {
        analysis_type: "current_price_chart_analysis_gpt41mini",
        image_validated: true,
        tokens_used: usage?.total_tokens || 0,
        pair: pairName,
        timeframe: timeframe,
        has_current_price_analysis: hasCurrentPriceAnalysis,
        model_used: "gpt-4.1-mini-2025-04-14",
        image_size_kb: Math.round(imageSize / 1024),
        contains_current_prices: /\d{3,5}\.\d{1,2}/.test(analysisContent),
        quality_level: "current_price_maximum"
      }
    };
    
    return new Response(JSON.stringify(enhancedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in current price chart analysis:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred during current price analysis",
        error_type: "current_price_analysis_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
