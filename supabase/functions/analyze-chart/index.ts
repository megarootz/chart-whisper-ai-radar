
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// API key is securely stored in Supabase's environment variables
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    const { base64Image, pairName, timeframe } = await req.json();
    
    console.log("📊 Enhanced analysis request received:", { 
      pairName, 
      timeframe, 
      imageLength: base64Image?.length 
    });
    
    // Enhanced professional trading analysis prompt
    const requestData = {
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional institutional trader and technical analyst with 15+ years of experience in forex, commodities, and cryptocurrency markets. You specialize in precision technical analysis, market structure analysis, and creating actionable trading setups.

CRITICAL ANALYSIS REQUIREMENTS:
1. The user has specifically selected ${pairName} on ${timeframe} timeframe
2. Analyze ONLY the ${pairName} chart for ${timeframe} timeframe
3. Provide institutional-grade analysis with specific price levels
4. Focus on actionable trading insights with proper risk management
5. Use professional trading terminology and concepts

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

${pairName} Professional Technical Analysis (${timeframe} Chart)

**1. Market Structure & Trend Analysis:**
- Overall Market Structure: [Bullish/Bearish/Neutral/Transitional]
- Primary Trend: [Strong Bullish/Bullish/Weak Bullish/Neutral/Weak Bearish/Bearish/Strong Bearish]
- Market Phase: [Trending/Consolidating/Reversal/Breakout]
- Key Market Structure Levels: [Specific price levels with explanations]

**2. Critical Support & Resistance Levels:**
- Primary Support: [Exact price level] - [Confluence factors: previous highs/lows, fibonacci, round numbers, etc.]
- Secondary Support: [Exact price level] - [Confluence factors]
- Primary Resistance: [Exact price level] - [Confluence factors] 
- Secondary Resistance: [Exact price level] - [Confluence factors]
- Break-Even Zone: [Price range where trend becomes neutral]

**3. Volume & Momentum Analysis:**
- Volume Profile: [Analysis of volume patterns and accumulation/distribution]
- Momentum Divergence: [Any bullish or bearish divergences observed]
- Institutional Activity: [Signs of smart money accumulation or distribution]

**4. Chart Patterns & Formations:**
- Primary Pattern: [Specific pattern name and completion status]
- Pattern Target: [Measured move target with price level]
- Pattern Invalidation: [Price level that would invalidate the pattern]
- Secondary Formations: [Any additional patterns or structures]

**5. Technical Indicators Synthesis:**
- Price Action Signals: [Key candlestick patterns and price behaviors]
- Moving Average Analysis: [Relationship to key MAs and dynamic support/resistance]
- Oscillator Analysis: [RSI, MACD, Stochastic conditions and signals]
- Fibonacci Analysis: [Key retracement and extension levels]

**6. Multi-Timeframe Context:**
- Higher Timeframe Bias: [Weekly/Daily trend direction and key levels]
- Lower Timeframe Signals: [H4/H1 entry opportunities and confirmations]
- Confluence Analysis: [How different timeframes align or conflict]

**7. Detailed Trading Setups:**

**BULLISH SCENARIO for ${pairName}:**
- Entry Strategy: [Specific entry method: break above resistance, pullback to support, etc.]
- Precise Entry Zone: [Exact price range for entries]
- Entry Confirmation: [Required signals before entering]
- Stop Loss: [Exact price level with reasoning]
- Take Profit 1: [Conservative target with price level]
- Take Profit 2: [Aggressive target with price level]
- Risk-Reward Ratio: [Calculated R:R for this setup]
- Position Size Recommendation: [Conservative/Moderate/Aggressive based on setup quality]

**BEARISH SCENARIO for ${pairName}:**
- Entry Strategy: [Specific entry method]
- Precise Entry Zone: [Exact price range for entries]
- Entry Confirmation: [Required signals before entering]
- Stop Loss: [Exact price level with reasoning]
- Take Profit 1: [Conservative target with price level]
- Take Profit 2: [Aggressive target with price level]
- Risk-Reward Ratio: [Calculated R:R for this setup]
- Position Size Recommendation: [Conservative/Moderate/Aggressive based on setup quality]

**8. Risk Management Framework:**
- Maximum Risk Per Trade: [Percentage recommendation based on setup quality]
- Position Sizing: [How to calculate proper position size]
- Stop Loss Management: [How to manage stops as trade progresses]
- Profit Taking Strategy: [Systematic approach to taking profits]

**9. Market Outlook & Key Levels to Watch:**
- Short-term Outlook (Next 24-48 hours): [Expected price action]
- Medium-term Outlook (Next week): [Broader market expectations]
- Key Events to Monitor: [Economic events or technical levels that could change the analysis]
- Invalidation Levels: [Price levels that would change the entire analysis]

**10. Trade Management & Contingencies:**
- Best Case Scenario: [What happens if everything goes perfectly]
- Worst Case Scenario: [How to handle if the trade goes against you]
- Neutral Scenario: [What to do if price consolidates]
- Exit Strategies: [Clear rules for when to exit winning and losing trades]

Remember: This analysis is specifically for ${pairName} on ${timeframe} timeframe. All price levels, patterns, and recommendations must be relevant to ${pairName} and current market conditions.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please provide a comprehensive institutional-grade technical analysis for this ${pairName} chart on ${timeframe} timeframe.

ANALYSIS REQUIREMENTS:
- Focus specifically on ${pairName} 
- Timeframe: ${timeframe}
- Provide exact price levels for all support/resistance
- Include specific entry, stop loss, and take profit levels
- Analyze market structure and institutional order flow
- Consider multi-timeframe context
- Provide actionable trading setups with proper risk management

Your response must start with: "${pairName} Professional Technical Analysis (${timeframe} Chart)"`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 2500
    };

    console.log("Sending enhanced request to OpenRouter API for:", pairName, timeframe);
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Professional Forex Chart Analyzer'
    };
    
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    console.log("API Response status:", response.status);
    
    // Get full response text
    const responseText = await response.text();
    console.log("Enhanced analysis response received for", pairName, "- length:", responseText.length);
    
    if (!response.ok) {
      throw new Error(`Failed to analyze chart: ${response.status} - ${responseText}`);
    }
    
    // Return the raw response to the client
    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Error in enhanced analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the chart" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
