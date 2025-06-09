
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
    
    console.log("📊 Enhanced analysis request received:", { 
      pairName, 
      timeframe, 
      imageLength: base64Image?.length 
    });
    
    // Optimized professional trading analysis prompt
    const requestData = {
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional institutional trader with 15+ years of experience. Analyze the ${pairName} chart on ${timeframe} timeframe and provide a comprehensive technical analysis.

Structure your response with these sections:
1. Market Structure & Trend Analysis
2. Critical Support & Resistance Levels (with exact prices)
3. Volume & Momentum Analysis
4. Chart Patterns & Formations
5. Technical Indicators Synthesis
6. Multi-Timeframe Context
7. Detailed Trading Setups (bullish and bearish scenarios with specific entry/exit levels)
8. Risk Management Framework
9. Market Outlook & Key Levels to Watch
10. Trade Management & Contingencies

For each trading setup, include:
- Precise entry zone with price levels
- Stop loss placement with reasoning
- Multiple take profit targets
- Risk-reward ratio
- Position sizing recommendation
- Entry confirmation signals required

Focus on actionable insights with specific price levels, proper risk management, and institutional-grade analysis. Use professional trading terminology and provide confluence factors for all key levels.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Provide a comprehensive institutional-grade technical analysis for this ${pairName} chart on ${timeframe} timeframe. Include specific price levels, trading setups, and risk management recommendations.`
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
      max_tokens: 2500
    };

    console.log("Sending optimized request to OpenRouter API for:", pairName, timeframe);
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Professional Forex Chart Analyzer'
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
    console.log("Enhanced analysis response received for", pairName, "- length:", responseText.length);
    
    if (!response.ok) {
      throw new Error(`Failed to analyze chart: ${response.status} - ${responseText}`);
    }
    
    // Return the raw response to the client
    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Error in enhanced analyze-chart function:", error);
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
