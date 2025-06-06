
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
    
    console.log("📊 Analysis request received:", { 
      pairName, 
      timeframe, 
      imageLength: base64Image?.length 
    });
    
    // Prepare request for OpenRouter API with enhanced prompt for specific symbol
    const requestData = {
      model: "openai/gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert forex, commodities, metals, and cryptocurrency technical analysis specialist. 

CRITICAL INSTRUCTIONS:
1. The user has specifically selected ${pairName} on ${timeframe} timeframe for analysis
2. You MUST analyze the ${pairName} chart shown in the image
3. Your analysis MUST be for ${pairName} and ${timeframe} timeframe ONLY
4. DO NOT analyze any other trading pair or symbol
5. If the image shows a different symbol, still provide analysis for ${pairName} but mention the discrepancy

Format your response EXACTLY like this:

${pairName} Technical Analysis (${timeframe} Chart)

1. Trend Direction:
Overall trend: [Bullish/Bearish/Neutral]

[Describe the key price movement visible on the ${pairName} chart with specific details]

2. Key Support Levels:
[List specific price levels for ${pairName}]

3. Key Resistance Levels:
[List specific price levels for ${pairName}]

4. Chart Patterns:
[Analyze patterns visible in the ${pairName} chart]

5. Technical Indicators (inferred from price action):
[Provide analysis of indicators for ${pairName}]

6. Trading Insights:
Bullish Scenario for ${pairName}:
[Detailed entry, target and stop conditions]

Bearish Scenario for ${pairName}:
[Detailed entry, target and stop conditions]

Remember: This analysis is specifically for ${pairName} on ${timeframe} timeframe. All price levels, patterns, and recommendations must be relevant to ${pairName}.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this ${pairName} chart on ${timeframe} timeframe. 

IMPORTANT: 
- This analysis is specifically for ${pairName}
- Timeframe is ${timeframe}
- Provide price levels and analysis relevant to ${pairName}
- If you see any other symbol in the chart, ignore it and focus on providing analysis for ${pairName}

Your response must start with: "${pairName} Technical Analysis (${timeframe} Chart)"`
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
      temperature: 0.2,
      max_tokens: 1300
    };

    console.log("Sending request to OpenRouter API for:", pairName, timeframe);
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Forex Chart Analyzer'
    };
    
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    console.log("API Response status:", response.status);
    
    // Get full response text
    const responseText = await response.text();
    console.log("Response received for", pairName, "- length:", responseText.length);
    
    if (!response.ok) {
      throw new Error(`Failed to analyze chart: ${response.status} - ${responseText}`);
    }
    
    // Return the raw response to the client
    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Error in analyze-chart function:", error);
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
