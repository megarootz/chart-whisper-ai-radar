
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEEP-HISTORICAL-ANALYSIS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { currencyPair, timeframe, analysisType, fromDate, toDate } = await req.json();
    logStep("Request body parsed", { currencyPair, timeframe, analysisType, fromDate, toDate });

    // Check deep analysis usage limits with better error handling
    const { data: usageData, error: usageError } = await supabaseClient
      .rpc('check_usage_limits', { p_user_id: user.id });

    if (usageError) {
      logStep("Error checking usage limits", usageError);
      throw new Error(`Usage check failed: ${usageError.message}`);
    }

    logStep("Usage data received", usageData);

    // More robust usage checking
    if (!usageData) {
      logStep("No usage data returned");
      throw new Error("Unable to retrieve usage information. Please try again.");
    }

    // Check both daily and monthly limits for deep analysis
    const deepDailyCount = usageData.deep_analysis_daily_count || 0;
    const deepMonthlyCount = usageData.deep_analysis_monthly_count || 0;
    const deepDailyLimit = usageData.deep_analysis_daily_limit || 1;
    const deepMonthlyLimit = usageData.deep_analysis_monthly_limit || 30;

    const canUseDeepAnalysis = (deepDailyCount < deepDailyLimit) && (deepMonthlyCount < deepMonthlyLimit);

    logStep("Deep analysis limits check", {
      deepDailyCount,
      deepMonthlyCount,
      deepDailyLimit,
      deepMonthlyLimit,
      canUseDeepAnalysis
    });

    if (!canUseDeepAnalysis) {
      logStep("Deep analysis limit reached", {
        dailyUsage: `${deepDailyCount}/${deepDailyLimit}`,
        monthlyUsage: `${deepMonthlyCount}/${deepMonthlyLimit}`
      });
      throw new Error("Deep analysis limit reached. Please upgrade your plan or wait for the next reset period.");
    }

    // Download historical data from Replit
    const replitUrl = `https://dukascopy-node.radenrafi2.repl.co/api/candles?symbol=${currencyPair}&timeframe=${timeframe}&format=txt&from=${fromDate}&to=${toDate}`;
    logStep("Fetching data from Replit", { url: replitUrl });

    const replitResponse = await fetch(replitUrl);
    if (!replitResponse.ok) {
      throw new Error(`Failed to fetch data from Replit: ${replitResponse.statusText}`);
    }

    const historicalData = await replitResponse.text();
    logStep("Historical data fetched", { dataLength: historicalData.length });

    // Validate that we have data
    if (!historicalData || historicalData.trim().length === 0) {
      throw new Error("No historical data available for the selected parameters. Please try different dates or currency pair.");
    }

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    // Create analysis prompt based on technique
    const analysisPrompts = {
      ict: `You are an expert ICT (Inner Circle Trader) analyst. Analyze this forex historical data and provide insights focusing on:
- Market structure (higher highs, higher lows, lower highs, lower lows)
- Liquidity zones and sweep areas
- Order blocks (bullish and bearish)
- Fair value gaps (FVG)
- Imbalances and inefficiencies
- Key support and resistance levels
- Potential entry and exit points based on ICT concepts`,
      
      elliott_wave: `You are an expert Elliott Wave analyst. Analyze this forex historical data and provide insights focusing on:
- Wave count identification (impulse waves 1-5 and corrective waves A-C)
- Wave degree and structure
- Fibonacci retracements and extensions
- Key turning points and wave relationships
- Current wave position and future projections
- Support and resistance levels based on wave analysis`,
      
      support_resistance: `You are an expert technical analyst specializing in support and resistance. Analyze this forex historical data and provide insights focusing on:
- Key horizontal support and resistance levels
- Dynamic support/resistance (trend lines)
- Breakout and breakdown points
- Volume confirmation at key levels
- Level retests and rejections
- Potential price targets and reversal zones`,
      
      fibonacci: `You are an expert Fibonacci analyst. Analyze this forex historical data and provide insights focusing on:
- Fibonacci retracement levels (23.6%, 38.2%, 50%, 61.8%, 78.6%)
- Fibonacci extension levels (127.2%, 161.8%, 261.8%)
- Key swing points for Fibonacci analysis
- Confluence areas with multiple Fibonacci levels
- Price reactions at Fibonacci levels
- Potential reversal and continuation patterns`,
      
      volume_profile: `You are an expert volume profile analyst. Analyze this forex historical data and provide insights focusing on:
- Volume distribution across price levels
- Point of control (POC) identification
- Value area high and low
- Volume clusters and gaps
- Price acceptance and rejection zones
- Volume-based support and resistance levels`,
      
      market_structure: `You are an expert market structure analyst. Analyze this forex historical data and provide insights focusing on:
- Trend identification and strength
- Market phases (accumulation, markup, distribution, markdown)
- Swing highs and swing lows analysis
- Trend line breaks and confirmations
- Market momentum and divergences
- Key structural levels and zones`
    };

    const systemPrompt = analysisPrompts[analysisType as keyof typeof analysisPrompts] || analysisPrompts.market_structure;

    const userPrompt = `Analyze the following ${currencyPair} ${timeframe} historical forex data from ${fromDate} to ${toDate}:

${historicalData}

Data format: Each line contains: Date, Time, Open, High, Low, Close, Volume

Please provide a comprehensive analysis following your expertise. Structure your response with:

1. **Market Overview**: General market condition and trend
2. **Key Levels**: Important price levels identified
3. **Analysis Findings**: Detailed analysis based on your technique
4. **Trading Opportunities**: Potential setups and entry points
5. **Risk Management**: Key levels for stops and targets
6. **Market Outlook**: Short to medium-term expectations

Be specific with price levels and provide actionable insights for traders.`;

    logStep("Sending request to OpenRouter");

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://forexradar7.com",
        "X-Title": "ForexRadar7 Deep Historical Analysis"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("OpenRouter API error", { status: aiResponse.status, error: errorText });
      throw new Error(`OpenRouter API failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis content received from AI");
    }

    logStep("AI analysis completed", { analysisLength: analysis.length });

    // Increment deep analysis usage
    const { error: incrementError } = await supabaseClient
      .rpc('increment_deep_analysis_usage', { 
        p_user_id: user.id, 
        p_email: user.email 
      });

    if (incrementError) {
      logStep("Error incrementing deep analysis usage", incrementError);
    }

    // Store the analysis result
    const analysisData = {
      type: 'deep_historical',
      analysis_type: analysisType,
      currency_pair: currencyPair,
      timeframe: timeframe,
      date_range: `${fromDate} to ${toDate}`,
      analysis: analysis,
      data_points: historicalData.split('\n').length - 1, // Subtract header
      created_at: new Date().toISOString()
    };

    const { data: storedAnalysis, error: storeError } = await supabaseClient
      .from('chart_analyses')
      .insert({
        user_id: user.id,
        pair_name: currencyPair,
        timeframe: timeframe,
        analysis_data: analysisData
      })
      .select()
      .single();

    if (storeError) {
      logStep("Error storing analysis", storeError);
      // Don't throw error here, just log it
    }

    logStep("Deep historical analysis completed successfully");

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData,
      analysis_id: storedAnalysis?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in deep-historical-analysis", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
