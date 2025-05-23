
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
    
    // Drastically simplified and optimized prompt
    const requestData = {
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a forex technical analyst. Provide EXACT numerical price levels only."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${pairName} ${timeframe} chart. Format EXACTLY:

TREND: [Bullish/Bearish/Neutral]

SUPPORT:
1. [EXACT PRICE]
2. [EXACT PRICE]
3. [EXACT PRICE]

RESISTANCE:
1. [EXACT PRICE]
2. [EXACT PRICE]
3. [EXACT PRICE]

PATTERN: [Pattern name OR "None"]

INDICATORS: [Brief 1-2 sentence summary]

TRADE: Entry [PRICE] | Stop [PRICE] | Target [PRICE]

Keep under 150 words total. EXACT numerical prices only.`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "low"
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 200,
      top_p: 0.9
    };

    console.log("Sending optimized request to OpenRouter API");
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Forex Chart Analyzer'
    };
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    console.log("API Response status:", response.status);
    
    const responseText = await response.text();
    console.log("Response received, length:", responseText.length);
    
    if (!response.ok) {
      throw new Error(`Failed to analyze chart: ${response.status} - ${responseText}`);
    }
    
    try {
      const responseData = JSON.parse(responseText);
      if (responseData.usage) {
        console.log("Token usage:", responseData.usage);
        if (responseData.usage.total_tokens > 2000) {
          console.error("Token usage still exceeding 2000:", responseData.usage.total_tokens);
        } else {
          console.log("Token usage within limit:", responseData.usage.total_tokens);
        }
      }
    } catch (parseError) {
      console.log("Could not parse response for token counting");
    }
    
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
