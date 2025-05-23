
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
    
    // Optimized and focused prompt for better accuracy within token limits
    const requestData = {
      model: "openai/gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert technical analyst. Analyze charts with precision. CRITICAL: First identify the exact trading pair in standard format (BTC/USDT, EUR/USD, XAU/USD) and timeframe. Be concise but thorough."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this chart. Format response EXACTLY as shown:

[TRADING-PAIR] Technical Analysis ([TIMEFRAME] Chart)

1. Trend Direction:
Overall trend: [Bullish/Bearish/Neutral]
[Brief trend description with key price movement]

2. Key Support Levels:
Level 1: [price] - [description]
Level 2: [price] - [description]
Level 3: [price] - [description]
[Continue up to 5 levels if visible]

3. Key Resistance Levels:
Level 1: [price] - [description]
Level 2: [price] - [description]
Level 3: [price] - [description]
[Continue up to 5 levels if visible]

4. Chart Patterns:
[Pattern name and description OR "No significant patterns detected"]

5. Technical Indicators:
[List 2-3 key indicators with current signals]

6. Trading Insights:
Bullish Scenario: [Entry, target, stop conditions]
Bearish Scenario: [Entry, target, stop conditions]
Neutral Scenario: [Range trading strategy]

Keep total response under 800 tokens. Focus on actionable levels near current price.`
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
      max_tokens: 800,
      top_p: 0.9
    };

    console.log("Sending optimized request to OpenRouter API");
    
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
