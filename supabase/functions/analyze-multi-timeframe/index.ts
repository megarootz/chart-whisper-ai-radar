
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

    // Create a very concise, efficient prompt to minimize tokens
    const systemPrompt = `Analyze these forex charts. Provide structured analysis:

**PAIR:** [trading pair]
**TREND:** [Bullish/Bearish/Neutral] - [brief reason]
**SUPPORT:** [price1, price2] 
**RESISTANCE:** [price1, price2]
**PATTERNS:** [pattern name - confidence% - signal]
**INDICATORS:** [indicator: analysis]
**SETUPS:**
Long: Entry [price] | Stop [price] | Target [price]
Short: Entry [price] | Stop [price] | Target [price]

Be specific with prices. Keep analysis concise.`;

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
          detail: "low" // Use low detail to reduce token usage
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
        max_tokens: 800, // Significantly reduced from 2000
        temperature: 0.1, // Lower temperature for more consistent output
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
