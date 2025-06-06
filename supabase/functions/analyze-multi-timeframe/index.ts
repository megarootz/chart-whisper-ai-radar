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
        'general': 'Focus on comprehensive technical analysis including all major indicators and patterns.',
        'breakout': 'Focus specifically on breakout patterns, key levels, volume confirmation, and breakout targets. Look for consolidation patterns, resistance/support breaks, and volume spikes.',
        'supply-demand': 'Focus on supply and demand zones, imbalances, institutional levels, and order flow. Identify where smart money is likely positioned.',
        'support-resistance': 'Focus on dynamic and static support/resistance levels, confluence areas, and how price reacts at these levels across timeframes.',
        'fibonacci': 'Focus on Fibonacci retracement levels, extension targets, time zones, and how price respects these mathematical levels.',
        'ict': 'Focus on ICT concepts including order blocks, fair value gaps, liquidity pools, market structure breaks, and institutional trading patterns.',
        'smart-money': 'Focus on smart money concepts including market structure, inducement, manipulation, and where institutional money is flowing.',
        'price-action': 'Focus purely on price action including candlestick patterns, market structure, and naked chart analysis without indicators.',
        'harmonic': 'Focus on harmonic patterns like Gartley, Butterfly, Bat, and Crab patterns with precise Fibonacci measurements.',
        'elliott-wave': 'Focus on Elliott Wave theory including impulse waves, corrective waves, and wave counts across multiple timeframes.'
      };
      return techniques[technique] || techniques['general'];
    };

    const techniqueInstructions = getTechniqueInstructions(technique);

    // Create the prompt for multi-timeframe analysis
    const systemPrompt = `You are an expert forex analyst specializing in multi-timeframe analysis and ${technique} techniques. 

${techniqueInstructions}

Analyze the provided chart images from multiple timeframes and provide a comprehensive analysis that considers:

1. **Auto-Detection**: First identify the trading pair and timeframe for each chart
2. **Multi-Timeframe Trend Analysis**: How trends align or diverge across timeframes
3. **Confluence Analysis**: Where multiple timeframes and techniques agree
4. **Key Levels**: Support/resistance levels that appear across multiple timeframes
5. **Entry Strategy**: Best timeframe for entries based on the overall analysis
6. **Risk Management**: Appropriate stops and targets considering all timeframes

Format your response as follows:

# Multi-Timeframe Analysis (${technique.toUpperCase()} Focus)

## Auto-Detected Information:
[List detected pair and timeframe for each chart]

## Overall Multi-Timeframe Assessment:
[Provide overview of how all timeframes align and the dominant trend bias]

## 1. Trend Direction Analysis:
[Analyze trend on each timeframe and overall confluence]

## 2. Key Support Levels:
[List support levels that appear across multiple timeframes]

## 3. Key Resistance Levels:
[List resistance levels that appear across multiple timeframes]

## 4. Chart Patterns:
[Identify patterns visible across timeframes with ${technique} focus]

## 5. Technical Indicators:
[Technical analysis specific to ${technique} methodology]

## 6. Trading Insights:

### Bullish Scenario:
[Multi-timeframe bullish setup with entry, stop, targets]

### Bearish Scenario:
[Multi-timeframe bearish setup with entry, stop, targets]

### Neutral/Consolidation Scenario:
[Range-bound scenarios and breakout levels]

## Summary:
Trading Bias: [Bullish/Bearish/Neutral]
Confidence: [High/Medium/Low] based on timeframe alignment
Best Entry Timeframe: [Which timeframe to use for entries]
Key Confluence Levels: [Most important levels across timeframes]`;

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
        type: "text",
        text: `Chart ${index + 1}:`
      });
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
        model: "google/gemini-flash-1.5-8b",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
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
