
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// API key is securely stored in Supabase's environment variables
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
    
    console.log("📊 Optimized chart analysis request:", { 
      pairName, 
      timeframe, 
      imageSizeKB: Math.round(imageSize / 1024),
      estimatedImageTokens,
      base64Length: imageSize
    });
    
    // Optimized professional trading analysis prompt
    const requestData = {
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional trader analyzing ${pairName} on ${timeframe}. Provide analysis in these sections:

**1. Market Structure & Trend Analysis**
**2. Critical Support & Resistance Levels**
**3. Chart Patterns & Formations**
**4. Technical Indicators Synthesis**
**5. Professional Trading Setup**

For trading setups include entry, stop loss, take profits with specific prices. Keep responses concise but professional.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${pairName} chart on ${timeframe} timeframe. Focus on actionable trading insights with specific price levels.`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "medium" // Changed from "high" to "medium" to reduce token usage
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 2000 // Increased from 1500 to allow for more detailed analysis
    };

    console.log("🚀 Sending optimized request to OpenRouter API:", {
      pair: pairName,
      timeframe,
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageDetail: "medium",
      estimatedTotalTokens: estimatedImageTokens + 200 // Prompt + response estimate
    });
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Optimized Forex Chart Analyzer'
    };
    
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    console.log("📈 API Response status:", response.status);
    
    // Get full response text
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("❌ API Error Response:", responseText);
      throw new Error(`Failed to analyze chart: ${response.status} - ${responseText}`);
    }
    
    // Parse and log response details
    try {
      const parsedResponse = JSON.parse(responseText);
      const usage = parsedResponse.usage;
      
      console.log("✅ Analysis completed successfully:", {
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
    
    // Return the raw response to the client
    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in optimized analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the chart" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
