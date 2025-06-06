
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

    // Get trading technique specific instructions
    const getTechniqueInstructions = (technique: string) => {
      const techniques: Record<string, string> = {
        'general': 'Comprehensive technical analysis including all major indicators and patterns.',
        'breakout': 'Focus on breakout patterns, key levels, volume confirmation, and breakout targets.',
        'supply-demand': 'Focus on supply and demand zones, imbalances, institutional levels.',
        'support-resistance': 'Focus on dynamic and static support/resistance levels and confluence areas.',
        'fibonacci': 'Focus on Fibonacci retracement levels, extension targets, and mathematical levels.',
        'ict': 'Focus on ICT concepts including order blocks, fair value gaps, liquidity pools.',
        'smart-money': 'Focus on smart money concepts including market structure and institutional flow.',
        'price-action': 'Focus purely on price action including candlestick patterns and market structure.',
        'harmonic': 'Focus on harmonic patterns like Gartley, Butterfly, Bat, and Crab patterns.',
        'elliott-wave': 'Focus on Elliott Wave theory including impulse and corrective waves.'
      };
      return techniques[technique] || techniques['general'];
    };

    const techniqueInstructions = getTechniqueInstructions(technique);

    // Create a concise, efficient prompt
    const systemPrompt = `You are an expert forex analyst. Analyze these chart images and provide structured multi-timeframe analysis.

FOCUS: ${techniqueInstructions}

Provide your analysis in this EXACT format:

**PAIR:** [Auto-detect trading pair]
**TIMEFRAMES:** [List detected timeframes for each chart]

**TREND ANALYSIS:**
- Overall trend: [Bullish/Bearish/Neutral]
- Multi-timeframe alignment: [Description]

**SUPPORT LEVELS:**
- Level 1: [Price] - [Description]
- Level 2: [Price] - [Description]

**RESISTANCE LEVELS:**  
- Level 1: [Price] - [Description]
- Level 2: [Price] - [Description]

**CHART PATTERNS:**
- Pattern 1: [Name] - [Confidence%] - [Bullish/Bearish signal]
- Pattern 2: [Name] - [Confidence%] - [Bullish/Bearish signal]

**TECHNICAL INDICATORS:**
- [Indicator 1]: [Analysis]
- [Indicator 2]: [Analysis]

**TRADING SCENARIOS:**

Bullish Setup:
Entry: [Price] | Stop: [Price] | Target: [Price]
Description: [Brief explanation]

Bearish Setup:  
Entry: [Price] | Stop: [Price] | Target: [Price]
Description: [Brief explanation]

Neutral Setup:
Range: [Price range] | Breakout levels: [Levels]
Description: [Brief explanation]

Be specific with prices and levels. Provide actionable analysis.`;

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
          url: chart.base64Image
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
        max_tokens: 2000,
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
