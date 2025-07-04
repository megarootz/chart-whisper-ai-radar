
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HistoricalDataPoint {
  timestamp?: string;
  date?: string;
  time?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  price?: number;
}

serve(async (req) => {
  console.log("🚀 Deep Historical Analysis function started");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Environment Variables Check
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    
    console.log("🔍 Environment check:", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey, 
      hasOpenRouterKey: !!openRouterApiKey 
    });
    
    if (!supabaseUrl || !supabaseServiceKey || !openRouterApiKey) {
      console.error("❌ Missing environment variables");
      return new Response(JSON.stringify({ 
        error: "Server configuration error - missing environment variables",
        details: {
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          hasOpenRouterKey: !!openRouterApiKey
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 2. Initialize Supabase Client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    console.log("✅ Supabase client initialized");

    // 3. Authentication Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header provided");
      return new Response(JSON.stringify({ 
        error: "Authentication required - no authorization header" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("🔐 Attempting to authenticate user with token length:", token.length);
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("❌ Authentication failed:", userError?.message);
      return new Response(JSON.stringify({ 
        error: "Authentication failed",
        details: userError?.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log("✅ User authenticated:", userData.user.id);

    // 4. Parse and Validate Request Body
    let requestBody;
    try {
      const requestText = await req.text();
      console.log("📥 Request body received, length:", requestText.length);
      requestBody = JSON.parse(requestText);
    } catch (error) {
      console.error("❌ Invalid JSON in request body:", error);
      return new Response(JSON.stringify({ 
        error: "Invalid request format - could not parse JSON",
        details: error.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { currencyPair, timeframe, fromDate, toDate } = requestBody;
    console.log("📊 Request parameters:", { currencyPair, timeframe, fromDate, toDate });

    if (!currencyPair || !timeframe || !fromDate || !toDate) {
      console.error("❌ Missing required parameters");
      return new Response(JSON.stringify({ 
        error: "Missing required parameters",
        required: ["currencyPair", "timeframe", "fromDate", "toDate"],
        received: { currencyPair, timeframe, fromDate, toDate }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 5. Check Usage Limits
    console.log("🔍 Checking usage limits for user:", userData.user.id);
    try {
      const { data: usageData, error: usageError } = await supabaseClient
        .rpc('check_usage_limits', { p_user_id: userData.user.id });

      if (usageError) {
        console.error("❌ Usage check error:", usageError);
        return new Response(JSON.stringify({ 
          error: "Failed to check usage limits",
          details: usageError.message
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      console.log("📈 Usage data:", usageData);

      if (!usageData?.can_deep_analyze) {
        console.log("❌ Deep analysis limit reached for user:", userData.user.id);
        return new Response(JSON.stringify({ 
          error: "Deep analysis limit reached",
          usage: usageData
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        });
      }

      console.log("✅ Usage limits check passed");
    } catch (error) {
      console.error("❌ Error checking usage limits:", error);
      return new Response(JSON.stringify({ 
        error: "Failed to check usage limits",
        details: error.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 6. Fetch Historical Data
    console.log("📊 Starting historical data fetch...");
    
    const timeframeMapping: Record<string, string> = {
      'M1': 'm1', 'M15': 'm15', 'M30': 'm30',
      'H1': 'h1', 'H4': 'h4', 'D1': 'd1', 'W1': 'w1'
    };
    
    const mappedTimeframe = timeframeMapping[timeframe] || timeframe.toLowerCase();
    const dataUrl = `https://duka-aa28.onrender.com/historical?instrument=${currencyPair.toLowerCase()}&from=${fromDate}&to=${toDate}&timeframe=${mappedTimeframe}&format=json`;
    
    console.log("🌐 Data URL:", dataUrl);

    let historicalData: HistoricalDataPoint[] = [];
    
    try {
      console.log("⏳ Fetching historical data...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("⏰ Data fetch timeout triggered");
        controller.abort();
      }, 30000); // 30 second timeout

      const dataResponse = await fetch(dataUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ForexRadar7-HistoricalData/1.0',
          'Accept': 'application/json, text/csv, text/plain',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      console.log("📥 Data response status:", dataResponse.status);

      if (!dataResponse.ok) {
        console.error("❌ Data API error:", dataResponse.status, dataResponse.statusText);
        return new Response(JSON.stringify({ 
          error: "Failed to fetch historical data",
          details: `Data API returned ${dataResponse.status}: ${dataResponse.statusText}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const responseText = await dataResponse.text();
      console.log("📊 Raw response received, length:", responseText.length);
      console.log("📊 Response preview:", responseText.substring(0, 200));

      if (!responseText?.trim()) {
        console.error("❌ Empty response from data API");
        return new Response(JSON.stringify({ 
          error: "Empty response from data API"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      // Try JSON parsing first
      try {
        historicalData = JSON.parse(responseText);
        console.log("✅ JSON parsing successful, data points:", Array.isArray(historicalData) ? historicalData.length : 1);
      } catch (jsonError) {
        console.log("⚠️ JSON parsing failed, trying CSV parsing...");
        // Fallback to CSV parsing
        const lines = responseText.trim().split('\n');
        if (lines.length > 1) {
          historicalData = lines.slice(1)
            .map((line, index) => {
              try {
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
              } catch (parseError) {
                console.error(`❌ Error parsing line ${index}:`, parseError);
                return null;
              }
            })
            .filter((item): item is HistoricalDataPoint => item !== null);
          
          console.log("✅ CSV parsing successful, data points:", historicalData.length);
        } else {
          console.error("❌ Unable to parse data as JSON or CSV");
          return new Response(JSON.stringify({ 
            error: "Unable to parse historical data",
            details: "Data is neither valid JSON nor CSV format"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 502,
          });
        }
      }

      if (!Array.isArray(historicalData) || historicalData.length === 0) {
        console.error("❌ No valid historical data available");
        return new Response(JSON.stringify({ 
          error: "No valid historical data available"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

    } catch (fetchError) {
      console.error("❌ Historical data fetch failed:", fetchError);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch historical data",
        details: fetchError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    console.log("✅ Historical data processed successfully:", historicalData.length, "data points");

    // 7. Process Data for AI Analysis
    const latestCandle = historicalData[historicalData.length - 1];
    const currentPrice = latestCandle?.close || latestCandle?.price || null;
    console.log("💰 Current price:", currentPrice);

    // Limit data for AI analysis (last 200 candles for better analysis)
    const dataToAnalyze = historicalData.slice(-200);
    console.log("🤖 Data points for AI analysis:", dataToAnalyze.length);

    // Create a more concise data format for AI
    const dataText = dataToAnalyze.map((candle, index) => {
      const timestamp = candle.timestamp || candle.date || candle.time || `Point${index}`;
      return `${timestamp}: O${candle.open} H${candle.high} L${candle.low} C${candle.close} V${candle.volume || 0}`;
    }).join('\n');

    // 8. AI Analysis
    console.log("🤖 Starting AI analysis...");
    
    const systemPrompt = `You are a professional forex trader analyzing ${currencyPair} on ${timeframe} timeframe. 

Provide a structured analysis with:

**TREND ANALYSIS**
- Current trend direction (Bullish/Bearish/Sideways)
- Key trend characteristics

**SUPPORT & RESISTANCE LEVELS**
- Primary support level with reason
- Primary resistance level with reason

**TRADING SCENARIOS**
BULLISH Setup:
- Entry condition
- Entry zone
- Stop loss level and reason
- Take profit targets

BEARISH Setup:
- Entry condition  
- Entry zone
- Stop loss level and reason
- Take profit targets

**MARKET CONTEXT**
- Key observations
- Risk factors

Keep analysis concise and professional. Current price: ${currentPrice || 'Latest close'}`;

    const userPrompt = `Analyze ${currencyPair} ${timeframe} data (${dataToAnalyze.length} candles from ${fromDate} to ${toDate}):

Historical Data Format (timestamp/point: Open High Low Close Volume):
${dataText.substring(0, 8000)}${dataText.length > 8000 ? '\n[Data truncated for analysis]' : ''}

Provide professional trading analysis following the structured format.`;

    let analysisResult: string;

    try {
      console.log("🔗 Making AI API request...");
      const aiController = new AbortController();
      const aiTimeoutId = setTimeout(() => {
        console.log("⏰ AI analysis timeout triggered");
        aiController.abort();
      }, 45000); // 45 second timeout

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
          max_tokens: 2000
        }),
        signal: aiController.signal
      });

      clearTimeout(aiTimeoutId);
      console.log("🤖 AI response status:", aiResponse.status);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("❌ AI API error:", aiResponse.status, errorText);
        return new Response(JSON.stringify({ 
          error: "AI analysis failed",
          details: `AI API returned ${aiResponse.status}: ${aiResponse.statusText}`,
          response: errorText
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const aiData = await aiResponse.json();
      analysisResult = aiData.choices?.[0]?.message?.content;

      if (!analysisResult) {
        console.error("❌ No analysis content received from AI");
        return new Response(JSON.stringify({ 
          error: "No analysis content received from AI",
          response: aiData
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      console.log("✅ AI analysis completed, length:", analysisResult.length);

    } catch (aiError) {
      console.error("❌ AI analysis failed:", aiError);
      return new Response(JSON.stringify({ 
        error: "AI analysis failed",
        details: aiError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    // 9. Update Usage Count
    console.log("📊 Updating usage count...");
    try {
      await supabaseClient.rpc('increment_deep_analysis_usage', { 
        p_user_id: userData.user.id, 
        p_email: userData.user.email || ''
      });
      console.log("✅ Usage count updated");
    } catch (usageUpdateError) {
      console.error("❌ Failed to update usage count:", usageUpdateError);
      // Don't fail the request if usage update fails
    }

    // 10. Store Analysis Results
    console.log("💾 Storing analysis results...");
    
    const analysisData = {
      type: 'deep_historical',
      analysis_type: 'structured_price_action',
      currency_pair: currencyPair,
      timeframe: mappedTimeframe,
      date_range: `${fromDate} to ${toDate}`,
      analysis: analysisResult,
      data_points: historicalData.length,
      current_price: currentPrice,
      has_current_price: !!currentPrice,
      created_at: new Date().toISOString(),
      pairName: currencyPair,
      marketAnalysis: analysisResult,
      overallSentiment: 'Professional Trading Analysis',
      trendDirection: 'analyzed'
    };

    try {
      const { error: insertError } = await supabaseClient
        .from('chart_analyses')
        .insert({
          user_id: userData.user.id,
          pair_name: currencyPair,
          timeframe: mappedTimeframe,
          analysis_data: analysisData
        });

      if (insertError) {
        console.error("❌ Failed to store analysis:", insertError);
        // Don't fail the request if storage fails
      } else {
        console.log("✅ Analysis stored successfully");
      }
    } catch (storageError) {
      console.error("❌ Storage error:", storageError);
      // Don't fail the request if storage fails
    }

    // 11. Return Success Response
    console.log("🎉 Deep historical analysis completed successfully");

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData,
      has_current_price: !!currentPrice,
      current_price: currentPrice,
      data_points: historicalData.length,
      message: "Deep historical analysis completed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 CRITICAL ERROR in deep historical analysis:", error);
    
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
