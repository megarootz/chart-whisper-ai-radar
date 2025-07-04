
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

// Helper function to format timestamps to readable dates
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  try {
    let date: Date;
    
    // Handle different timestamp formats
    if (typeof timestamp === 'string') {
      // If it's already a date string, use it
      if (timestamp.includes('-') || timestamp.includes('/')) {
        date = new Date(timestamp);
      } else {
        // If it's a string number, parse it
        const num = parseInt(timestamp);
        // Handle both seconds and milliseconds timestamps
        date = num > 1000000000000 ? new Date(num) : new Date(num * 1000);
      }
    } else if (typeof timestamp === 'number') {
      // Handle both seconds and milliseconds timestamps
      date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
    } else {
      return String(timestamp);
    }
    
    // Return formatted date if valid
    if (!isNaN(date.getTime())) {
      return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
  } catch (error) {
    logStep("Warning: Error formatting timestamp", { timestamp, error: error.message });
  }
  
  return String(timestamp);
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
      return new Response(JSON.stringify({ 
        error: "No authorization header provided" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("ERROR: Authentication failed", userError);
      return new Response(JSON.stringify({ 
        error: `Authentication error: ${userError.message}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated");
      return new Response(JSON.stringify({ 
        error: "User not authenticated or email not available" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      logStep("ERROR: Invalid JSON in request body", error);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON in request body" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { currencyPair, timeframe, fromDate, toDate } = requestBody;
    logStep("Request body parsed", { currencyPair, timeframe, fromDate, toDate });

    if (!currencyPair || !timeframe || !fromDate || !toDate) {
      logStep("ERROR: Missing required parameters");
      return new Response(JSON.stringify({ 
        error: "Missing required parameters: currencyPair, timeframe, fromDate, toDate" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check deep analysis usage limits
    logStep("Checking usage limits");
    let usageData;
    try {
      const { data, error: usageError } = await supabaseClient
        .rpc('check_usage_limits', { p_user_id: user.id });

      if (usageError) {
        logStep("Error checking usage limits", usageError);
        return new Response(JSON.stringify({ 
          error: `Usage check failed: ${usageError.message}` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      usageData = data;
    } catch (error) {
      logStep("Error in usage check", error);
      return new Response(JSON.stringify({ 
        error: "Failed to check usage limits" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    logStep("Usage data received", usageData);

    if (!usageData) {
      logStep("No usage data returned");
      return new Response(JSON.stringify({ 
        error: "Unable to retrieve usage information. Please try again." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
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
      return new Response(JSON.stringify({ 
        error: "Deep analysis limit reached. Please upgrade your plan or wait for the next reset period." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    // Map timeframes to match new API expectations
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

    // Fetch historical data using the new Dukascopy API
    const dukascopyUrl = `https://duka-aa28.onrender.com/historical?instrument=${currencyPair.toLowerCase()}&from=${fromDate}&to=${toDate}&timeframe=${mappedTimeframe}&format=json`;
    logStep("📊 FETCHING HISTORICAL DATA", { 
      url: dukascopyUrl,
      timeframe: mappedTimeframe,
      purpose: "Getting historical bars/candles for analysis"
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Reduced timeout to 30 seconds

    let dukascopyResponse;
    let historicalData;
    
    try {
      dukascopyResponse = await fetch(dukascopyUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ForexRadar7-HistoricalData/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);

      if (!dukascopyResponse.ok) {
        logStep("ERROR: Dukascopy API response not OK", { 
          status: dukascopyResponse.status, 
          statusText: dukascopyResponse.statusText 
        });
        return new Response(JSON.stringify({ 
          error: `Historical data service error: ${dukascopyResponse.status} - ${dukascopyResponse.statusText}` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const responseText = await dukascopyResponse.text();
      logStep("📈 HISTORICAL DATA RECEIVED", { 
        length: responseText.length,
        preview: responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '')
      });

      if (!responseText || responseText.trim().length === 0) {
        logStep("ERROR: Empty response from Dukascopy");
        return new Response(JSON.stringify({ 
          error: "No data received from historical data service" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      // Try to parse as JSON first
      try {
        historicalData = JSON.parse(responseText);
        logStep("Historical data parsed as JSON", { 
          isArray: Array.isArray(historicalData),
          length: Array.isArray(historicalData) ? historicalData.length : 'not array'
        });
      } catch (parseError) {
        logStep("JSON parse failed, trying CSV format", { parseError: parseError.message });
        
        // If it's not JSON, try to parse as CSV
        if (responseText.includes(',') && responseText.includes('\n')) {
          const lines = responseText.trim().split('\n');
          if (lines.length > 1) {
            historicalData = lines.slice(1).map((line, index) => {
              const parts = line.split(',');
              if (parts.length >= 5) {
                return {
                  timestamp: parts[0],
                  open: parseFloat(parts[1]),
                  high: parseFloat(parts[2]),
                  low: parseFloat(parts[3]),
                  close: parseFloat(parts[4]),
                  volume: parts[5] ? parseFloat(parts[5]) : 0
                };
              }
              return null;
            }).filter(item => item !== null);
            
            logStep("Historical data parsed as CSV", { 
              totalLines: lines.length,
              validCandles: historicalData.length
            });
          }
        }
        
        if (!historicalData || historicalData.length === 0) {
          logStep("ERROR: Unable to parse historical data");
          return new Response(JSON.stringify({ 
            error: 'Unable to parse historical data response' 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 502,
          });
        }
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);
      logStep("ERROR: Failed to fetch historical data", { 
        error: fetchError.message,
        url: dukascopyUrl 
      });
      return new Response(JSON.stringify({ 
        error: `Failed to fetch historical data: ${fetchError.message}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    // Validate historical data
    if (!historicalData || (Array.isArray(historicalData) && historicalData.length === 0)) {
      logStep("ERROR: No historical data received");
      return new Response(JSON.stringify({ 
        error: "No historical data available for the selected parameters. Please try different date range or timeframe." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const dataPointCount = Array.isArray(historicalData) ? historicalData.length : 1;
    logStep("✅ DATA VALIDATION COMPLETE", { 
      historicalDataPoints: dataPointCount,
      dataType: `${dataPointCount} ${mappedTimeframe} bars/candles`
    });

    // Convert historical data to text format for AI analysis WITH FORMATTED TIMESTAMPS
    let dataText = '';
    if (Array.isArray(historicalData)) {
      dataText = historicalData.map(candle => {
        const formattedTimestamp = formatTimestamp(candle.timestamp || candle.date || candle.time || '');
        const open = candle.open || '';
        const high = candle.high || '';
        const low = candle.low || '';
        const close = candle.close || '';
        const volume = candle.volume || '';
        return `${formattedTimestamp},${open},${high},${low},${close},${volume}`;
      }).join('\n');
    } else if (typeof historicalData === 'object') {
      dataText = JSON.stringify(historicalData);
    }

    if (dataText.length < 10 || dataPointCount === 0) {
      logStep("ERROR: Insufficient historical data", { dataTextLength: dataText.length, dataPointCount });
      return new Response(JSON.stringify({ 
        error: "Insufficient historical data for analysis. Please try different parameters." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Get current price from the latest data point
    let currentPrice = null;
    let currentPriceTimestamp = null;
    
    if (Array.isArray(historicalData) && historicalData.length > 0) {
      const latestCandle = historicalData[historicalData.length - 1];
      currentPrice = latestCandle.close || latestCandle.price;
      currentPriceTimestamp = latestCandle.timestamp || latestCandle.time || new Date().toISOString();
      
      logStep("✅ CURRENT PRICE FROM LATEST DATA", { 
        currentPrice, 
        currentPriceTimestamp,
        latestCandleIndex: historicalData.length - 1
      });
    }

    logStep("🎯 SENDING TO AI FOR ANALYSIS", { 
      historicalDataPoints: dataPointCount, 
      historicalDataLength: dataText.length,
      currentPrice: currentPrice,
      analysisType: `${mappedTimeframe} bars with latest price context and formatted timestamps`
    });

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      logStep("ERROR: OpenRouter API key missing");
      return new Response(JSON.stringify({ 
        error: "AI analysis service not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Get timeframe label for the prompt
    const timeframeLabels: Record<string, string> = {
      'm1': 'M1',
      'm15': 'M15',
      'm30': 'M30',
      'h1': 'H1',
      'h4': 'H4',
      'd1': 'D1',
      'w1': 'W1'
    };

    const timeframeLabel = timeframeLabels[mappedTimeframe] || timeframe;

    // Create the professional forex trading analysis prompt
    const systemPrompt = `You are a professional forex trader who specializes in technical price action analysis on any timeframe or pair.

You will be given:

A forex pair: ${currencyPair}

A timeframe: ${timeframeLabel} (can be M15, M30, H1, H4, D1, or Weekly)

The latest current_price (from the most recent candle): ${currentPrice || 'Not available'}

Historical OHLCV data based on the selected timeframe
(Note: All data is in UTC. Candle format = timestamp,open,high,low,close,volume)

🎯 Your goal:
Analyze the market using clean price action techniques (no indicators), and return only reliable trade setups that fulfill all of the following rules:

🚦 Setup Requirements:
Setup must be in the direction of a clean trend or a valid reversal pattern

Trade must still be valid at current_price
→ If price has moved too far (past TP or SL): Reject the setup

Minimum Risk-Reward Ratio: 1:1.5 (ideally ≥ 1:2)

Setup must be based on at least 2 technical confluences
(e.g., break-retest + structure, or support + candle rejection)

📌 Output Format:
Pair & Timeframe Analyzed:

Example: ${currencyPair} (${timeframeLabel})

Market Summary:

Trend direction (bullish, bearish, or range-bound)

Structure overview (impulsive, corrective, consolidation)

Buyer vs seller strength

Key Support & Resistance Zones (based on historical price structure only):

Price + time reference

Description of how price reacted to that zone

Valid Trade Setup (if any):

Entry Zone: Price + explanation

Stop Loss: Price + reason (beyond invalidation zone)

Take Profit: Logical target

R:R Ratio (minimum 1:1.5)

Is current_price inside entry zone? → Yes / No

Final Status:

"✅ Setup is VALID for execution"

or

"❌ Setup is NO LONGER VALID because price has moved too far"

Short-Term Forecast (based on timeframe):

Expectation for next few candles (e.g. 4–6 H1 candles)

Watch zones / caution levels

⚠ If no high-quality setup:
Return the following:

"No high-probability trade setup detected on ${currencyPair} (${timeframeLabel}) based on current structure and price."

📌 Rules:
❌ Do not suggest a trade if price has already broken past the target

✅ Use only candle structure, price action, and volume behavior

❌ Do not use RSI, MACD, MA, or any other indicator

✅ Output must reflect real-world trading logic and must be actionable at current_price`;

    const userPrompt = `Analyze this ${currencyPair} ${timeframeLabel} data (${dataPointCount} data points from ${fromDate} to ${toDate}):

Current Price: ${currentPrice || 'Not available'}

Historical Data:
${dataText}

Provide your professional forex trading analysis following the required format.`;

    logStep("Sending request to OpenRouter AI", { 
      hasCurrentPrice: !!currentPrice,
      currentPrice: currentPrice,
      dataPoints: dataPointCount
    });

    const aiController = new AbortController();
    const aiTimeoutId = setTimeout(() => aiController.abort(), 45000); // 45 second timeout for AI

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
      return new Response(JSON.stringify({ 
        error: `AI analysis failed: ${aiError.message}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("OpenRouter API error", { status: aiResponse.status, error: errorText });
      return new Response(JSON.stringify({ 
        error: `AI service error: ${aiResponse.status} - ${errorText}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content;

    if (!analysis) {
      logStep("ERROR: No analysis content received");
      return new Response(JSON.stringify({ 
        error: "No analysis content received from AI" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    // Check if response was truncated due to token limits
    const finishReason = aiData.choices?.[0]?.finish_reason;
    if (finishReason === 'length') {
      logStep("Warning: Analysis was truncated due to token limit", { 
        finishReason, 
        analysisLength: analysis.length 
      });
    }

    logStep("🎉 AI ANALYSIS COMPLETED SUCCESSFULLY", { 
      analysisLength: analysis.length,
      finishReason: finishReason,
      currentPrice: currentPrice,
      hasPriceData: !!currentPrice,
      dataPointCount: dataPointCount
    });

    // Increment deep analysis usage
    try {
      const { error: incrementError } = await supabaseClient
        .rpc('increment_deep_analysis_usage', { 
          p_user_id: user.id, 
          p_email: user.email 
        });

      if (incrementError) {
        logStep("Warning: Error incrementing usage", incrementError);
      }
    } catch (error) {
      logStep("Warning: Failed to increment usage", error);
    }

    // Store the analysis result with proper pair name formatting and current price info
    const analysisData = {
      type: 'deep_historical',
      analysis_type: 'professional_price_action',
      currency_pair: currencyPair,
      timeframe: mappedTimeframe,
      date_range: `${fromDate} to ${toDate}`,
      analysis: analysis,
      data_points: dataPointCount,
      current_price: currentPrice,
      current_price_timestamp: currentPriceTimestamp,
      has_current_price: !!currentPrice,
      created_at: new Date().toISOString(),
      // Add these fields for proper display in history
      pairName: currencyPair,
      marketAnalysis: analysis,
      overallSentiment: 'Price Action Analysis',
      trendDirection: 'analyzed',
      truncated: finishReason === 'length'
    };

    let storedAnalysis = null;
    try {
      const { data, error: storeError } = await supabaseClient
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
      } else {
        storedAnalysis = data;
      }
    } catch (error) {
      logStep("Warning: Failed to store analysis", error);
    }

    logStep("🏁 DEEP HISTORICAL ANALYSIS COMPLETED", { 
      historicalDataPoints: dataPointCount,
      hasCurrentPrice: !!currentPrice,
      currentPrice: currentPrice,
      storedAnalysisId: storedAnalysis?.id
    });

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData,
      analysis_id: storedAnalysis?.id,
      has_current_price: !!currentPrice,
      current_price: currentPrice,
      data_points: dataPointCount,
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
