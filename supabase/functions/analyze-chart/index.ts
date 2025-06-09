
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
      hasValidHeader: base64Image.startsWith('data:image/')
    });
    
    // Use the exact prompt requested by the user
    const requestData = {
      model: "openai/gpt-4o-mini", // Using GPT-4o-mini as specified
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "I want you to act as a professional Forex (Foreign Exchange) analyst. Analyze the image I give to you."
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high" // Using high detail for better analysis
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4000 // Increased for comprehensive analysis
    };

    console.log("🚀 Sending request to OpenRouter GPT-4o-mini API:", {
      pair: pairName,
      timeframe,
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageDetail: "high",
      estimatedTotalTokens: estimatedImageTokens + 4000
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
        } else if (attempts === maxAttempts) {
          throw new Error(`API call failed after ${maxAttempts} attempts`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        
      } catch (error) {
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
      throw new Error("Invalid response format from OpenRouter API");
    }
    
    // Validate response structure
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
      console.error("❌ Invalid response structure:", parsedResponse);
      throw new Error("No analysis content received from OpenRouter API");
    }
    
    const analysisContent = parsedResponse.choices[0].message?.content;
    if (!analysisContent) {
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
    
    // Return the raw response to the client as requested
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
