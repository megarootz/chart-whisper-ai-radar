
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
    
    // Enhanced prompt for precise price level extraction
    const requestData = {
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert technical analyst. Analyze charts with precision and provide EXACT NUMERICAL PRICE LEVELS. Always identify the trading pair and timeframe first. Focus on providing specific price values, not general descriptions."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this chart and provide EXACT NUMERICAL PRICE LEVELS. Format response EXACTLY as shown:

[TRADING-PAIR] Technical Analysis ([TIMEFRAME] Chart)

1. Trend Direction:
Overall trend: [Bullish/Bearish/Neutral]
[Brief trend analysis with current price context]

2. Key Support Levels:
Level 1: [EXACT PRICE] - [brief description]
Level 2: [EXACT PRICE] - [brief description]
Level 3: [EXACT PRICE] - [brief description]
Level 4: [EXACT PRICE] - [brief description]
Level 5: [EXACT PRICE] - [brief description]

3. Key Resistance Levels:
Level 1: [EXACT PRICE] - [brief description]
Level 2: [EXACT PRICE] - [brief description]
Level 3: [EXACT PRICE] - [brief description]
Level 4: [EXACT PRICE] - [brief description]
Level 5: [EXACT PRICE] - [brief description]

4. Chart Patterns:
[Pattern name and description OR "No significant patterns detected"]

5. Technical Indicators:
[List 2-3 key indicators with current signals]

6. Trading Insights:
Bullish Scenario: [Entry price, target prices, stop loss with EXACT numbers]
Bearish Scenario: [Entry price, target prices, stop loss with EXACT numbers]
Neutral Scenario: [Range trading strategy with EXACT price levels]

CRITICAL REQUIREMENTS:
- ALL support and resistance levels MUST be EXACT NUMERICAL PRICES (e.g., 1.2345, 192.50, 0.8765)
- NO vague descriptions like "EMA support" or "dynamic level"
- Extract precise price levels from the chart's price axis
- Provide up to 5 support and 5 resistance levels if visible
- All trading scenarios must include EXACT entry, stop, and target prices

Keep response under 750 tokens. Focus on precise numerical analysis.`
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
      max_tokens: 750,
      top_p: 0.9
    };

    console.log("Sending enhanced request to OpenRouter API for precise price levels");
    
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
    console.log("Response received, length:", responseText.length);
    
    if (!response.ok) {
      throw new Error(`Failed to analyze chart: ${response.status} - ${responseText}`);
    }
    
    // Parse response to check token usage
    try {
      const responseData = JSON.parse(responseText);
      if (responseData.usage) {
        console.log("Token usage:", responseData.usage);
        if (responseData.usage.total_tokens > 2000) {
          console.warn("Token usage exceeded 2000:", responseData.usage.total_tokens);
        }
      }
    } catch (parseError) {
      console.log("Could not parse response for token counting");
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
