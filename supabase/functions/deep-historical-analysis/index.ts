
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

    // Fetch historical data
    const replitUrl = `https://dukas-megarootz181.replit.app/historical?instrument=${currencyPair}&from=${fromDate}&to=${toDate}&timeframe=${mappedTimeframe}&format=json`;
    logStep("Fetching historical data from Replit", { url: replitUrl });

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

    // Fetch current tick data for current price
    let currentPrice = null;
    let currentPriceTimestamp = null;
    
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const tickUrl = `https://dukas-megarootz181.replit.app/historical?instrument=${currencyPair}&from=${todayDate}&to=${todayDate}&timeframe=tick&format=json`;
      logStep("Fetching current tick data", { url: tickUrl });

      const tickController = new AbortController();
      const tickTimeoutId = setTimeout(() => tickController.abort(), 15000); // 15 second timeout

      const tickResponse = await fetch(tickUrl, {
        signal: tickController.signal,
        headers: {
          'User-Agent': 'ForexRadar7-CurrentPrice/1.0',
          'Accept': 'application/json'
        }
      });
      clearTimeout(tickTimeoutId);

      if (tickResponse.ok) {
        const tickData = await tickResponse.json();
        logStep("Tick data fetched", { 
          dataType: typeof tickData,
          dataLength: Array.isArray(tickData) ? tickData.length : 'not array'
        });

        // Get the latest tick (last element in array)
        if (Array.isArray(tickData) && tickData.length > 0) {
          const latestTick = tickData[tickData.length - 1];
          // Try different possible field names for price
          currentPrice = latestTick.close || latestTick.bid || latestTick.price || latestTick.last;
          currentPriceTimestamp = latestTick.date || latestTick.time || latestTick.timestamp;
          
          logStep("Current price extracted", { 
            currentPrice, 
            currentPriceTimestamp,
            latestTick: JSON.stringify(latestTick).substring(0, 200)
          });
        }
      } else {
        logStep("Warning: Could not fetch tick data", { 
          status: tickResponse.status, 
          statusText: tickResponse.statusText 
        });
      }
    } catch (tickError) {
      logStep("Warning: Error fetching tick data", { error: tickError.message });
      // Continue without current price - not a critical failure
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

    // Create the enhanced trading analysis prompt with current price context
    const currentPriceContext = currentPrice ? 
      `\n\nIMPORTANT: The current market price is ${currentPrice} as of ${currentPriceTimestamp || 'latest available time'}. Please consider this current price when analyzing the historical data and making recommendations. Specifically:
      - If you identify potential setups or patterns, indicate whether they are still valid given the current price
      - If a setup has already been triggered (price has moved past the suggested entry), clearly state this
      - Provide context on how close the current price is to key support/resistance levels you identify
      - Assess whether any identified opportunities are still actionable or have already played out` : 
      '\n\nNote: Current price data is not available, so analysis is based solely on historical data.';

    const systemPrompt = `You are a highly experienced financial market analyst, specializing in technical analysis for forex currency pairs. I will provide you with historical price data in candlestick format for the currency pair ${currencyPair}. This data is for the ${timeframeLabel} timeframe, covering the date range from ${fromDate} to ${toDate}.

The candlestick data will be provided chronologically, from the oldest to the most recent.${currentPriceContext}

Your primary task is to comprehensively analyze this candlestick data and provide me with insightful market analysis and actionable trading recommendations.

Please focus on the following aspects in your analysis:

1. Current Market Trend:
   - Identify the overall current market trend – is it bullish (upward), bearish (downward), or ranging (sideways)?
   - Estimate the duration of this trend (short-term or medium-term).
   - Briefly justify your conclusion.

2. Key Support and Resistance Levels:
   - Identify 2 to 3 of the most significant price levels acting as support and resistance based on the price action.
   ${currentPrice ? '- Compare these levels to the current price and indicate proximity.' : ''}

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
   ${currentPrice ? '- Clearly indicate if the suggested setup is still valid given the current price, or if it has already been triggered.' : ''}
   - If TP and SL are not appropriate, state that clearly.

6. Setup Validity Assessment:
   ${currentPrice ? '- Given the current price context, explicitly state whether any identified trading opportunities are still actionable or have already played out.' : '- Note that without current price data, the timing of any suggested setups cannot be validated.'}

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
      finishReason: finishReason,
      currentPrice: currentPrice,
      hasPriceData: !!currentPrice
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

    // Store the analysis result with proper pair name formatting and current price info
    const analysisData = {
      type: 'deep_historical',
      analysis_type: 'comprehensive_technical',
      currency_pair: currencyPair,
      timeframe: mappedTimeframe,
      date_range: `${fromDate} to ${toDate}`,
      analysis: analysis,
      data_points: Array.isArray(historicalData) ? historicalData.length : 1,
      current_price: currentPrice,
      current_price_timestamp: currentPriceTimestamp,
      has_current_price: !!currentPrice,
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
      has_current_price: !!currentPrice,
      current_price: currentPrice,
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
