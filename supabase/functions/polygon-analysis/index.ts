import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface PolygonCandle {
  c: number; // close
  h: number; // high
  l: number; // low
  o: number; // open
  t: number; // timestamp
  v: number; // volume
}

interface TimeframeResult {
  timeframe: string;
  trend: string;
  signal: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rsi: number;
  atr: number;
  analysis: string;
  error?: string;
}

// Timeframe mapping for Polygon.io
const getPolygonTimeframe = (timeframe: string) => {
  const mapping: { [key: string]: { multiplier: number; timespan: string } } = {
    'M15': { multiplier: 15, timespan: 'minute' },
    'H1': { multiplier: 1, timespan: 'hour' },
    'H4': { multiplier: 4, timespan: 'hour' },
    'D1': { multiplier: 1, timespan: 'day' }
  };
  return mapping[timeframe] || { multiplier: 1, timespan: 'hour' };
};

// Calculate date ranges based on timeframe
const getDateRange = (timeframe: string) => {
  const now = new Date();
  let from: Date;
  
  switch (timeframe) {
    case 'M15':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      break;
    case 'H1':
      from = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days
      break;
    case 'H4':
      from = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000); // 120 days
      break;
    case 'D1':
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
      break;
    default:
      from = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days
  }
  
  return { from, to: now };
};

// Fetch data from Polygon.io
const fetchPolygonData = async (symbol: string, timeframe: string): Promise<PolygonCandle[]> => {
  const { multiplier, timespan } = getPolygonTimeframe(timeframe);
  const { from, to } = getDateRange(timeframe);
  
  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];
  
  console.log(`📊 Fetching ${symbol} ${timeframe} data from ${fromStr} to ${toStr}`);
  
  const url = `https://api.polygon.io/v2/aggs/ticker/C:${symbol}/range/${multiplier}/${timespan}/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=50000&apikey=${POLYGON_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok || data.status !== 'OK') {
    console.error(`❌ Polygon API error:`, data);
    throw new Error(`Polygon API error: ${data.error || 'Unknown error'}`);
  }
  
  const candles = data.results || [];
  console.log(`📈 Retrieved ${candles.length} candles for ${timeframe}`);
  
  return candles;
};

// Technical analysis calculations
const calculateSMA = (prices: number[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
};

const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateATR = (candles: PolygonCandle[], period: number = 14): number => {
  if (candles.length < period + 1) return 0;
  
  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].h;
    const low = candles[i].l;
    const prevClose = candles[i - 1].c;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
};

// Perform technical analysis
const performTechnicalAnalysis = (candles: PolygonCandle[]): Omit<TimeframeResult, 'timeframe' | 'analysis'> => {
  if (!candles || candles.length < 20) {
    return {
      trend: 'Insufficient Data',
      signal: 'No Signal',
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      rsi: 50,
      atr: 0
    };
  }

  const closes = candles.map(c => c.c);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate indicators
  const rsi = calculateRSI(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const atr = calculateATR(candles);

  const currentSMA20 = sma20[sma20.length - 1] || currentPrice;
  const currentSMA50 = sma50[sma50.length - 1] || currentPrice;

  // Determine trend
  let trend = 'Sideways';
  if (currentPrice > currentSMA20 && currentSMA20 > currentSMA50) {
    trend = 'Bullish';
  } else if (currentPrice < currentSMA20 && currentSMA20 < currentSMA50) {
    trend = 'Bearish';
  }

  // Generate signals
  let signal = 'Hold';
  if (rsi < 30 && trend === 'Bullish') {
    signal = 'Buy';
  } else if (rsi > 70 && trend === 'Bearish') {
    signal = 'Sell';
  } else if (rsi < 40 && trend === 'Bullish') {
    signal = 'Buy';
  } else if (rsi > 60 && trend === 'Bearish') {
    signal = 'Sell';
  }

  // Calculate stop loss and take profit
  const stopLoss = signal === 'Buy' ? currentPrice - (atr * 2) : currentPrice + (atr * 2);
  const takeProfit = signal === 'Buy' ? currentPrice + (atr * 3) : currentPrice - (atr * 3);

  return {
    trend,
    signal,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    rsi,
    atr
  };
};

// Get AI analysis from Gemini
const getGeminiAnalysis = async (symbol: string, timeframe: string, candles: PolygonCandle[], technicalData: any): Promise<string> => {
  const recentCandles = candles.slice(-50); // Last 50 candles for context
  
  const prompt = `
You are an expert forex trader analyzing the ${symbol} currency pair on the ${timeframe} timeframe.

Recent Price Data (last 50 candles):
${recentCandles.map((c, i) => `${i + 1}. Open: ${c.o}, High: ${c.h}, Low: ${c.l}, Close: ${c.c}, Volume: ${c.v}`).join('\n')}

Technical Analysis Results:
- Current Price: ${technicalData.entryPrice}
- Trend: ${technicalData.trend}
- Signal: ${technicalData.signal}
- RSI: ${technicalData.rsi.toFixed(2)}
- ATR: ${technicalData.atr.toFixed(5)}
- Stop Loss: ${technicalData.stopLoss.toFixed(5)}
- Take Profit: ${technicalData.takeProfit.toFixed(5)}

Please provide a comprehensive analysis that includes:
1. Market sentiment and trend direction
2. Key support and resistance levels
3. Risk assessment and market conditions
4. Trading recommendations with reasoning
5. Important factors to watch

Keep your analysis concise but insightful, focusing on actionable trading insights.
`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      }
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('❌ Gemini API error:', data);
    throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis not available';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!POLYGON_API_KEY) {
      throw new Error('POLYGON_API_KEY environment variable is not set');
    }
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`🔐 Authenticated user: ${user.email}`);

    // Check usage limits
    const { data: usageData, error: usageError } = await supabase
      .rpc('check_usage_limits', { p_user_id: user.id });

    if (usageError) {
      console.error('❌ Usage check error:', usageError);
      throw new Error('Failed to check usage limits');
    }

    if (!usageData.can_deep_analyze) {
      throw new Error(`Deep analysis limit reached. Daily: ${usageData.deep_analysis_daily_count}/${usageData.deep_analysis_daily_limit}, Monthly: ${usageData.deep_analysis_monthly_count}/${usageData.deep_analysis_monthly_limit}`);
    }

    const { symbol, timeframes } = await req.json();

    if (!symbol) {
      throw new Error('Symbol is required');
    }

    const targetTimeframes = timeframes || ['M15', 'H1', 'H4', 'D1'];
    console.log(`🚀 Starting Polygon.io analysis for ${symbol} across ${targetTimeframes.length} timeframes`);

    const results: { [key: string]: TimeframeResult } = {};

    // Process each timeframe
    for (const timeframe of targetTimeframes) {
      try {
        console.log(`📊 Processing ${symbol} ${timeframe}`);
        
        const candles = await fetchPolygonData(symbol, timeframe);
        const technicalData = performTechnicalAnalysis(candles);
        
        // Get AI analysis from Gemini
        const aiAnalysis = await getGeminiAnalysis(symbol, timeframe, candles, technicalData);
        
        results[timeframe] = {
          timeframe,
          ...technicalData,
          analysis: aiAnalysis
        };

        console.log(`✅ ${timeframe} analysis completed: ${technicalData.trend} trend, ${technicalData.signal} signal`);

      } catch (error) {
        console.error(`❌ Error processing ${timeframe}:`, error.message);
        results[timeframe] = {
          timeframe,
          trend: 'Error',
          signal: 'Error',
          entryPrice: 0,
          stopLoss: 0,
          takeProfit: 0,
          rsi: 0,
          atr: 0,
          analysis: 'Analysis failed due to data error',
          error: error.message
        };
      }
    }

    // Increment usage count
    const { error: incrementError } = await supabase
      .rpc('increment_deep_analysis_usage', { 
        p_user_id: user.id, 
        p_email: user.email || '' 
      });

    if (incrementError) {
      console.error('❌ Usage increment error:', incrementError);
    }

    // Store analysis result
    const analysisData = {
      symbol,
      analysis: results,
      timestamp: new Date().toISOString(),
      type: 'multi_timeframe'
    };

    const { error: storeError } = await supabase
      .from('chart_analyses')
      .insert({
        user_id: user.id,
        pair_name: symbol,
        timeframe: 'multi',
        analysis_data: analysisData
      });

    if (storeError) {
      console.error('❌ Store error:', storeError);
    }

    console.log(`🎉 Analysis completed for ${symbol}. Results: ${Object.keys(results).join(', ')}`);

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Polygon analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Analysis failed', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});