
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [DEEP-ANALYSIS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("🚀 Function started");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("❌ Missing Supabase environment variables");
      return new Response(JSON.stringify({ 
        error: "Server configuration error" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    logStep("✅ Supabase client initialized");

    // Check authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("❌ No authorization header");
      return new Response(JSON.stringify({ 
        error: "Unauthorized" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("❌ Authentication failed", userError);
      return new Response(JSON.stringify({ 
        error: "Authentication failed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    logStep("✅ User authenticated", { userId: user.id });

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      logStep("📨 Request body received", { length: bodyText.length });
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error("Empty request body");
      }
      
      requestBody = JSON.parse(bodyText);
      logStep("✅ Request body parsed", requestBody);
    } catch (parseError) {
      logStep("❌ Failed to parse request body", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid request body" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { currencyPair, timeframe, fromDate, toDate } = requestBody;

    // Validate required parameters
    if (!currencyPair || !timeframe || !fromDate || !toDate) {
      logStep("❌ Missing required parameters", { currencyPair, timeframe, fromDate, toDate });
      return new Response(JSON.stringify({ 
        error: "Missing required parameters" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("✅ Parameters validated", { currencyPair, timeframe, fromDate, toDate });

    // Check usage limits
    try {
      const { data: usageData, error: usageError } = await supabaseClient
        .rpc('check_usage_limits', { p_user_id: user.id });

      if (usageError) {
        logStep("❌ Usage check failed", usageError);
        return new Response(JSON.stringify({ 
          error: "Usage check failed" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      logStep("✅ Usage data retrieved", usageData);

      if (!usageData?.can_deep_analyze) {
        logStep("❌ Deep analysis limit reached");
        return new Response(JSON.stringify({ 
          error: "Deep analysis limit reached" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        });
      }
    } catch (error) {
      logStep("❌ Error checking usage limits", error);
      return new Response(JSON.stringify({ 
        error: "Failed to check usage limits" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Map timeframes for the API
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
    logStep("✅ Timeframe mapped", { original: timeframe, mapped: mappedTimeframe });

    // Fetch historical data
    const dataUrl = `https://duka-aa28.onrender.com/historical?instrument=${currencyPair.toLowerCase()}&from=${fromDate}&to=${toDate}&timeframe=${mappedTimeframe}&format=json`;
    logStep("📊 Fetching historical data", { url: dataUrl });

    let historicalData;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const dataResponse = await fetch(dataUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ForexRadar7-HistoricalData/1.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);

      if (!dataResponse.ok) {
        logStep("❌ Data API error", { 
          status: dataResponse.status, 
          statusText: dataResponse.statusText 
        });
        return new Response(JSON.stringify({ 
          error: "Failed to fetch historical data" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const responseText = await dataResponse.text();
      logStep("📈 Historical data received", { length: responseText.length });

      if (!responseText?.trim()) {
        logStep("❌ Empty response from data API");
        return new Response(JSON.stringify({ 
          error: "No historical data available" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      // Parse historical data
      try {
        historicalData = JSON.parse(responseText);
        logStep("✅ Historical data parsed", { 
          isArray: Array.isArray(historicalData),
          length: Array.isArray(historicalData) ? historicalData.length : 'not array'
        });
      } catch (jsonError) {
        logStep("⚠️ JSON parse failed, trying CSV", jsonError);
        
        // Try parsing as CSV
        if (responseText.includes(',') && responseText.includes('\n')) {
          const lines = responseText.trim().split('\n');
          if (lines.length > 1) {
            historicalData = lines.slice(1).map(line => {
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
            
            logStep("✅ Historical data parsed as CSV", { length: historicalData.length });
          }
        }
      }

      if (!historicalData || (Array.isArray(historicalData) && historicalData.length === 0)) {
        logStep("❌ No valid historical data");
        return new Response(JSON.stringify({ 
          error: "No valid historical data available" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

    } catch (fetchError) {
      logStep("❌ Failed to fetch historical data", fetchError);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch historical data" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    const dataPointCount = Array.isArray(historicalData) ? historicalData.length : 1;
    logStep("✅ Data validation complete", { dataPoints: dataPointCount });

    // Get current price from latest data
    let currentPrice = null;
    if (Array.isArray(historicalData) && historicalData.length > 0) {
      const latestCandle = historicalData[historicalData.length - 1];
      currentPrice = latestCandle.close || latestCandle.price;
      logStep("✅ Current price extracted", { currentPrice });
    }

    // Prepare data for AI analysis
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
    }

    logStep("🎯 Preparing AI analysis", { 
      dataPoints: dataPointCount,
      dataLength: dataText.length 
    });

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      logStep("❌ OpenRouter API key missing");
      return new Response(JSON.stringify({ 
        error: "AI analysis service not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Create AI prompt
    const systemPrompt = `You are a professional price action trader. Analyze ${currencyPair} on ${timeframe} using ONLY OHLC historical data. Follow these rules:

**1️⃣ Market Structure**  
- Identify trend: 📈 Bullish (higher highs/lows), 📉 Bearish (lower highs/lows), or ↔️ Range-bound  
- Recent price behavior: Impulsive moves vs. corrections  
- Key characteristics: Candlestick patterns, momentum shifts  

**2️⃣ Critical Levels**  
- Support zones (price floors where buyers appear):  
  🛡️ S1: ______ (Reason: ______)  
  🛡️ S2: ______ (Reason: ______)  
- Resistance zones (price ceilings where sellers appear):  
  🚧 R1: ______ (Reason: ______)  
  🚧 R2: ______ (Reason: ______)  

**3️⃣ Two Trading Scenarios (MUST PROVIDE BOTH)**  
🐂 **BULLISH Scenario**  
- ✅ Trigger: ______  
- 🎯 Entry zone: ______  
- 🛑 Stop Loss: ______ (Reason: ______)  
- 🏹 TP1: ______ | TP2: ______  
- 📊 Probability: High/Medium/Low (Reason: ______)  

🐻 **BEARISH Scenario**  
- ✅ Trigger: ______  
- 🎯 Entry zone: ______  
- 🛑 Stop Loss: ______ (Reason: ______)  
- 🎯 TP1: ______ | TP2: ______  
- 📊 Probability: High/Medium/Low (Reason: ______)  

**4️⃣ Market Context**  
- 💡 Key observation: ______  
- ⚠️ Risk note: ______  

**Output Format STRICTLY:**  
[TREND] [Emoji] <1-sentence summary>  
[KEY LEVELS]  
<Support/Resistance as above>  
[BULLISH]  
<Full scenario details>  
[BEARISH]  
<Full scenario details>  
[NOTE] <Context & risk>

Current Price: ${currentPrice || 'Latest close from data'}
Use this price as reference for your analysis.`;

    const userPrompt = `Analyze this ${currencyPair} ${timeframe} data (${dataPointCount} data points from ${fromDate} to ${toDate}):

Current Price: ${currentPrice || 'Not available'}

Historical Data (timestamp,open,high,low,close,volume):
${dataText}

Provide your professional forex trading analysis following the required format exactly.`;

    // Send to AI
    try {
      const aiController = new AbortController();
      const aiTimeoutId = setTimeout(() => aiController.abort(), 45000);

      const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://forexradar7.com",
          "X-Title": "ForexRadar7 Deep Historical Analysis"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
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

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        logStep("❌ AI service error", { status: aiResponse.status, error: errorText });
        return new Response(JSON.stringify({ 
          error: "AI analysis failed" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const aiData = await aiResponse.json();
      const analysis = aiData.choices?.[0]?.message?.content;

      if (!analysis) {
        logStep("❌ No analysis content received");
        return new Response(JSON.stringify({ 
          error: "No analysis content received" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      logStep("🎉 AI analysis completed", { analysisLength: analysis.length });

      // Increment usage
      try {
        await supabaseClient.rpc('increment_deep_analysis_usage', { 
          p_user_id: user.id, 
          p_email: user.email || ''
        });
        logStep("✅ Usage incremented");
      } catch (usageError) {
        logStep("⚠️ Failed to increment usage", usageError);
      }

      // Store analysis
      const analysisData = {
        type: 'deep_historical',
        analysis_type: 'structured_price_action',
        currency_pair: currencyPair,
        timeframe: mappedTimeframe,
        date_range: `${fromDate} to ${toDate}`,
        analysis: analysis,
        data_points: dataPointCount,
        current_price: currentPrice,
        has_current_price: !!currentPrice,
        created_at: new Date().toISOString(),
        pairName: currencyPair,
        marketAnalysis: analysis,
        overallSentiment: 'Structured Price Action Analysis',
        trendDirection: 'analyzed'
      };

      try {
        const { data: storedAnalysis } = await supabaseClient
          .from('chart_analyses')
          .insert({
            user_id: user.id,
            pair_name: currencyPair,
            timeframe: mappedTimeframe,
            analysis_data: analysisData
          })
          .select()
          .single();

        logStep("✅ Analysis stored", { id: storedAnalysis?.id });
      } catch (storeError) {
        logStep("⚠️ Failed to store analysis", storeError);
      }

      logStep("🏁 Function completed successfully");

      return new Response(JSON.stringify({
        success: true,
        analysis: analysisData,
        has_current_price: !!currentPrice,
        current_price: currentPrice,
        data_points: dataPointCount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (aiError) {
      logStep("❌ AI request failed", aiError);
      return new Response(JSON.stringify({ 
        error: "AI analysis failed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("❌ CRITICAL ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
