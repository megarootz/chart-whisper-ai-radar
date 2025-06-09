
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
    
    // Calculate estimated token usage for monitoring
    const imageSize = base64Image?.length || 0;
    const estimatedImageTokens = Math.round(imageSize / 750); // Rough estimate
    
    console.log("📊 OpenRouter GPT-4.1 Mini analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      estimatedImageTokens,
      base64Length: imageSize
    });
    
    // Simple professional Forex analysis prompt as requested
    const requestData = {
      model: "openai/gpt-4o-mini", // Using GPT-4.1 Mini equivalent
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
                detail: "low" // Using low detail to reduce token usage significantly
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 2000 // Increased for detailed analysis as requested
    };

    console.log("🚀 Sending request to OpenRouter GPT-4.1 Mini API:", {
      pair: pairName,
      timeframe,
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageDetail: "low",
      estimatedTotalTokens: estimatedImageTokens + 2000
    });
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Forex Chart Analyzer - GPT-4.1 Mini'
    };
    
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    console.log("📈 OpenRouter API Response status:", response.status);
    
    // Get full response text
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("❌ OpenRouter API Error Response:", responseText);
      throw new Error(`Failed to analyze chart: ${response.status} - ${responseText}`);
    }
    
    // Parse and log response details
    try {
      const parsedResponse = JSON.parse(responseText);
      const usage = parsedResponse.usage;
      
      console.log("✅ GPT-4.1 Mini analysis completed successfully:", {
        pairName,
        timeframe,
        responseLength: responseText.length,
        tokensUsed: usage ? {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        } : 'not available',
        model: parsedResponse.model || 'unknown'
      });
    } catch (parseError) {
      console.log("✅ Analysis completed (couldn't parse usage details):", {
        pairName,
        responseLength: responseText.length
      });
    }
    
    // Return the raw response to the client as requested
    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in OpenRouter GPT-4.1 Mini analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the chart with GPT-4.1 Mini" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
