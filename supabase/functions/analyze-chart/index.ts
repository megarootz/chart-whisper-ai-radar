
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
    
    console.log("📊 GPT-4.1-mini Fresh Market Data Analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      base64Length: imageSize,
      hasValidHeader: base64Image.startsWith('data:image/'),
      imageType: base64Image.split(';')[0]?.split('/')[1] || 'unknown'
    });
    
    // Get current UTC time for analysis context
    const currentTime = new Date();
    const utcTimeString = currentTime.toISOString();
    const marketDay = currentTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    
    // Enhanced prompt that emphasizes analyzing CURRENT/LATEST market data
    const analysisPrompt = `I want you to act as a professional Forex (Foreign Exchange) analyst. You are analyzing a LIVE, CURRENT chart image captured at ${utcTimeString} (${marketDay} UTC).

CRITICAL INSTRUCTIONS: This chart image was captured from a live TradingView widget showing the LATEST market data. You MUST analyze the CURRENT, MOST RECENT price action and market conditions visible in this chart.

IMPORTANT: Focus on the LATEST/MOST RECENT price bars, candlesticks, and current market activity shown in the chart. Do NOT provide outdated or historical analysis.

REQUIRED OUTPUT FORMAT - Fill in every section with CURRENT market analysis:

📊 LIVE Technical Chart Analysis Report (${pairName || '[Detected Pair]'} – ${timeframe || '[Detected Timeframe]'})
Analysis Time: ${utcTimeString}

1. CURRENT Market Snapshot
• LATEST Price: [State the most recent/current price visible on the RIGHT side of the chart]
• Current Date/Time: [Note the latest timestamp visible on the chart]
• LIVE Market Status: [Current market condition: Active Trading, Weekend, Holiday, etc.]
• Fresh Data Confirmation: [Confirm this appears to be current/live data]

2. LATEST Price Action & Current Trend
• Most Recent Movement (Last few bars/candles):
  - [Describe the LATEST price movements you can see in the most recent bars/candlesticks]
  - [Note any CURRENT volatility, breakouts, or pattern completions happening NOW]
• Current Market Structure:
  - [Describe the CURRENT pattern based on the latest price action]
  - [Focus on what's happening RIGHT NOW in the market]

3. CURRENT Support & Resistance Areas
• Active Support Levels:
  - [Identify CURRENT support level with the latest price you can see] – Where price is bouncing NOW
  - [Secondary support based on recent price action]
• Active Resistance Levels:
  - [Identify CURRENT resistance level based on latest price] – Where price is being rejected NOW
  - [Secondary resistance based on recent market activity]

4. CURRENT Candlestick & Pattern Analysis
• LATEST Candlestick Behavior: [Describe the most recent 3-5 candlesticks/bars you can see]
• CURRENT Pattern Status: [Any patterns forming or completing RIGHT NOW]
• Real-Time Signals: [What the latest price action is telling us about immediate market direction]

5. IMMEDIATE Momentum & Trend Analysis
• Current Momentum: [Based on the latest visible price movement]
• SHORT-TERM Trend Direction: [What the most recent bars suggest for immediate future]
• LIVE Market Bias: [Current bullish/bearish/neutral bias based on latest action]

6. CURRENT Trade Setups & Risk Management

IMMEDIATE Trade Opportunities:
Buy Setup | Entry Area | Stop Loss | Take Profit 1 | Take Profit 2
[If bullish] | [Current support/entry] | [Recent swing low] | [Immediate resistance] | [Next resistance level]

Sell Setup | Entry Area | Stop Loss | Take Profit 1 | Take Profit 2  
[If bearish] | [Current resistance/entry] | [Recent swing high] | [Immediate support] | [Next support level]

CURRENT Market Notes:
• Trade only if the LATEST price action confirms the setup
• Use the most recent swing highs/lows for stop placement
• Position size based on CURRENT volatility

7. IMMEDIATE Breakout/Breakdown Watch
• If CURRENT price breaks above [latest resistance]: → Expect move to [next level up]
• If CURRENT price breaks below [latest support]: → Expect move to [next level down]

8. LIVE Market Summary & Current Signal
• CURRENT Market State: [Summarize what's happening RIGHT NOW based on latest visible data]
• IMMEDIATE Signal: [What should traders watch for in the next few hours/sessions]
• Next Key Level to Watch: [The most important price level for immediate price action]

9. CURRENT Trade Plan Table

Live Trade Plan | Entry | Stop Loss | Take Profit 1 | Take Profit 2 | Risk/Reward
Active Buy | [Current level] | [Recent low] | [Immediate target] | [Extended target] | [Calculate R:R]
Active Sell | [Current level] | [Recent high] | [Immediate target] | [Extended target] | [Calculate R:R]

⚠️ LIVE Market Disclaimer
This analysis is based on the current chart data captured at ${utcTimeString}. Market conditions can change rapidly. Always verify with live price feeds and use proper risk management.

CRITICAL REQUIREMENT: You MUST analyze the actual CURRENT/LATEST price data visible in the chart image. Focus on the RIGHT SIDE of the chart where the most recent price action is located. Do not provide historical or outdated analysis. This must reflect the LIVE market conditions at the time of capture.`;
    
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

    console.log("🚀 Sending LIVE market analysis request to GPT-4.1-mini Vision:", {
      pair: pairName,
      timeframe,
      analysisTime: utcTimeString,
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageDetail: "high",
      imageSize: Math.round(imageSize / 1024) + "KB"
    });
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Live Fresh Market Data Forex Chart Analyzer - GPT-4.1-mini Vision'
    };
    
    // Enhanced retry logic with better error handling
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📤 LIVE analysis API call attempt ${attempts}/${maxAttempts} to GPT-4.1-mini Vision`);
      
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          console.log("✅ GPT-4.1-mini Vision LIVE analysis API call successful");
          break;
        } else {
          const errorText = await response.text();
          console.error(`❌ API call failed (attempt ${attempts}):`, response.status, errorText);
          
          if (response.status === 400) {
            throw new Error(`Invalid request to GPT-4.1-mini Vision: ${errorText}. Please check the live chart image.`);
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

    console.log("📈 GPT-4.1-mini Vision LIVE Analysis Response status:", response!.status);
    
    const responseText = await response!.text();
    
    if (!response!.ok) {
      console.error("❌ GPT-4.1-mini Vision API Error Response:", responseText);
      throw new Error(`Failed to analyze live chart with GPT-4.1-mini Vision: ${response!.status} - ${responseText}`);
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
      analysisContent.toLowerCase().includes("i'm unable to process") ||
      analysisContent.toLowerCase().includes("i can't see the image") ||
      analysisContent.toLowerCase().includes("i cannot view") ||
      analysisContent.toLowerCase().includes("however, i can help you understand how to analyze");
    
    if (isVisionFailure) {
      console.error("❌ GPT-4.1-mini Vision failed to analyze the live chart image");
      console.error("❌ Response content:", analysisContent.substring(0, 500));
      throw new Error("GPT-4.1-mini Vision failed to analyze the live chart image. The AI reported it cannot see the image. Please ensure the chart is fully loaded and try again.");
    }
    
    // Check for specific CURRENT chart analysis indicators
    const hasCurrentAnalysis = 
      analysisContent.toLowerCase().includes("current") ||
      analysisContent.toLowerCase().includes("latest") ||
      analysisContent.toLowerCase().includes("live") ||
      analysisContent.toLowerCase().includes("recent") ||
      analysisContent.toLowerCase().includes("price") ||
      analysisContent.toLowerCase().includes("level") ||
      /\d+\.\d+/.test(analysisContent); // Check for price numbers
    
    if (!hasCurrentAnalysis) {
      console.warn("⚠️ GPT-4.1-mini Vision response may lack current market analysis");
      console.warn("⚠️ Response preview:", analysisContent.substring(0, 200));
    }
    
    const usage = parsedResponse.usage;
    console.log("✅ GPT-4.1-mini Vision LIVE market analysis completed successfully:", {
      pairName,
      timeframe,
      analysisTime: utcTimeString,
      responseLength: responseText.length,
      analysisLength: analysisContent.length,
      tokensUsed: usage ? {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      } : 'not available',
      model: parsedResponse.model || 'gpt-4.1-mini-2025-04-14',
      containsCurrentAnalysis: hasCurrentAnalysis,
      hasPriceNumbers: /\d+\.\d+/.test(analysisContent)
    });
    
    const enhancedResponse = {
      ...parsedResponse,
      metadata: {
        analysis_type: "live_current_market_analysis_gpt41mini",
        analysis_timestamp: utcTimeString,
        image_validated: true,
        tokens_used: usage?.total_tokens || 0,
        pair: pairName,
        timeframe: timeframe,
        has_current_analysis: hasCurrentAnalysis,
        model_used: "gpt-4.1-mini-2025-04-14",
        image_size_kb: Math.round(imageSize / 1024),
        contains_price_numbers: /\d+\.\d+/.test(analysisContent),
        quality_level: "live_fresh_data"
      }
    };
    
    return new Response(JSON.stringify(enhancedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in GPT-4.1-mini Vision live market analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the live chart with GPT-4.1-mini Vision",
        error_type: "live_analysis_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
