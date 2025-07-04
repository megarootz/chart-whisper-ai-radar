
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Deep analysis function started");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey || !openRouterApiKey) {
      console.error("❌ Missing environment variables");
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

    // Check authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header");
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
      console.error("❌ Authentication failed:", userError);
      return new Response(JSON.stringify({ 
        error: "Authentication failed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log("✅ User authenticated:", userData.user.id);

    // Parse request body
    const requestBody = await req.json();
    const { currencyPair, timeframe, fromDate, toDate } = requestBody;

    if (!currencyPair || !timeframe || !fromDate || !toDate) {
      console.error("❌ Missing required parameters");
      return new Response(JSON.stringify({ 
        error: "Missing required parameters" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("✅ Parameters:", { currencyPair, timeframe, fromDate, toDate });

    // Check usage limits
    const { data: usageData, error: usageError } = await supabaseClient
      .rpc('check_usage_limits', { p_user_id: userData.user.id });

    if (usageError || !usageData?.can_deep_analyze) {
      console.error("❌ Usage limit reached");
      return new Response(JSON.stringify({ 
        error: "Deep analysis limit reached" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
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

    // Fetch historical data with timeout
    const dataUrl = `https://duka-aa28.onrender.com/historical?instrument=${currencyPair.toLowerCase()}&from=${fromDate}&to=${toDate}&timeframe=${mappedTimeframe}&format=json`;
    console.log("📊 Fetching data from:", dataUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    let historicalData;
    try {
      const dataResponse = await fetch(dataUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ForexRadar7-HistoricalData/1.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);

      if (!dataResponse.ok) {
        throw new Error(`Data API error: ${dataResponse.status}`);
      }

      const responseText = await dataResponse.text();
      if (!responseText?.trim()) {
        throw new Error("Empty response from data API");
      }

      // Try to parse as JSON first
      try {
        historicalData = JSON.parse(responseText);
      } catch {
        // If JSON parsing fails, try CSV parsing
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
        }
      }

      if (!historicalData || (Array.isArray(historicalData) && historicalData.length === 0)) {
        throw new Error("No valid historical data available");
      }

    } catch (fetchError) {
      console.error("❌ Failed to fetch historical data:", fetchError);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch historical data" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    const dataPointCount = Array.isArray(historicalData) ? historicalData.length : 1;
    console.log("✅ Data points:", dataPointCount);

    // Get current price
    let currentPrice = null;
    if (Array.isArray(historicalData) && historicalData.length > 0) {
      const latestCandle = historicalData[historicalData.length - 1];
      currentPrice = latestCandle.close || latestCandle.price;
    }

    // Prepare data for AI analysis (limit to last 200 candles for performance)
    const dataToAnalyze = Array.isArray(historicalData) ? historicalData.slice(-200) : [historicalData];
    const dataText = dataToAnalyze.map(candle => {
      const timestamp = candle.timestamp || candle.date || candle.time || '';
      const open = candle.open || '';
      const high = candle.high || '';
      const low = candle.low || '';
      const close = candle.close || '';
      const volume = candle.volume || '';
      return `${timestamp},${open},${high},${low},${close},${volume}`;
    }).join('\n');

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

    const userPrompt = `Analyze this ${currencyPair} ${timeframe} data (${dataToAnalyze.length} data points from ${fromDate} to ${toDate}):

Current Price: ${currentPrice || 'Not available'}

Historical Data (timestamp,open,high,low,close,volume):
${dataText}

Provide your professional forex trading analysis following the required format exactly.`;

    // Send to AI with timeout
    console.log("🤖 Sending to AI...");
    const aiController = new AbortController();
    const aiTimeoutId = setTimeout(() => aiController.abort(), 30000); // 30 second timeout

    try {
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
          max_tokens: 3000
        }),
        signal: aiController.signal
      });

      clearTimeout(aiTimeoutId);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("❌ AI service error:", aiResponse.status, errorText);
        throw new Error("AI analysis failed");
      }

      const aiData = await aiResponse.json();
      const analysis = aiData.choices?.[0]?.message?.content;

      if (!analysis) {
        throw new Error("No analysis content received");
      }

      console.log("🎉 AI analysis completed");

      // Increment usage
      await supabaseClient.rpc('increment_deep_analysis_usage', { 
        p_user_id: userData.user.id, 
        p_email: userData.user.email || ''
      });

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

      // Store in database
      await supabaseClient
        .from('chart_analyses')
        .insert({
          user_id: userData.user.id,
          pair_name: currencyPair,
          timeframe: mappedTimeframe,
          analysis_data: analysisData
        });

      console.log("🏁 Function completed successfully");

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
      clearTimeout(aiTimeoutId);
      console.error("❌ AI request failed:", aiError);
      return new Response(JSON.stringify({ 
        error: "AI analysis failed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error);
    
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
