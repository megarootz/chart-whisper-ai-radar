
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
    
    // Prepare request for OpenRouter API with improved prompt
    const requestData = {
      model: "openai/chatgpt-4o-latest", // Using specified model
      messages: [
        {
          role: "system",
          content: "You are an expert forex and technical analysis expert. Analyze chart images with precision and consistency. Provide detailed, actionable analysis based on technical indicators and price action. Be accurate, consistent, and provide the same level of analysis for similar chart patterns."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this chart image. Identify the trading pair, timeframe, and provide detailed technical analysis including trend direction, key support and resistance levels, chart patterns, and trading insights.

Include a detailed recommended trading setup with entry price, stop loss, multiple take-profit targets, entry trigger conditions, and risk-reward ratio.

IMPORTANT: Make sure your stop loss and take profit levels are appropriate for the timeframe. Use these guidelines:
- For M1 (1-minute) charts: 5-20 pips SL/TP range
- For M5 (5-minute) charts: 10-30 pips SL/TP range
- For M15 (15-minute) charts: 15-50 pips SL/TP range
- For H1 (1-hour) charts: 20-100 pips SL/TP range
- For H4 (4-hour) charts: 50-200 pips SL/TP range
- For Daily charts: 100-500 pips SL/TP range
- For Weekly charts: 200+ pips SL/TP range

For chart patterns, identify both complete patterns and potential patterns that may be forming. Include a confidence score and signal direction for each pattern.

Format the response as a structured JSON with the following fields:
- overallSentiment (string: bullish, bearish, neutral, mildly bullish, or mildly bearish)
- confidenceScore (number 0-100)
- marketAnalysis (string)
- trendDirection (string: bullish, bearish, or neutral)
- marketFactors (array of objects with name, description, sentiment)
- chartPatterns (array of objects with name, confidence as number, signal, status ["complete" or "forming"])
- priceLevels (array of objects with name, price, distance, direction)
- tradingSetup (object with: type [long, short, or neutral], description, confidence, timeframe, entryPrice, stopLoss, takeProfits [array of numeric values], riskRewardRatio, entryTrigger)
- pairName (string)
- timeframe (string)

For the priceLevels, give me at least 6-8 PRECISE price levels (not rounded numbers) that correspond to actual visible support and resistance zones visible in the chart. Be specific, not generic. For example, instead of "1.2000", provide the exact price like "1.1987". Each level should include:
- name (describing the level, e.g., "Strong weekly resistance", "Daily support", "Recent lower high")
- price (the exact price level without rounding)
- distance (percentage or raw pips/points from current price)
- direction (above or below current price)

For takeProfits, ensure these are actual precise price values, not objects.

IMPORTANT: The riskRewardRatio should be formatted as a string like "1:3" to ensure proper JSON formatting.

Make the response concise but comprehensive, and ensure all numeric values are accurate based on the chart.`
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
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 4096
    };

    console.log("Sending request to OpenRouter API with model:", requestData.model);
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app', // Site URL for OpenRouter tracking
      'X-Title': 'Forex Chart Analyzer' // Name of application
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
