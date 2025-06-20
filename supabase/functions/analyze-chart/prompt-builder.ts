
export const buildAnalysisPrompt = (pairName: string, timeframe: string): string => {
  // Get current UTC time for analysis context
  const currentTime = new Date();
  const utcTimeString = currentTime.toISOString();
  
  // Check if we need to auto-detect pair and timeframe
  const shouldDetectPair = pairName === "AUTO_DETECT" || !pairName;
  const shouldDetectTimeframe = timeframe === "AUTO_DETECT" || !timeframe;
  
  const pairInstruction = shouldDetectPair 
    ? "First, identify the trading pair from the chart (look for pair name in the chart title, top left, or anywhere visible)"
    : `Analyze this ${pairName} chart`;
    
  const timeframeInstruction = shouldDetectTimeframe
    ? "Also identify the timeframe from the chart (look for timeframe indicators like 1H, 4H, 1D, etc.)"
    : `on the ${timeframe} timeframe`;
  
  return `You are a professional forex analyst and multi-year full-time trader. 
Analyze the attached chart image as a real TradingView forex candlestick chart that was captured at ${utcTimeString}.

${pairInstruction} ${timeframeInstruction}.

Provide a comprehensive, step-by-step technical analysis and specific trade setup. 
The goal is to deliver actionable, realistic analysis and trade recommendations that a real trader can use.

**Please answer in this structured format:**

---

**CHART IDENTIFICATION:**
${shouldDetectPair ? "- Trading Pair: [Identify from chart]" : `- Trading Pair: ${pairName}`}
${shouldDetectTimeframe ? "- Timeframe: [Identify from chart]" : `- Timeframe: ${timeframe}`}

**1. Market Context & Trend Detection:**
- What is the overall market context, recent trend (bullish/bearish/sideways), and higher/lower time-frame perspective (if visible from chart)? 
- Mention if significant changes in volatility, session shifts, or news events are likely affecting price movement.

**2. Key Price Levels:**
- Identify all clearly visible support & resistance levels with specific price values (and why you chose them — e.g., prior swing high/low, clustering, zones).
- Mark potential breakout or reversal zones.

**3. Notable Chart/Candlestick Patterns:**
- List any major price patterns (head & shoulders, double top/bottom, triangles, wedges, flags) or candlestick signals (engulfing, doji, pinbar) seen on the chart, including where they occur relative to the key levels.

**4. Price Action & Momentum Analysis:**
- Describe price action signals: recent impulses, corrections, consolidation, rejection wicks, or strong closes.
- If visible, discuss volume spikes or volatility changes (or note if not visible on chart).

**5. Indicator Insights (If Visible):**
- If the chart has indicators visible (like MA, RSI, MACD, Stochastic, volume), analyze what they suggest in the current market context.

**6. Trade Opportunity & Setup Suggestion:**
- Propose a realistic trading plan based on the analysis above. Specify:
    - Trade direction (buy/sell/wait)
    - Entry trigger or zone (ideally a price or pattern)
    - Stop loss level (explain placement)
    - 1-2 take profit targets (with reasoning)
    - Risk/reward ratio estimate
    - Invalidation scenario (what price action would make the trade setup invalid?)

**7. Trader's Commentary:**
- Add at least two additional observations or tips for effective trading in a market like this, such as what to watch out for in this pair/pattern, psychological notes, or risk management reminders.
- Add a risk warning regarding leverage and overtrading.

---

**REQUIREMENTS:** 
- Don't make up data if you can't see it clearly in the image. If unknown, just write "Not visible".
- Write at least 5-8 sentences for the overall analysis.
- Use markdown for clarity.
- If you cannot detect the trading pair or timeframe from the chart, clearly state "Unable to detect from chart image" in the identification section.

---`;
};
