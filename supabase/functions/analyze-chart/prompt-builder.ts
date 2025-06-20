
export const buildAnalysisPrompt = (pairName: string, timeframe: string): string => {
  // Get current UTC time for analysis context
  const currentTime = new Date();
  const utcTimeString = currentTime.toISOString();
  
  return `You are a professional forex analyst and multi-year full-time trader. 
Analyze the attached chart image as a real TradingView forex candlestick chart that was captured at ${utcTimeString}.

Provide a comprehensive, step-by-step technical analysis and specific trade setup. 
The goal is to deliver actionable, realistic analysis and trade recommendations that a real trader can use.

**Please answer in this structured format:**

---

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
- Focus on the ${pairName || '[Currency Pair]'} chart on the ${timeframe || '[Timeframe]'} timeframe if specified.

---

**SAMPLE ANSWER STRUCTURE:**

### 1. Market Context & Trend Detection
The chart shows a well-established bullish trend over the last several sessions, with higher highs and higher lows. Recent price action indicates strengthened momentum following a possible breakout above the previous resistance. There is increased volatility, likely due to the recent London session open.

### 2. Key Price Levels
- Support: 1.2760 (zone of prior demand and multiple bounce points).
- Resistance: 1.2840 (recent swing high).
- Breakout zone: Above 1.2845 (could lead to another upward impulse).

### 3. Notable Chart/Candlestick Patterns
- Bullish engulfing pattern occurred two candles before current price, near support zone.
- No major chart pattern like head & shoulders or double bottom is visible.

### 4. Price Action & Momentum Analysis
Price made a clean bullish impulsive move after a consolidation zone, followed by minor pullback. Recent candles show long lower wicks, suggesting buying pressure. No large volume spikes are visible.

### 5. Indicator Insights (If Visible)
The moving average (possibly 21-period EMA) is rising steeply and price stays above it, supporting bullish momentum. No other indicators are visible.

### 6. Trade Opportunity & Setup Suggestion
Potential long trade if price retests the 1.2760-1.2780 support zone and forms a bullish reversal candle. Enter on bullish confirmation, stop loss below 1.2735 (recent swing low), take profit at 1.2840 and extended target at 1.2880 if new highs break. Risk/reward around 1:2. Invalidation if price closes below 1.2730.

### 7. Trader's Commentary
- Pay attention to upcoming US news releases which could increase volatility.
- Manage trade size using proper risk per trade (e.g. 1%). Avoid chasing the breakout if entry is missed.
- **Risk Warning:** Forex trading involves significant risk. Never risk more than you can afford to lose. Use leverage cautiously!

---`;
};
