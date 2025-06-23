
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

    // Fetch real data from your Replit API
    const csvData = await fetchReplitData(currencyPair, timeframe, startDate, endDate);
    
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
      JSON.stringify({ error: 'Failed to fetch historical data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function fetchReplitData(pair: string, timeframe: string, startDate: Date, endDate: Date): Promise<string> {
  try {
    // Map our currency pairs to Replit API format (lowercase)
    const pairMapping: Record<string, string> = {
      'EURUSD': 'eurusd',
      'USDJPY': 'usdjpy', 
      'GBPUSD': 'gbpusd',
      'EURJPY': 'eurjpy',
      'USDCAD': 'usdcad',
      'AUDUSD': 'audusd',
      'XAUUSD': 'xauusd',
      'XAGUSD': 'xagusd',
      'AUDCAD': 'audcad',
      'AUDCHF': 'audchf',
      'AUDJPY': 'audjpy',
      'AUDNZD': 'audnzd',
      'CADCHF': 'cadchf',
      'CADJPY': 'cadjpy',
      'CHFJPY': 'chfjpy',
      'EURAUD': 'euraud',
      'EURCAD': 'eurcad',
      'EURCHF': 'eurchf',
      'EURGBP': 'eurgbp',
      'EURNZD': 'eurnzd',
      'GBPAUD': 'gbpaud',
      'GBPCAD': 'gbpcad',
      'GBPCHF': 'gbpchf',
      'GBPJPY': 'gbpjpy',
      'GBPNZD': 'gbpnzd',
      'NZDCAD': 'nzdcad',
      'NZDCHF': 'nzdchf',
      'NZDUSD': 'nzdusd',
      'USDCHF': 'usdchf'
    };

    // Map timeframes to Replit API format
    const timeframeMapping: Record<string, string> = {
      'M1': 'm1',
      'M5': 'm5', 
      'M15': 'm15',
      'M30': 'm30',
      'H1': 'h1',
      'H4': 'h4',
      'D1': 'd1'
    };

    const replitPair = pairMapping[pair] || pair.toLowerCase();
    const replitTimeframe = timeframeMapping[timeframe] || 'h1';
    
    // Format dates for Replit API (YYYY-MM-DD format)
    const fromDateStr = startDate.toISOString().split('T')[0];
    const toDateStr = endDate.toISOString().split('T')[0];
    
    // Construct Replit API URL
    const replitUrl = `https://dukas-megarootz181.replit.app/historical?instrument=${replitPair}&from=${fromDateStr}&to=${toDateStr}&timeframe=${replitTimeframe}&format=csv`;
    
    console.log('Fetching from Replit API:', replitUrl);
    
    // Fetch from your Replit API
    const response = await fetch(replitUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv,application/csv,text/plain,*/*',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    console.log('Replit API response status:', response.status);

    if (!response.ok) {
      console.log('Replit API error, status:', response.status);
      throw new Error(`Replit API returned ${response.status}`);
    }

    const data = await response.text();
    console.log('Replit API response data length:', data.length);
    
    // If we got data, process it to our CSV format
    if (data && data.length > 10 && !data.includes('error') && !data.includes('Error')) {
      return processReplitData(data, pair);
    } else {
      console.log('No valid data received from Replit API');
      throw new Error('No valid data received from Replit API');
    }
    
  } catch (error) {
    console.error('Error fetching from Replit API:', error);
    
    // Fallback: Generate realistic sample data
    console.log('Generating sample data as fallback');
    return generateRealisticSampleData(pair, startDate, endDate, timeframe);
  }
}

function processReplitData(data: string, pair: string): string {
  // Process Replit data format and convert to our CSV format
  const header = 'DATE,TIME,OPEN,HIGH,LOW,CLOSE,TICKVOL,VOL,SPREAD\n';
  
  try {
    // If the data is already in proper CSV format from Replit, we might just need to add our header
    const lines = data.trim().split('\n');
    let csvContent = header;
    
    // Skip header line if present
    const startIndex = lines[0].toLowerCase().includes('date') || lines[0].toLowerCase().includes('time') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Process each line of data from Replit
        const parts = line.split(',');
        if (parts.length >= 6) {
          const dateStr = parts[0].trim();
          const timeStr = parts[1] ? parts[1].trim() : '00:00:00';
          const open = parseFloat(parts[2] || parts[1]).toFixed(5);
          const high = parseFloat(parts[3] || parts[2]).toFixed(5);
          const low = parseFloat(parts[4] || parts[3]).toFixed(5);
          const close = parseFloat(parts[5] || parts[4]).toFixed(5);
          const volume = parts[6] ? parseInt(parts[6]) : Math.floor(Math.random() * 1000) + 100;
          const spread = pair.includes('XAU') ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 5) + 1;
          
          csvContent += `${dateStr},${timeStr},${open},${high},${low},${close},${volume},${Math.floor(volume/10)},${spread}\n`;
        }
      }
    }
    
    console.log('Successfully processed Replit data, lines:', lines.length);
    return csvContent;
  } catch (error) {
    console.error('Error processing Replit data:', error);
    throw error;
  }
}

function generateRealisticSampleData(pair: string, startDate: Date, endDate: Date, timeframe: string): string {
  const header = '# NOTE: This is sample data - Replit API could not be accessed\nDATE,TIME,OPEN,HIGH,LOW,CLOSE,TICKVOL,VOL,SPREAD\n';
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
  
  // Set realistic base prices for all currency pairs
  let basePrice: number;
  switch (pair) {
    case 'XAUUSD':
      basePrice = 2050.00;
      break;
    case 'XAGUSD':
      basePrice = 24.50;
      break;
    case 'EURUSD':
      basePrice = 1.0900;
      break;
    case 'GBPUSD':
      basePrice = 1.2700;
      break;
    case 'USDJPY':
      basePrice = 149.50;
      break;
    case 'USDCHF':
      basePrice = 0.8850;
      break;
    case 'USDCAD':
      basePrice = 1.3600;
      break;
    case 'AUDUSD':
      basePrice = 0.6550;
      break;
    case 'NZDUSD':
      basePrice = 0.6000;
      break;
    case 'EURJPY':
      basePrice = 163.00;
      break;
    case 'GBPJPY':
      basePrice = 190.00;
      break;
    case 'EURGBP':
      basePrice = 0.8580;
      break;
    case 'EURCHF':
      basePrice = 0.9640;
      break;
    case 'GBPCHF':
      basePrice = 1.1240;
      break;
    case 'AUDJPY':
      basePrice = 97.80;
      break;
    case 'CADJPY':
      basePrice = 110.20;
      break;
    case 'CHFJPY':
      basePrice = 169.00;
      break;
    case 'EURAUD':
      basePrice = 1.6640;
      break;
    case 'EURCAD':
      basePrice = 1.4830;
      break;
    case 'EURNZD':
      basePrice = 1.8180;
      break;
    case 'GBPAUD':
      basePrice = 1.9390;
      break;
    case 'GBPCAD':
      basePrice = 1.7280;
      break;
    case 'GBPNZD':
      basePrice = 2.1170;
      break;
    case 'AUDCAD':
      basePrice = 0.8910;
      break;
    case 'AUDCHF':
      basePrice = 0.5800;
      break;
    case 'AUDNZD':
      basePrice = 1.0920;
      break;
    case 'CADCHF':
      basePrice = 0.6510;
      break;
    case 'NZDCAD':
      basePrice = 0.8160;
      break;
    case 'NZDCHF':
      basePrice = 0.5310;
      break;
    default:
      basePrice = 1.1000;
  }
  
  while (current <= endDate) {
    const date = current.toISOString().split('T')[0];
    const time = current.toTimeString().split(' ')[0];
    
    // Generate more realistic price movements with proper volatility
    const volatility = pair.includes('XAU') ? 0.015 : pair.includes('XAG') ? 0.03 : 
                       pair.includes('JPY') ? 0.8 : 0.002;
    const change = (Math.random() - 0.5) * volatility * 2;
    
    const open = basePrice;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const range = Math.random() * volatility * 0.8;
    
    const high = open + Math.abs(range);
    const low = open - Math.abs(range);
    const close = open + (change * direction);
    
    const tickvol = Math.floor(Math.random() * 1000) + 100;
    const vol = Math.floor(Math.random() * 50) + 10;
    const spread = pair.includes('XAU') ? Math.floor(Math.random() * 20) + 10 : 
                   pair.includes('XAG') ? Math.floor(Math.random() * 15) + 5 :
                   Math.floor(Math.random() * 5) + 1;
    
    const decimals = pair.includes('JPY') ? 3 : 5;
    csvContent += `${date},${time},${open.toFixed(decimals)},${high.toFixed(decimals)},${low.toFixed(decimals)},${close.toFixed(decimals)},${tickvol},${vol},${spread}\n`;
    
    basePrice = close; // Use close as next base price for continuity
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return csvContent;
}
