
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
    const { currencyPair, timeframe, fromDate, toDate } = requestBody;
    logStep("Request body parsed", { currencyPair, timeframe, fromDate, toDate });

    if (!currencyPair || !timeframe || !fromDate || !toDate) {
      logStep("ERROR: Missing required parameters");
      throw new Error("Missing required parameters: currencyPair, timeframe, fromDate, toDate");
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

    // Map timeframes to match Replit API expectations
    const timeframeMapping: Record<string, string> = {
      'M1': 'm1',
      'M15': 'm15',
      'M30': 'm30',
      'H1': 'h1',
      'H4': 'h4',
      'D1': 'd1',
      'W1': 'w1'
    };

    const mappedTimeframe = timeframeMapping[timeframe] || timeframe.toLowerCase();
    logStep("Timeframe mapping", { original: timeframe, mapped: mappedTimeframe });

    // Use the exact same URL format as working in history (07:36)
    const replitUrl = `https://dukas-megarootz181.replit.app/historical?instrument=${currencyPair}&from=${fromDate}&to=${toDate}&timeframe=${mappedTimeframe}&format=json`;
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

    // Get timeframe label for the prompt
    const timeframeLabels: Record<string, string> = {
      'm15': '15-minute',
      'm30': '30-minute',
      'h1': '1-hour',
      'h4': '4-hour',
      'd1': 'daily',
      'w1': 'weekly'
    };

    const timeframeLabel = timeframeLabels[mappedTimeframe] || mappedTimeframe;

    // Create the comprehensive trading analysis prompt
    const systemPrompt = `You are a highly experienced financial market analyst, specializing in technical analysis for forex currency pairs. I will provide you with historical price data in candlestick format for the currency pair ${currencyPair}. This data is for the ${timeframeLabel} timeframe, covering the date range from ${fromDate} to ${toDate}.

The candlestick data will be provided chronologically, from the oldest to the most recent.

Your primary task is to comprehensively analyze this candlestick data and provide me with insightful market analysis and actionable trading recommendations.

Please focus on the following aspects in your analysis:

1. Current Market Trend:
   - Identify the overall current market trend – is it bullish (upward), bearish (downward), or ranging (sideways)?
   - Estimate the duration of this trend (short-term or medium-term).
   - Briefly justify your conclusion.

2. Key Support and Resistance Levels:
   - Identify 2 to 3 of the most significant price levels acting as support and resistance based on the price action.

3. Technical Chart Patterns:
   - Check if any significant technical chart patterns have formed (e.g., Head and Shoulders, Double Top/Bottom, Triangles, Flags).
   - If any are found, name the pattern and explain its implications.
   - If none are found, clearly state that.

4. Market Momentum and Volatility:
   - Assess whether the market is overbought or oversold.
   - Determine the strength of momentum (strong, moderate, or weak).
   - Assess the current volatility (high, low, or normal).

5. Clear Trading Recommendation:
   - State the recommended action: BUY, SELL, or DO NOT TRADE (HOLD/WAIT).
   - Provide a concise rationale based on the findings.
   - If BUY or SELL is recommended, suggest reasonable Take Profit (TP) and Stop Loss (SL) levels.
   - If TP and SL are not appropriate, state that clearly.

Finally, present the analysis and recommendations in a concise, clear, easy-to-understand format. Avoid unnecessary introductory or concluding remarks. The goal is to deliver the most relevant and actionable information to the user.`;

    const userPrompt = `Analyze the following ${currencyPair} ${timeframeLabel} historical forex data from ${fromDate} to ${toDate}:

${dataText}

Please provide your comprehensive technical analysis and trading recommendations following the structure outlined above.`;

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
          model: "x-ai/grok-3-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
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

    // Check if response was truncated due to token limits
    const finishReason = aiData.choices?.[0]?.finish_reason;
    if (finishReason === 'length') {
      logStep("Warning: Analysis was truncated due to token limit", { 
        finishReason, 
        analysisLength: analysis.length 
      });
    }

    logStep("AI analysis completed", { 
      analysisLength: analysis.length,
      finishReason: finishReason 
    });

    // Increment deep analysis usage
    const { error: incrementError } = await supabaseClient
      .rpc('increment_deep_analysis_usage', { 
        p_user_id: user.id, 
        p_email: user.email 
      });

    if (incrementError) {
      logStep("Warning: Error incrementing usage", incrementError);
    }

    // Store the analysis result with proper pair name formatting
    const analysisData = {
      type: 'deep_historical',
      analysis_type: 'comprehensive_technical',
      currency_pair: currencyPair,
      timeframe: mappedTimeframe,
      date_range: `${fromDate} to ${toDate}`,
      analysis: analysis,
      data_points: Array.isArray(historicalData) ? historicalData.length : 1,
      created_at: new Date().toISOString(),
      // Add these fields for proper display in history
      pairName: currencyPair,
      marketAnalysis: analysis,
      overallSentiment: 'Deep Analysis',
      trendDirection: 'analyzed',
      truncated: finishReason === 'length'
    };

    const { data: storedAnalysis, error: storeError } = await supabaseClient
      .from('chart_analyses')
      .insert({
        user_id: user.id,
        pair_name: currencyPair,
        timeframe: mappedTimeframe,
        analysis_data: analysisData
      })
      .select()
      .single();

    if (storeError) {
      logStep("Warning: Error storing analysis", storeError);
    }

    logStep("Deep historical analysis completed successfully");

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData,
      analysis_id: storedAnalysis?.id,
      warning: finishReason === 'length' ? 'Analysis may be incomplete due to length limits' : null
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
