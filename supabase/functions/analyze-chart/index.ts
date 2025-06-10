
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
    
    console.log("📊 GPT-4.1-mini Ultra-High Quality Vision analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      base64Length: imageSize,
      hasValidHeader: base64Image.startsWith('data:image/'),
      imageType: base64Image.split(';')[0]?.split('/')[1] || 'unknown'
    });
    
    // Enhanced prompt for complete analysis in the exact format requested
    const analysisPrompt = `I want you to act as a professional Forex (Foreign Exchange) analyst. Analyze the following currency pair chart image with your GPT-4.1-mini vision capabilities. 

CRITICAL INSTRUCTIONS: You MUST provide a COMPLETE analysis by filling in ALL sections below with REAL data from the chart image. Replace ALL [bracketed placeholders] with actual values, prices, dates, and observations from the chart.

REQUIRED OUTPUT FORMAT - Fill in every section with real analysis:

📊 Technical Chart Analysis Report (${pairName || '[Detected Pair]'} – ${timeframe || '[Detected Timeframe]'})

1. Market Snapshot
• Current Price: [Provide the actual current/latest price visible on the chart]
• Date Range Analyzed: [Provide the actual date range visible on the chart]
• General Market Context: [Specify: Ranging, Uptrend, Downtrend, Correction, or High Volatility based on what you see]

2. Recent Price Action & Trend
• Recent Movement:
  - [Describe the actual major price swings you can see in the chart over recent periods]
  - [Note any actual sharp rises/drops, consolidations, or trend reversals visible]
• Market Structure:
  - [Describe the actual pattern: Higher highs/lows, lower highs/lows, sideways movement, or specific patterns you can identify]

3. Key Support & Resistance Areas
• Support Levels:
  - [Identify actual primary support level with specific price] – Main bounce area
  - [Identify actual secondary support level with specific price] – Next lower level
• Resistance Levels:
  - [Identify actual primary resistance level with specific price] – Main reversal area
  - [Identify actual secondary resistance level with specific price] – Next higher level

4. Candlestick & Pattern Analysis
• [Describe the actual latest candlestick behaviors you can see: indecision, strong engulfing patterns, pin bars, dojis, hammers, etc.]
• [Identify any actual chart patterns visible: double top/bottom, triangles, channels, flags, head and shoulders, etc.]

5. Momentum & Trend Indicators
• [Comment on actual momentum visible in the chart: slowing, picking up, diverging, accelerating]
• [Note actual visible signs of trend change: higher/lower highs/lows, compression, breakouts]
• [If no indicators (RSI, MACD, MA) are visible, mention analysis is based purely on price action]

6. Trade Setups & Risk Management

Trade Type | Entry Area | Stop Loss (SL) | Take Profit (TP1) | Take Profit (TP2)
Buy | [Actual support area/specific price] | [Specific price few pips below support] | [Actual first resistance level] | [Actual next resistance level]
Sell | [Actual resistance area/specific price] | [Specific price few pips above resistance] | [Actual first support level] | [Actual next support level]

Entry Notes:
• Buy only if price confirms reversal at support (bullish candle, bounce pattern)
• Sell only on strong rejection/reversal at resistance

Caution:
• Avoid trading in the middle of the range, as risk of false signals is higher
• Always set a stop loss. Adjust position size so risk is under 2-3% per trade

7. Breakout/Breakdown Scenarios
• If price breaks below [specific support level]: → Expect decline towards [specific lower target level]
• If price breaks above [specific resistance level]: → Expect rally towards [specific upper target level]

8. Summary & Trade Signal Recommendation
• Market summary: [Provide actual short summary: ranging, trending, bias, recent key price action based on the chart]
• Best current signal:
  - [Specify actual price level to watch and react at]
  - [Give specific Buy/Sell recommendation ONLY IF confirmation at major levels]
  - [Provide specific price level to watch for entry]

9. Trade Plan Table Example

Trade Plan | Entry | Stop Loss | Take Profit 1 | Take Profit 2 | R/R
Buy Bounce | [Actual support level] | [Actual SL level] | [Actual TP1 level] | [Actual TP2 level] | [Calculate actual R/R ratio]
Sell Reject | [Actual resistance level] | [Actual SL level] | [Actual TP1 level] | [Actual TP2 level] | [Calculate actual R/R ratio]

⚠️ Disclaimer
This analysis is for educational and idea-generation purposes only. Always do your own research and use proper risk management on every trade.

CRITICAL: You MUST analyze the actual chart image provided and fill in ALL bracketed sections with real data, prices, and observations. Do not leave any placeholders unfilled. Provide specific price levels, actual dates, real candlestick patterns, and genuine technical analysis based on what you can see in the chart image.`;
    
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

    console.log("🚀 Sending ultra-high-quality request to OpenRouter GPT-4.1-mini Vision API:", {
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
      'X-Title': 'Ultra-High Quality Forex Chart Analyzer - GPT-4.1-mini Vision Analysis'
    };
    
    // Enhanced retry logic with better error handling
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📤 Ultra-high-quality API call attempt ${attempts}/${maxAttempts} to GPT-4.1-mini Vision`);
      
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
            throw new Error(`Invalid request to GPT-4.1-mini Vision: ${errorText}. Please check the ultra-high-quality chart image.`);
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
      throw new Error(`Failed to analyze ultra-high-quality chart with GPT-4.1-mini Vision: ${response!.status} - ${responseText}`);
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
    
    // Ultra-enhanced detection of vision failure responses
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
      analysisContent.toLowerCase().includes("however, i can help you understand how to analyze");
    
    if (isVisionFailure) {
      console.error("❌ GPT-4.1-mini Vision failed to analyze the ultra-high-quality chart image");
      console.error("❌ Response content:", analysisContent.substring(0, 500));
      throw new Error("GPT-4.1-mini Vision failed to analyze the ultra-high-quality chart image. The AI reported it cannot see the image. Please ensure the chart is fully loaded and try again.");
    }
    
    // Check for specific chart analysis indicators
    const hasSpecificAnalysis = 
      analysisContent.toLowerCase().includes("price") ||
      analysisContent.toLowerCase().includes("level") ||
      analysisContent.toLowerCase().includes("support") ||
      analysisContent.toLowerCase().includes("resistance") ||
      analysisContent.toLowerCase().includes("candlestick") ||
      analysisContent.toLowerCase().includes("trend") ||
      analysisContent.toLowerCase().includes("chart") ||
      analysisContent.toLowerCase().includes("candle") ||
      analysisContent.toLowerCase().includes("pattern") ||
      /\d+\.\d+/.test(analysisContent); // Check for price numbers like 1961.40
    
    if (!hasSpecificAnalysis) {
      console.warn("⚠️ GPT-4.1-mini Vision response lacks specific chart analysis terms");
      console.warn("⚠️ Response preview:", analysisContent.substring(0, 200));
    }
    
    const usage = parsedResponse.usage;
    console.log("✅ GPT-4.1-mini Vision ultra-high-quality chart analysis completed successfully:", {
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
      containsSpecificAnalysis: hasSpecificAnalysis,
      hasPriceNumbers: /\d+\.\d+/.test(analysisContent)
    });
    
    const enhancedResponse = {
      ...parsedResponse,
      metadata: {
        analysis_type: "ultra_high_quality_real_chart_analysis_gpt41mini",
        image_validated: true,
        tokens_used: usage?.total_tokens || 0,
        pair: pairName,
        timeframe: timeframe,
        has_specific_analysis: hasSpecificAnalysis,
        model_used: "gpt-4.1-mini-2025-04-14",
        image_size_kb: Math.round(imageSize / 1024),
        contains_price_numbers: /\d+\.\d+/.test(analysisContent),
        quality_level: "ultra_high"
      }
    };
    
    return new Response(JSON.stringify(enhancedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in GPT-4.1-mini Vision ultra-high-quality analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the ultra-high-quality chart with GPT-4.1-mini Vision",
        error_type: "analysis_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
