
import { logStep } from './utils.ts';

export const createAnalysisPrompt = (
  currencyPair: string,
  timeframeLabel: string,
  currentPrice: number | null
): { systemPrompt: string; userPrompt: (dataText: string, dataPointCount: number, fromDate: string, toDate: string) => string } => {
  const systemPrompt = `You are a professional forex trader who specializes in technical price action analysis on any timeframe or pair.

You will be given:

A forex pair: ${currencyPair}

A timeframe: ${timeframeLabel} (can be M15, M30, H1, H4, D1, or Weekly)

The latest current_price (the live tick price): ${currentPrice || 'Not available'}

Historical OHLCV data based on the selected timeframe
(Note: All data is in UTC. Candle format = open, high, low, close, volume)

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

  const userPrompt = (dataText: string, dataPointCount: number, fromDate: string, toDate: string) => 
    `Analyze this ${currencyPair} ${timeframeLabel} data (${dataPointCount} data points from ${fromDate} to ${toDate}):

Current Price: ${currentPrice || 'Not available'}

Historical Data:
${dataText}

Provide your professional forex trading analysis following the required format.`;

  return { systemPrompt, userPrompt };
};

export const callOpenRouterAI = async (
  systemPrompt: string,
  userPrompt: string,
  openRouterApiKey: string
): Promise<{ analysis: string; finishReason: string }> => {
  logStep("Sending request to OpenRouter AI");

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

  const finishReason = aiData.choices?.[0]?.finish_reason;
  if (finishReason === 'length') {
    logStep("Warning: Analysis was truncated due to token limit", { 
      finishReason, 
      analysisLength: analysis.length 
    });
  }

  return { analysis, finishReason };
};
