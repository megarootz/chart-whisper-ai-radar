
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, logStep, timeframeMapping, timeframeLabels } from './utils.ts';
import { fetchCurrentPrice, fetchHistoricalData, convertDataToText } from './data-fetcher.ts';
import { createAnalysisPrompt, callOpenRouterAI } from './ai-analyzer.ts';
import type { AnalysisRequest, AnalysisData } from './types.ts';

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

    const requestBody: AnalysisRequest = await req.json();
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

    const mappedTimeframe = timeframeMapping[timeframe] || timeframe.toLowerCase();
    logStep("Timeframe mapping", { original: timeframe, mapped: mappedTimeframe });

    // Fetch current price
    const { price: currentPrice, timestamp: currentPriceTimestamp } = await fetchCurrentPrice(currencyPair);

    // Fetch historical data
    const historicalData = await fetchHistoricalData(currencyPair, mappedTimeframe, fromDate, toDate);

    // Validate historical data
    if (!historicalData || historicalData.length === 0) {
      logStep("ERROR: No historical data received");
      throw new Error("No historical data available for the selected parameters. Please try different date range or timeframe.");
    }

    const dataPointCount = historicalData.length;
    logStep("✅ DATA VALIDATION COMPLETE", { 
      historicalDataPoints: dataPointCount,
      hasCurrentPrice: !!currentPrice,
      currentPrice: currentPrice,
      dataType: `${dataPointCount} ${mappedTimeframe} bars/candles`
    });

    // Convert historical data to text format for AI analysis WITH FORMATTED TIMESTAMPS
    const dataText = convertDataToText(historicalData);

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
    const timeframeLabel = timeframeLabels[mappedTimeframe] || timeframe;

    // Create the professional forex trading analysis prompt
    const { systemPrompt, userPrompt } = createAnalysisPrompt(currencyPair, timeframeLabel, currentPrice);
    const userPromptText = userPrompt(dataText, dataPointCount, fromDate, toDate);

    const { analysis, finishReason } = await callOpenRouterAI(systemPrompt, userPromptText, openRouterApiKey);

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
    const analysisData: AnalysisData = {
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
