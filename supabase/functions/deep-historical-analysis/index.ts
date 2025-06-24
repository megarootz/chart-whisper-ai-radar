
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
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("ERROR: Authentication failed", userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated");
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const requestBody = await req.json();
    const { currencyPair, timeframe, analysisType, fromDate, toDate } = requestBody;
    logStep("Request body parsed", { currencyPair, timeframe, analysisType, fromDate, toDate });

    if (!currencyPair || !timeframe || !analysisType || !fromDate || !toDate) {
      logStep("ERROR: Missing required parameters");
      throw new Error("Missing required parameters: currencyPair, timeframe, analysisType, fromDate, toDate");
    }

    // Check deep analysis usage limits
    logStep("Checking usage limits");
    const { data: usageData, error: usageError } = await supabaseClient
      .rpc('check_usage_limits', { p_user_id: user.id });

    if (usageError) {
      logStep("Error checking usage limits", usageError);
      throw new Error(`Usage check failed: ${usageError.message}`);
    }

    logStep("Usage data received", usageData);

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
      logStep("Deep analysis limit reached");
      throw new Error("Deep analysis limit reached. Please upgrade your plan or wait for the next reset period.");
    }

    // Fix the URL construction to match the Replit API format
    const replitUrl = `https://dukas-megarootz181.replit.app/historical?instrument=${currencyPair}&from=${fromDate}&to=${toDate}&timeframe=${timeframe}&format=json`;
    logStep("Fetching data from Replit", { url: replitUrl });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let replitResponse;
    try {
      replitResponse = await fetch(replitUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ForexRadar7-DeepAnalysis/1.0',
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      logStep("ERROR: Failed to fetch from Replit", { 
        error: fetchError.message,
        url: replitUrl 
      });
      throw new Error(`Failed to fetch historical data: ${fetchError.message}`);
    }

    if (!replitResponse.ok) {
      logStep("ERROR: Replit response not OK", { 
        status: replitResponse.status, 
        statusText: replitResponse.statusText 
      });
      throw new Error(`Data service unavailable: ${replitResponse.status} - ${replitResponse.statusText}`);
    }

    const historicalData = await replitResponse.json();
    logStep("Historical data fetched", { 
      dataType: typeof historicalData,
      dataLength: Array.isArray(historicalData) ? historicalData.length : 'not array'
    });

    // Validate that we have meaningful data
    if (!historicalData || (Array.isArray(historicalData) && historicalData.length === 0)) {
      logStep("ERROR: Empty data received");
      throw new Error("No historical data available for the selected parameters.");
    }

    // Convert JSON data to text format for AI analysis
    let dataText = '';
    if (Array.isArray(historicalData)) {
      dataText = historicalData.map(candle => 
        `${candle.date || candle.time || ''} ${candle.open || ''} ${candle.high || ''} ${candle.low || ''} ${candle.close || ''} ${candle.volume || ''}`
      ).join('\n');
    } else {
      dataText = JSON.stringify(historicalData);
    }

    if (dataText.length < 10) {
      logStep("ERROR: Insufficient data content", { dataText });
      throw new Error("Insufficient historical data for analysis. Please try different parameters.");
    }

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      logStep("ERROR: OpenRouter API key missing");
      throw new Error("AI analysis service not configured");
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

${dataText}

Please provide a comprehensive analysis following your expertise. Structure your response with:

1. **Market Overview**: General market condition and trend
2. **Key Levels**: Important price levels identified
3. **Analysis Findings**: Detailed analysis based on your technique
4. **Trading Opportunities**: Potential setups and entry points
5. **Risk Management**: Key levels for stops and targets
6. **Market Outlook**: Short to medium-term expectations

Be specific with price levels and provide actionable insights for traders.`;

    logStep("Sending request to OpenRouter");

    const aiController = new AbortController();
    const aiTimeoutId = setTimeout(() => aiController.abort(), 60000); // 60 second timeout

    let aiResponse;
    try {
      aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
        }),
        signal: aiController.signal
      });
      clearTimeout(aiTimeoutId);
    } catch (aiError) {
      clearTimeout(aiTimeoutId);
      logStep("ERROR: AI request failed", aiError);
      throw new Error(`AI analysis failed: ${aiError.message}`);
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("OpenRouter API error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI service error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content;

    if (!analysis) {
      logStep("ERROR: No analysis content received");
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
      logStep("Warning: Error incrementing usage", incrementError);
      // Don't throw error here, just log it
    }

    // Store the analysis result
    const analysisData = {
      type: 'deep_historical',
      analysis_type: analysisType,
      currency_pair: currencyPair,
      timeframe: timeframe,
      date_range: `${fromDate} to ${toDate}`,
      analysis: analysis,
      data_points: Array.isArray(historicalData) ? historicalData.length : 1,
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
      logStep("Warning: Error storing analysis", storeError);
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
    logStep("ERROR in deep-historical-analysis", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
