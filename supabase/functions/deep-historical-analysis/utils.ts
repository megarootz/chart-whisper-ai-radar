
export const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEEP-HISTORICAL-ANALYSIS] ${step}${detailsStr}`);
};

export const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  try {
    let date: Date;
    
    // Handle different timestamp formats
    if (typeof timestamp === 'string') {
      // If it's already a date string, use it
      if (timestamp.includes('-') || timestamp.includes('/')) {
        date = new Date(timestamp);
      } else {
        // If it's a string number, parse it
        const num = parseInt(timestamp);
        date = new Date(num);
      }
    } else if (typeof timestamp === 'number') {
      // Handle both seconds and milliseconds timestamps
      date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
    } else {
      return String(timestamp);
    }
    
    // Return formatted date if valid
    if (!isNaN(date.getTime())) {
      return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
  } catch (error) {
    logStep("Warning: Error formatting timestamp", { timestamp, error: error.message });
  }
  
  return String(timestamp);
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const timeframeMapping: Record<string, string> = {
  'M1': 'm1',
  'M15': 'm15',
  'M30': 'm30',
  'H1': 'h1',
  'H4': 'h4',
  'D1': 'd1',
  'W1': 'w1'
};

export const timeframeLabels: Record<string, string> = {
  'm1': 'M1',
  'm15': 'M15',
  'm30': 'M30',
  'h1': 'H1',
  'h4': 'H4',
  'd1': 'D1',
  'w1': 'W1'
};
