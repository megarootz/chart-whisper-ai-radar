
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
    
    // Prepare request for OpenRouter API with optimized prompt
    const requestData = {
      model: "openai/gpt-4.1-mini", // Using the gpt-4.1-mini model
      messages: [
        {
          role: "system",
          content: "You are an expert forex, commodities, metals, and cryptocurrency technical analysis specialist. Your PRIMARY and MOST IMPORTANT task is to ACCURATELY identify the EXACT trading pair and timeframe from the chart image. You MUST return the trading pair in standard abbreviated format (e.g., BTC/USDT, EUR/USD, XAU/USD).\n\n1. For cryptocurrencies:\n- Always use abbreviations: BTC for Bitcoin, ETH for Ethereum, XRP for Ripple, etc.\n- Always include both parts of the pair with a slash: BTC/USDT, ETH/BTC, etc.\n- NEVER write just 'Bitcoin' or 'Tetherus' - always use the symbol format\n\n2. For forex:\n- Use standard ISO currency codes: EUR/USD, GBP/JPY, USD/CAD, etc.\n- Always maintain correct capitalization\n\n3. For commodities and metals:\n- Use standard codes: XAU/USD (Gold), XAG/USD (Silver), etc.\n\nIf you see a name like 'Bitcoin/Tetherus', convert it to 'BTC/USDT'. If you see 'Ethereum', convert it to 'ETH'. Always write pairs in the format BASE/QUOTE with the slash character.\n\nThe pair and timeframe MUST be the first thing you identify in your analysis, before any other details."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this chart. CRITICALLY IMPORTANT: Start by identifying the EXACT trading pair symbol and timeframe from the image. Look at the title, labels, and any text on the chart. Format the pair in standard trading notation with abbreviations (e.g., BTC/USDT, EUR/USD, XAU/USD) - NEVER use full names like "Bitcoin" or single names like "Tetherus". Always include both the base and quote currency with a slash between them.

Format your response exactly like this:

[DETECTED-PAIR-NAME] Technical Analysis ([DETECTED-TIMEFRAME] Chart)

1. Trend Direction:
Overall trend: [Bullish/Bearish/Neutral]

[Describe the key price movement visible on the chart with specific details]

[Note any recent change in direction with specific details]

Currently, the price appears to be [describe current price action in detail]

2. Key Support Levels:
[List multiple specific price levels with detailed descriptions for each]

3. Key Resistance Levels:
[List multiple specific price levels with detailed descriptions for each]

4. Chart Patterns:
[Name specific patterns visible on the chart with detailed technical implications]
[Include complete analysis of pattern formation and implications]

5. Technical Indicators (inferred from price action):
[Provide detailed analysis of indicators and their signals]
[Include specific insights about momentum, volume, etc]

6. Trading Insights:
Bullish Scenario:
[Detailed entry, target and stop conditions]

Bearish Scenario:
[Detailed entry, target and stop conditions]

Neutral / Consolidation Scenario:
[Range trading strategies and breakout watch levels]`
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

    console.log("Sending request to OpenRouter API with model:", requestData.model);
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Forex Chart Analyzer'
    };
    
    console.log("Request headers prepared");
    
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    console.log("API Response status:", response.status);
    
    // Get full response text
    const responseText = await response.text();
    console.log("Response received:", responseText.substring(0, 200) + "...");
    
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
