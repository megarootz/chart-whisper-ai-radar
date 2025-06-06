
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-MULTI-TIMEFRAME] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { charts, technique = 'general' } = await req.json();
    
    if (!charts || !Array.isArray(charts) || charts.length === 0) {
      throw new Error("No charts provided for analysis");
    }

    logStep("Received charts for analysis", { count: charts.length, technique });

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    // Create a natural, conversational prompt similar to ChatGPT
    const systemPrompt = `You are an expert forex trader and technical analyst. Analyze these multiple timeframe charts and provide a comprehensive trading analysis. 

Be conversational and natural in your response, like you're explaining to a fellow trader. Focus on:

1. **Multi-timeframe trend analysis** - What's the overall direction across timeframes?
2. **Key support and resistance levels** - Identify the most important price levels
3. **Chart patterns and formations** - What patterns do you see forming or completed?
4. **Technical indicators** - RSI, moving averages, momentum indicators, etc.
5. **Trading strategy** - Provide specific entry, stop loss, and take profit levels
6. **Risk management** - What should traders watch out for?

Combine insights from all timeframes to give the best possible trading setup. Be specific with price levels and explain your reasoning clearly.

Technique focus: ${technique}

Provide your analysis in a natural, flowing conversation style - not in bullet points or rigid format.`;

    // Prepare the content for the API call
    const content = [
      {
        type: "text",
        text: systemPrompt
      }
    ];

    // Add each chart image to the content
    charts.forEach((chart: any, index: number) => {
      content.push({
        type: "image_url",
        image_url: {
          url: chart.base64Image,
          detail: "low"
        }
      });
    });

    logStep("Calling OpenRouter API for multi-timeframe analysis");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://forexradar7.com",
        "X-Title": "ForexRadar7 Multi-Timeframe Analysis"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 1200,
        temperature: 0.3,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("API Error", { status: response.status, error: errorText });
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logStep("Analysis completed successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: "Multi-timeframe analysis failed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
