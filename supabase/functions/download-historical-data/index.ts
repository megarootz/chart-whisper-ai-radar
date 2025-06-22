
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestData {
  currencyPair: string;
  timeframe: string;
  fromDate: string;
  toDate: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currencyPair, timeframe, fromDate, toDate }: RequestData = await req.json();
    
    console.log('Historical data request:', { currencyPair, timeframe, fromDate, toDate });

    // Validate date range (max 12 months)
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);
    
    if (diffMonths > 12) {
      return new Response(
        JSON.stringify({ error: 'Date range cannot exceed 12 months' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Try to fetch real data from Dukascopy
    const csvData = await fetchDukascopyData(currencyPair, timeframe, startDate, endDate);
    
    return new Response(csvData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${currencyPair}_${timeframe}_${fromDate}_${toDate}.csv"`
      }
    });

  } catch (error) {
    console.error('Error processing historical data request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to fetch historical data from Dukascopy' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function fetchDukascopyData(pair: string, timeframe: string, startDate: Date, endDate: Date): Promise<string> {
  try {
    // Map our currency pairs to Dukascopy format
    const pairMapping: Record<string, string> = {
      'EURUSD': 'EURUSD',
      'GBPUSD': 'GBPUSD', 
      'USDJPY': 'USDJPY',
      'USDCHF': 'USDCHF',
      'USDCAD': 'USDCAD',
      'AUDUSD': 'AUDUSD',
      'NZDUSD': 'NZDUSD',
      'XAUUSD': 'XAUUSD',
      'XAGUSD': 'XAGUSD'
    };

    // Map timeframes to Dukascopy format
    const timeframeMapping: Record<string, string> = {
      'M1': 'm1',
      'M5': 'm5', 
      'M15': 'm15',
      'M30': 'm30',
      'H1': 'h1',
      'H4': 'h4',
      'D1': 'd1'
    };

    const dukascopyPair = pairMapping[pair] || pair;
    const dukascopyTimeframe = timeframeMapping[timeframe] || 'h1';
    
    // Format dates for Dukascopy API
    const fromTimestamp = Math.floor(startDate.getTime());
    const toTimestamp = Math.floor(endDate.getTime());
    
    // Construct Dukascopy data URL
    const dukascopyUrl = `https://datafeed.dukascopy.com/datafeed/${dukascopyPair}/${dukascopyTimeframe}/${fromTimestamp}/${toTimestamp}`;
    
    console.log('Fetching from Dukascopy URL:', dukascopyUrl);
    
    // Attempt to fetch from Dukascopy
    const response = await fetch(dukascopyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/csv,application/json,*/*'
      }
    });

    if (!response.ok) {
      console.log('Dukascopy API not accessible, generating sample data');
      throw new Error(`Dukascopy API returned ${response.status}`);
    }

    const data = await response.text();
    
    // If we got data, process it to our CSV format
    if (data && data.length > 10) {
      return processDukascopyData(data, pair);
    } else {
      throw new Error('No data received from Dukascopy');
    }
    
  } catch (error) {
    console.error('Error fetching from Dukascopy:', error);
    
    // Fallback: Generate realistic sample data with a clear note
    console.log('Generating sample data as fallback');
    return generateRealisticSampleData(pair, startDate, endDate, timeframe);
  }
}

function processDukascopyData(data: string, pair: string): string {
  // Process Dukascopy data format and convert to our CSV format
  const header = 'DATE,TIME,OPEN,HIGH,LOW,CLOSE,TICKVOL,VOL,SPREAD\n';
  
  try {
    // Parse Dukascopy data and convert to our format
    const lines = data.trim().split('\n');
    let csvContent = header;
    
    for (const line of lines) {
      if (line.trim()) {
        // Process each line of Dukascopy data
        const parts = line.split(',');
        if (parts.length >= 6) {
          const timestamp = parseInt(parts[0]);
          const date = new Date(timestamp);
          const dateStr = date.toISOString().split('T')[0];
          const timeStr = date.toTimeString().split(' ')[0];
          
          csvContent += `${dateStr},${timeStr},${parts[1]},${parts[2]},${parts[3]},${parts[4]},${parts[5] || '100'},${parts[6] || '10'},${parts[7] || '2'}\n`;
        }
      }
    }
    
    return csvContent;
  } catch (error) {
    console.error('Error processing Dukascopy data:', error);
    throw error;
  }
}

function generateRealisticSampleData(pair: string, startDate: Date, endDate: Date, timeframe: string): string {
  const header = '# NOTE: This is sample data - Dukascopy API is not accessible\nDATE,TIME,OPEN,HIGH,LOW,CLOSE,TICKVOL,VOL,SPREAD\n';
  let csvContent = header;
  
  // Map timeframes to minutes
  const timeframeMap: Record<string, number> = {
    'M1': 1,
    'M5': 5,
    'M15': 15,
    'M30': 30,
    'H1': 60,
    'H4': 240,
    'D1': 1440
  };

  const intervalMinutes = timeframeMap[timeframe] || 60;
  const current = new Date(startDate);
  
  // Set realistic base prices based on current market levels
  let basePrice: number;
  switch (pair) {
    case 'XAUUSD':
      basePrice = 2050; // Gold around $2050
      break;
    case 'EURUSD':
      basePrice = 1.0900; // EUR/USD around 1.09
      break;
    case 'GBPUSD':
      basePrice = 1.2700; // GBP/USD around 1.27
      break;
    case 'USDJPY':
      basePrice = 149.50; // USD/JPY around 149.5
      break;
    case 'USDCHF':
      basePrice = 0.8850; // USD/CHF around 0.885
      break;
    case 'USDCAD':
      basePrice = 1.3600; // USD/CAD around 1.36
      break;
    case 'AUDUSD':
      basePrice = 0.6550; // AUD/USD around 0.655
      break;
    case 'NZDUSD':
      basePrice = 0.6000; // NZD/USD around 0.60
      break;
    default:
      basePrice = 1.1000;
  }
  
  while (current <= endDate) {
    const date = current.toISOString().split('T')[0];
    const time = current.toTimeString().split(' ')[0];
    
    // Generate more realistic price movements
    const volatility = pair.includes('XAU') ? 0.01 : 0.002; // Gold more volatile
    const change = (Math.random() - 0.5) * volatility;
    
    const open = basePrice;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const range = Math.random() * volatility * 0.5;
    
    const high = open + Math.abs(range);
    const low = open - Math.abs(range);
    const close = open + (change * direction);
    
    const tickvol = Math.floor(Math.random() * 1000) + 100;
    const vol = Math.floor(Math.random() * 50) + 10;
    const spread = pair.includes('XAU') ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 5) + 1;
    
    csvContent += `${date},${time},${open.toFixed(5)},${high.toFixed(5)},${low.toFixed(5)},${close.toFixed(5)},${tickvol},${vol},${spread}\n`;
    
    basePrice = close; // Use close as next base price for continuity
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return csvContent;
}
