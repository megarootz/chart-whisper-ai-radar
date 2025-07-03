
import { logStep, formatTimestamp } from './utils.ts';
import type { HistoricalDataPoint } from './types.ts';

export const fetchCurrentPrice = async (currencyPair: string): Promise<{ price: number | null; timestamp: string | null }> => {
  let currentPrice = null;
  let currentPriceTimestamp = null;
  
  try {
    const tickUrl = `https://duka-qr9j.onrender.com/latest-tick?instrument=${currencyPair.toLowerCase()}&format=json`;
    logStep("🎯 FETCHING CURRENT PRICE", { 
      url: tickUrl,
      purpose: "Getting latest tick for current price reference"
    });

    const tickController = new AbortController();
    const tickTimeoutId = setTimeout(() => tickController.abort(), 15000);

    const tickResponse = await fetch(tickUrl, {
      signal: tickController.signal,
      headers: {
        'User-Agent': 'ForexRadar7-CurrentPrice/1.0',
        'Accept': 'application/json'
      }
    });
    clearTimeout(tickTimeoutId);

    if (tickResponse.ok) {
      const tickResponseText = await tickResponse.text();
      logStep("Current price response received", { 
        length: tickResponseText.length,
        firstChars: tickResponseText.substring(0, 200)
      });

      let tickData;
      try {
        tickData = JSON.parse(tickResponseText);
      } catch (parseError) {
        logStep("JSON parse failed for tick data, trying CSV", { parseError: parseError.message });
        
        // Try to parse as CSV if JSON fails
        if (tickResponseText.includes(',') && tickResponseText.includes('\n')) {
          const lines = tickResponseText.trim().split('\n');
          if (lines.length > 1) {
            const parts = lines[1].split(','); // Skip header line
            if (parts.length >= 5) {
              tickData = [{
                timestamp: parts[0],
                open: parseFloat(parts[1]),
                high: parseFloat(parts[2]),
                low: parseFloat(parts[3]),
                close: parseFloat(parts[4])
              }];
            }
          }
        }
      }

      if (tickData && Array.isArray(tickData) && tickData.length > 0) {
        const latestTick = tickData[0];
        currentPrice = latestTick.close || latestTick.price || latestTick.bid || latestTick.ask;
        currentPriceTimestamp = latestTick.timestamp || latestTick.time || new Date().toISOString();
        
        logStep("✅ CURRENT PRICE EXTRACTED", { 
          currentPrice, 
          currentPriceTimestamp,
          tickDataLength: tickData.length
        });
      } else {
        logStep("No valid tick data received", { tickData });
      }
    } else {
      logStep("Warning: Could not fetch tick data", { 
        status: tickResponse.status, 
        statusText: tickResponse.statusText 
      });
    }
  } catch (tickError) {
    logStep("Warning: Error fetching tick data", { error: tickError.message });
  }

  return { price: currentPrice, timestamp: currentPriceTimestamp };
};

export const fetchHistoricalData = async (
  currencyPair: string, 
  mappedTimeframe: string, 
  fromDate: string, 
  toDate: string
): Promise<HistoricalDataPoint[]> => {
  const renderUrl = `https://duka-qr9j.onrender.com/historical?instrument=${currencyPair.toLowerCase()}&from=${fromDate}&to=${toDate}&timeframe=${mappedTimeframe}&format=json`;
  logStep("📊 FETCHING HISTORICAL BAR DATA", { 
    url: renderUrl,
    timeframe: mappedTimeframe,
    purpose: "Getting historical bars/candles for analysis"
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  let renderResponse;
  let historicalData: HistoricalDataPoint[];
  
  try {
    renderResponse = await fetch(renderUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ForexRadar7-HistoricalBars/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    clearTimeout(timeoutId);

    if (!renderResponse.ok) {
      logStep("ERROR: Render API response not OK", { 
        status: renderResponse.status, 
        statusText: renderResponse.statusText 
      });
      throw new Error(`Historical data service error: ${renderResponse.status} - ${renderResponse.statusText}`);
    }

    const responseText = await renderResponse.text();
    logStep("📈 HISTORICAL BAR DATA RECEIVED", { 
      length: responseText.length,
      firstChars: responseText.substring(0, 100)
    });

    // Try to parse as JSON first
    try {
      historicalData = JSON.parse(responseText);
      logStep("Historical bar data parsed as JSON", { 
        isArray: Array.isArray(historicalData),
        length: Array.isArray(historicalData) ? historicalData.length : 'not array'
      });
    } catch (parseError) {
      logStep("JSON parse failed, trying CSV format", { parseError: parseError.message });
      
      // If it's not JSON, try to parse as CSV
      if (responseText.includes(',') && responseText.includes('\n')) {
        const lines = responseText.trim().split('\n');
        if (lines.length > 1) {
          historicalData = lines.slice(1).map((line) => {
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
          }).filter(item => item !== null) as HistoricalDataPoint[];
          
          logStep("Historical bar data parsed as CSV", { 
            totalLines: lines.length,
            validCandles: historicalData.length
          });
        }
      }
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error('Unable to parse historical data response');
      }
    }

  } catch (fetchError) {
    clearTimeout(timeoutId);
    logStep("ERROR: Failed to fetch historical data", { 
      error: fetchError.message,
      url: renderUrl 
    });
    throw new Error(`Failed to fetch historical data: ${fetchError.message}`);
  }

  return historicalData;
};

export const convertDataToText = (historicalData: HistoricalDataPoint[]): string => {
  return historicalData.map(candle => {
    const timestamp = formatTimestamp(candle.timestamp || candle.date || candle.time || '');
    const open = candle.open || '';
    const high = candle.high || '';
    const low = candle.low || '';
    const close = candle.close || '';
    const volume = candle.volume || '';
    return `${timestamp},${open},${high},${low},${close},${volume}`;
  }).join('\n');
};
