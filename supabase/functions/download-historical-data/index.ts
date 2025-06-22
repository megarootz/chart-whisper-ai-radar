
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

    const minutes = timeframeMap[timeframe] || 60;
    
    // Generate sample data for demonstration
    // In production, you would fetch real data from Dukascopy API
    const csvData = generateSampleCSVData(currencyPair, startDate, endDate, minutes);
    
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
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateSampleCSVData(pair: string, startDate: Date, endDate: Date, intervalMinutes: number): string {
  const header = 'DATE,TIME,OPEN,HIGH,LOW,CLOSE,TICKVOL,VOL,SPREAD\n';
  let csvContent = header;
  
  const current = new Date(startDate);
  let basePrice = pair.includes('XAU') ? 2000 : 1.1000; // Gold vs Forex base price
  
  while (current <= endDate) {
    const date = current.toISOString().split('T')[0];
    const time = current.toTimeString().split(' ')[0];
    
    // Generate realistic OHLC data
    const open = basePrice + (Math.random() - 0.5) * 0.01;
    const high = open + Math.random() * 0.005;
    const low = open - Math.random() * 0.005;
    const close = low + Math.random() * (high - low);
    const tickvol = Math.floor(Math.random() * 1000) + 100;
    const vol = Math.floor(Math.random() * 50) + 10;
    const spread = Math.floor(Math.random() * 5) + 1;
    
    csvContent += `${date},${time},${open.toFixed(5)},${high.toFixed(5)},${low.toFixed(5)},${close.toFixed(5)},${tickvol},${vol},${spread}\n`;
    
    basePrice = close; // Use close as next base price for continuity
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return csvContent;
}
