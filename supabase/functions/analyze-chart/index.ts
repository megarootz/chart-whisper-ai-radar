
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
    
    // Validate base64 image
    if (!base64Image || !base64Image.startsWith('data:image/')) {
      console.error("❌ Invalid image format:", { 
        hasImage: !!base64Image, 
        hasHeader: base64Image?.startsWith('data:image/'),
        imageStart: base64Image?.substring(0, 50) 
      });
      throw new Error("Invalid image format. Expected base64 encoded image.");
    }
    
    // Calculate estimated token usage for monitoring
    const imageSize = base64Image?.length || 0;
    const estimatedImageTokens = Math.round(imageSize / 750); // Rough estimate
    
    console.log("📊 OpenRouter GPT-4o-mini analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      estimatedImageTokens,
      base64Length: imageSize,
      hasValidHeader: base64Image.startsWith('data:image/'),
      imageType: base64Image.split(';')[0]?.split('/')[1] || 'unknown'
    });
    
    // Enhanced prompt specifically for forex chart analysis
    const analysisPrompt = `I want you to act as a professional Forex (Foreign Exchange) analyst. Analyze this ${pairName} chart image on the ${timeframe} timeframe.

Please provide a comprehensive technical analysis including:
1. Overall trend direction (bullish/bearish/sideways)
2. Key support and resistance levels visible on the chart
3. Chart patterns you can identify
4. Technical indicators if visible (moving averages, RSI, etc.)
5. Price action analysis
6. Potential trading opportunities
7. Risk management considerations

Be specific about what you see in the chart and provide actionable insights for forex trading.`;
    
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
                detail: "high" // High detail for better chart analysis
              }
            }
          ]
        }
      ],
      temperature: 0.2, // Lower temperature for more focused analysis
      max_tokens: 4000 // Sufficient for detailed analysis
    };

    console.log("🚀 Sending request to OpenRouter GPT-4o-mini API:", {
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
      'X-Title': 'Forex Chart Analyzer - GPT-4o-mini'
    };
    
    // Call OpenRouter API with retry logic
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
          
          if (attempts === maxAttempts) {
            throw new Error(`API call failed after ${maxAttempts} attempts: ${response.status} - ${errorText}`);
          }
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        
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
    
    // Validate response structure
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
      console.error("❌ Invalid response structure:", parsedResponse);
      throw new Error("No analysis content received from OpenRouter API");
    }
    
    const analysisContent = parsedResponse.choices[0].message?.content;
    if (!analysisContent) {
      console.error("❌ Empty analysis content:", parsedResponse.choices[0]);
      throw new Error("Empty analysis content received from OpenRouter API");
    }
    
    // Log successful response details
    const usage = parsedResponse.usage;
    console.log("✅ GPT-4o-mini analysis completed successfully:", {
      pairName,
      timeframe,
      responseLength: responseText.length,
      analysisLength: analysisContent.length,
      tokensUsed: usage ? {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      } : 'not available',
      model: parsedResponse.model || 'unknown'
    });
    
    // Return the raw response to the client
    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in OpenRouter GPT-4o-mini analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the chart with GPT-4o-mini" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
