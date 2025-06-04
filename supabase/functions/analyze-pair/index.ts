
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY environment variable is not set");
    }

    const { pairName, timeframe } = await req.json();
    
    const requestData = {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert forex technical and fundamental analyst with access to real-time market data. Provide comprehensive analysis including current prices, technical levels, fundamental factors, and trading insights. Always format your response with clear sections and specific price levels."
        },
        {
          role: "user",
          content: `Provide a comprehensive forex analysis for ${pairName} on ${timeframe} timeframe. Include:

1. CURRENT MARKET DATA:
- Current live price and recent price action
- 24h high/low and percentage change
- Current market sentiment

2. TECHNICAL ANALYSIS:
- Trend direction and strength
- Key support and resistance levels (be specific with prices)
- Chart patterns currently forming
- Technical indicator signals (RSI, MACD, Moving Averages)

3. FUNDAMENTAL ANALYSIS:
- Recent economic news affecting both currencies
- Upcoming economic events and data releases
- Central bank policies and interest rate outlook
- Geopolitical factors

4. TRADING INSIGHTS:
- Bullish scenario: entry points, targets, stop loss
- Bearish scenario: entry points, targets, stop loss
- Risk-reward ratios and position sizing recommendations
- Key levels to watch for breakouts

5. MARKET OUTLOOK:
- Short-term forecast (next 24-48 hours)
- Medium-term outlook (next week)
- Key events to monitor

Please search for the most current market data and news to ensure accuracy. Format the response clearly with specific price levels and actionable insights.`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      stream: false
    };

    console.log("Sending request to DeepSeek API for pair:", pairName, "timeframe:", timeframe);
    
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestData)
    });

    console.log("DeepSeek API Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API Error:", errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log("DeepSeek response received successfully");
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Error in analyze-pair function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the pair" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
