
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

    // STEP 1: Fetch current tick price (single latest tick for current price reference)
    let currentPrice = null;
    let currentPriceTimestamp = null;
    
    try {
      // Use historical endpoint with tick timeframe to get latest price
      const todayDate = new Date().toISOString().split('T')[0];
      const tickUrl = `https://duka-qr9j.onrender.com/historical?instrument=${currencyPair.toLowerCase()}&from=${todayDate}&to=${todayDate}&timeframe=tick&format=json&limit=1`;
      logStep("🔍 FETCHING CURRENT PRICE (TICK DATA)", { 
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
        logStep("Tick response received", { 
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

    // STEP 2: Fetch historical BAR data based on selected timeframe
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

    // Convert historical data to text format for AI analysis
    let dataText = '';
    if (Array.isArray(historicalData)) {
      dataText = historicalData.map(candle => {
        const timestamp = candle.timestamp || candle.date || candle.time || '';
        const open = candle.open || '';
        const high = candle.high || '';
        const low = candle.low || '';
        const close = candle.close || '';
        const volume = candle.volume || '';
        return `${timestamp},${open},${high},${low},${close},${volume}`;
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
      analysisType: `${mappedTimeframe} bars with current price context`
    });

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      logStep("ERROR: OpenRouter API key missing");
      throw new Error("AI analysis service not configured");
    }

    // Get timeframe label for the prompt
    const timeframeLabels: Record<string, string> = {
      'm1': '1-minute',
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
      `\n\n🎯 **CRITICAL CURRENT MARKET CONTEXT:**
      The LIVE current market price for ${currencyPair} is ${currentPrice} as of ${currentPriceTimestamp || 'latest available time'}.
      
      This current tick price is ESSENTIAL for your analysis. Please:
      - Compare ALL historical patterns and levels against this current price of ${currentPrice}
      - Determine if any identified setups are still valid or have already been triggered
      - Assess how close the current price is to key support/resistance levels
      - Provide actionable recommendations based on where price currently stands at ${currentPrice}
      - If you identify potential entry points, state clearly whether they are above or below the current price of ${currentPrice}
      - Evaluate if any patterns or setups have already played out given the current price position` : 
      '\n\n⚠️ **NOTE:** Current live price data is not available, so analysis is based solely on historical data up to the latest candle.';

    const systemPrompt = `You are a highly experienced forex trader and technical analyst. You will analyze historical price data for ${currencyPair} on the ${timeframeLabel} timeframe from ${fromDate} to ${toDate}.

The data contains ${dataPointCount} data points in CSV format: timestamp,open,high,low,close,volume.${currentPriceContext}

**ANALYSIS STRUCTURE REQUIRED:**

### 1. Current Market Trend
- Identify the prevailing trend (bullish/bearish/sideways)
- Assess trend strength and likely duration
- Provide clear justification

### 2. Key Support and Resistance Levels
- Identify 2-3 most significant support levels
- Identify 2-3 most significant resistance levels
${currentPrice ? `- Compare these levels to the current price of ${currentPrice}` : ''}

### 3. Technical Chart Patterns
- Identify any significant patterns (Head & Shoulders, Triangles, Flags, etc.)
- If none found, state clearly "No significant patterns identified"
- Explain implications of any patterns found

### 4. Market Momentum and Volatility Assessment
- Evaluate overbought/oversold conditions
- Assess momentum strength (strong/moderate/weak)
- Determine volatility level (high/normal/low)

### 5. Clear Trading Recommendation
- State: BUY, SELL, or HOLD/WAIT
- Provide specific rationale
- Suggest realistic Take Profit and Stop Loss levels
${currentPrice ? `- Clearly state if recommendations are valid given current price of ${currentPrice}` : ''}
- If no clear setup exists, recommend waiting

${currentPrice ? '### 6. Current Price Analysis\n- Analyze the current price position relative to your identified levels\n- State if any setups are immediately actionable or if price has moved past key levels' : ''}

**KEEP YOUR ANALYSIS CONCISE, PRACTICAL, AND ACTIONABLE.**`;

    const userPrompt = `Analyze this ${currencyPair} ${timeframeLabel} data (${dataPointCount} data points from ${fromDate} to ${toDate}):

${dataText}

Provide your comprehensive technical analysis following the required structure.`;

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
      analysis_type: 'comprehensive_technical',
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
