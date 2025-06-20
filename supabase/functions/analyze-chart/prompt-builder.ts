
export const buildAnalysisPrompt = (pairName: string, timeframe: string): string => {
  // Get current UTC time for analysis context
  const currentTime = new Date();
  const utcTimeString = currentTime.toISOString();
  
  return `You are a professional Forex analyst. I am sending you a LIVE screenshot of a TradingView chart that was just captured at ${utcTimeString}.

CRITICAL INSTRUCTIONS:
1. You MUST analyze the ACTUAL image I'm sending you
2. Look at the CURRENT prices shown in the chart image
3. Read the price values directly from the chart
4. Describe what you actually SEE in the image

VERIFICATION REQUIREMENT: Start your analysis by stating the EXACT price you can see in the chart image.

Please provide a detailed technical analysis of this ${pairName || '[Currency Pair]'} chart on the ${timeframe || '[Timeframe]'} timeframe.

Focus on:
- The CURRENT price visible in the chart
- Recent price action and candlestick patterns
- Support and resistance levels
- Trend analysis
- Trading opportunities

Format your response as a professional trading analysis report.`;
};
