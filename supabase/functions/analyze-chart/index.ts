
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// OpenRouter API key is securely stored in Supabase's environment variables
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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
    
    // Validate image size and content
    const imageSize = base64Image?.length || 0;
    if (imageSize < 1000) {
      console.error("❌ Image too small, likely invalid:", { imageSize });
      throw new Error("Image appears to be too small or invalid. Please ensure the chart is fully loaded.");
    }
    
    const estimatedImageTokens = Math.round(imageSize / 750); // Rough estimate
    
    console.log("📊 OpenRouter GPT-4.1 Mini analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      estimatedImageTokens,
      base64Length: imageSize,
      hasValidHeader: base64Image.startsWith('data:image/'),
      imageType: base64Image.split(';')[0]?.split('/')[1] || 'unknown'
    });
    
    // Comprehensive prompt specifically designed for accurate forex chart analysis
    const analysisPrompt = `You are a professional Forex technical analyst with expertise in reading trading charts. I am providing you with a chart image for ${pairName} on the ${timeframe} timeframe.

CRITICAL INSTRUCTION: You MUST analyze the actual chart image I'm providing. This is a real trading chart screenshot with candlesticks, price levels, and time data.

Please provide a detailed technical analysis that includes:

1. **Price Action Analysis**:
   - Current price level and recent price movement
   - Identify the trend direction (bullish/bearish/sideways)
   - Key support and resistance levels visible on the chart
   - Any significant price breaks or bounces

2. **Candlestick Pattern Analysis**:
   - Identify any recognizable candlestick patterns
   - Recent candle formations and their implications
   - Volume patterns if visible

3. **Technical Indicators** (if visible on the chart):
   - Moving averages and their positions relative to price
   - RSI, MACD, or other oscillators if present
   - Trend lines or channels drawn on the chart

4. **Market Structure**:
   - Higher highs/lower lows pattern
   - Market phases (accumulation, trending, distribution)
   - Potential reversal or continuation signals

5. **Trading Opportunities**:
   - Potential entry points based on the analysis
   - Suggested stop loss and take profit levels
   - Risk/reward assessment for potential trades
   - Timeframe-appropriate position sizing considerations

6. **Risk Factors**:
   - Key levels that could invalidate the analysis
   - Market conditions that could affect the trade
   - Economic events or news that might impact this pair

Please be specific about what you observe in the actual chart image. Reference actual price levels, timeframes, and patterns you can see. Do not provide generic trading advice - analyze this specific chart.`;
    
    const requestData = {
      model: "openai/gpt-4o-mini",
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
                detail: "high" // High detail for precise chart analysis
              }
            }
          ]
        }
      ],
      temperature: 0.1, // Very low temperature for precise, consistent analysis
      max_tokens: 4000 // Sufficient for detailed analysis
    };

    console.log("🚀 Sending request to OpenRouter GPT-4.1 Mini API:", {
      pair: pairName,
      timeframe,
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageDetail: "high",
      estimatedTotalTokens: estimatedImageTokens + 4000,
      promptLength: analysisPrompt.length
    });
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Forex Chart Analyzer - GPT-4.1 Mini Advanced'
    };
    
    // Enhanced retry logic with better error handling
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
          break; // Success, exit retry loop
        } else {
          const errorText = await response.text();
          console.error(`❌ API call failed (attempt ${attempts}):`, response.status, errorText);
          
          // Check for specific error types
          if (response.status === 400) {
            throw new Error(`Invalid request: ${errorText}. Please check the chart image quality.`);
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please check API key configuration.");
          } else if (response.status === 429) {
            console.log("⚠️ Rate limit hit, waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
          }
          
          if (attempts === maxAttempts) {
            throw new Error(`API call failed after ${maxAttempts} attempts: ${response.status} - ${errorText}`);
          }
        }
        
        // Wait before retry for non-rate-limit errors
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

    console.log("📈 OpenRouter API Response status:", response!.status);
    
    // Get full response text
    const responseText = await response!.text();
    
    if (!response!.ok) {
      console.error("❌ OpenRouter API Error Response:", responseText);
      throw new Error(`Failed to analyze chart: ${response!.status} - ${responseText}`);
    }
    
    // Parse and validate response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse API response:", parseError);
      console.error("❌ Raw response:", responseText);
      throw new Error("Invalid response format from OpenRouter API");
    }
    
    // Enhanced response validation
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
      console.error("❌ Invalid response structure:", parsedResponse);
      throw new Error("No analysis content received from OpenRouter API");
    }
    
    const analysisContent = parsedResponse.choices[0].message?.content;
    if (!analysisContent || analysisContent.trim().length === 0) {
      console.error("❌ Empty analysis content:", parsedResponse.choices[0]);
      throw new Error("Empty analysis content received from OpenRouter API");
    }
    
    // Check if response contains generic template content (indicates vision failure)
    const isGenericResponse = analysisContent.toLowerCase().includes("i can't analyze the chart directly") ||
                              analysisContent.toLowerCase().includes("here's a structured approach") ||
                              analysisContent.toLowerCase().includes("### 1. overall trend direction") ||
                              (analysisContent.includes("###") && !analysisContent.includes("price") && !analysisContent.includes("level"));
    
    if (isGenericResponse) {
      console.error("❌ Detected generic template response, indicating image analysis failure");
      throw new Error("AI could not analyze the chart image. Please ensure the chart is fully loaded and visible before capturing.");
    }
    
    // Log successful response details
    const usage = parsedResponse.usage;
    console.log("✅ GPT-4.1 Mini analysis completed successfully:", {
      pairName,
      timeframe,
      responseLength: responseText.length,
      analysisLength: analysisContent.length,
      tokensUsed: usage ? {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      } : 'not available',
      model: parsedResponse.model || 'unknown',
      containsSpecificAnalysis: analysisContent.includes("price") || analysisContent.includes("level") || analysisContent.includes("support") || analysisContent.includes("resistance")
    });
    
    // Return the response with additional metadata
    const enhancedResponse = {
      ...parsedResponse,
      metadata: {
        analysis_type: "specific_chart_analysis",
        image_validated: true,
        tokens_used: usage?.total_tokens || 0,
        pair: pairName,
        timeframe: timeframe
      }
    };
    
    return new Response(JSON.stringify(enhancedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in OpenRouter GPT-4.1 Mini analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the chart with GPT-4.1 Mini",
        error_type: "analysis_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
