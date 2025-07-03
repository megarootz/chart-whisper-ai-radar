
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

    // Map timeframes to match Render API expectations
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

    // STEP 1: Fetch current price using /latest-tick endpoint
    let currentPrice = null;
    let currentPriceTimestamp = null;
    
    try {
      const tickUrl = `https://duka-qr9j.onrender.com/latest-tick?instrument=${currencyPair.toLowerCase()}&format=json`;
      logStep("🎯 FETCHING CURRENT PRICE", { 
        url: tickUrl,
        purpose: "Getting latest tick for current price reference"
      });

      const tickController = new AbortController();
      const tickTimeoutId = setTimeout(() => tickController.abort(), 15000);

      const tickResponse = await fetch(tickUrl, {
        signal: tickController.signal,
        headers: {
          'User-Agent': 'ForexRadar7-CurrentPrice/1.0',
          'Accept': 'application/json'
        }
      });
      clearTimeout(tickTimeoutId);

      if (tickResponse.ok) {
        const tickResponseText = await tickResponse.text();
        logStep("Current price response received", { 
          length: tickResponseText.length,
          firstChars: tickResponseText.substring(0, 200)
        });

        let tickData;
        try {
          tickData = JSON.parse(tickResponseText);
        } catch (parseError) {
          logStep("JSON parse failed for tick data, trying CSV", { parseError: parseError.message });
          
          // Try to parse as CSV if JSON fails
          if (tickResponseText.includes(',') && tickResponseText.includes('\n')) {
            const lines = tickResponseText.trim().split('\n');
            if (lines.length > 1) {
              const parts = lines[1].split(','); // Skip header line
              if (parts.length >= 5) {
                tickData = [{
                  timestamp: parts[0],
                  open: parseFloat(parts[1]),
                  high: parseFloat(parts[2]),
                  low: parseFloat(parts[3]),
                  close: parseFloat(parts[4])
                }];
              }
            }
          }
        }

        if (tickData && Array.isArray(tickData) && tickData.length > 0) {
          const latestTick = tickData[0];
          currentPrice = latestTick.close || latestTick.price || latestTick.bid || latestTick.ask;
          currentPriceTimestamp = latestTick.timestamp || latestTick.time || new Date().toISOString();
          
          logStep("✅ CURRENT PRICE EXTRACTED", { 
            currentPrice, 
            currentPriceTimestamp,
            tickDataLength: tickData.length
          });
        } else {
          logStep("No valid tick data received", { tickData });
        }
      } else {
        logStep("Warning: Could not fetch tick data", { 
          status: tickResponse.status, 
          statusText: tickResponse.statusText 
        });
      }
    } catch (tickError) {
      logStep("Warning: Error fetching tick data", { error: tickError.message });
    }

    // STEP 2: Fetch historical BAR data using /historical endpoint
    const renderUrl = `https://duka-qr9j.onrender.com/historical?instrument=${currencyPair.toLowerCase()}&from=${fromDate}&to=${toDate}&timeframe=${mappedTimeframe}&format=json`;
    logStep("📊 FETCHING HISTORICAL BAR DATA", { 
      url: renderUrl,
      timeframe: mappedTimeframe,
      purpose: "Getting historical bars/candles for analysis"
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let renderResponse;
    let historicalData;
    
    try {
      renderResponse = await fetch(renderUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ForexRadar7-HistoricalBars/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);

      if (!renderResponse.ok) {
        logStep("ERROR: Render API response not OK", { 
          status: renderResponse.status, 
          statusText: renderResponse.statusText 
        });
        throw new Error(`Historical data service error: ${renderResponse.status} - ${renderResponse.statusText}`);
      }

      const responseText = await renderResponse.text();
      logStep("📈 HISTORICAL BAR DATA RECEIVED", { 
        length: responseText.length,
        firstChars: responseText.substring(0, 100)
      });

      // Try to parse as JSON first
      try {
        historicalData = JSON.parse(responseText);
        logStep("Historical bar data parsed as JSON", { 
          isArray: Array.isArray(historicalData),
          length: Array.isArray(historicalData) ? historicalData.length : 'not array'
        });
      } catch (parseError) {
        logStep("JSON parse failed, trying CSV format", { parseError: parseError.message });
        
        // If it's not JSON, try to parse as CSV
        if (responseText.includes(',') && responseText.includes('\n')) {
          const lines = responseText.trim().split('\n');
          if (lines.length > 1) {
            historicalData = lines.slice(1).map((line) => {
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
            
            logStep("Historical bar data parsed as CSV", { 
              totalLines: lines.length,
              validCandles: historicalData.length
            });
          }
        }
        
        if (!historicalData || historicalData.length === 0) {
          throw new Error('Unable to parse historical data response');
        }
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);
      logStep("ERROR: Failed to fetch historical data", { 
        error: fetchError.message,
        url: renderUrl 
      });
      throw new Error(`Failed to fetch historical data: ${fetchError.message}`);
    }

    // Validate historical data
    if (!historicalData || (Array.isArray(historicalData) && historicalData.length === 0)) {
      logStep("ERROR: No historical data received");
      throw new Error("No historical data available for the selected parameters. Please try different date range or timeframe.");
    }

    const dataPointCount = Array.isArray(historicalData) ? historicalData.length : 1;
    logStep("✅ DATA VALIDATION COMPLETE", { 
      historicalDataPoints: dataPointCount,
      hasCurrentPrice: !!currentPrice,
      currentPrice: currentPrice,
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
      throw new Error("Insufficient historical data for analysis. Please try different parameters.");
    }

    logStep("🎯 SENDING TO AI FOR ANALYSIS", { 
      historicalDataPoints: dataPointCount, 
      historicalDataLength: dataText.length,
      currentPrice: currentPrice,
      analysisType: `${mappedTimeframe} bars with current price context and formatted timestamps`
    });

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      logStep("ERROR: OpenRouter API key missing");
      throw new Error("AI analysis service not configured");
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

The latest current_price (the live tick price): ${currentPrice || 'Not available'}

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
    const aiTimeoutId = setTimeout(() => aiController.abort(), 60000);

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

    logStep("🎉 AI ANALYSIS COMPLETED SUCCESSFULLY", { 
      analysisLength: analysis.length,
      finishReason: finishReason,
      currentPrice: currentPrice,
      hasPriceData: !!currentPrice,
      dataPointCount: dataPointCount
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
