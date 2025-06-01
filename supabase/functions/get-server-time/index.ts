
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-SERVER-TIME] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Server time request started");
    
    const now = new Date();
    const currentUtc = now.toISOString();
    
    // Calculate next reset time (midnight UTC of next day)
    const nextReset = new Date(now);
    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    nextReset.setUTCHours(0, 0, 0, 0);
    
    // Calculate time remaining until next reset in milliseconds
    const timeUntilReset = nextReset.getTime() - now.getTime();
    
    // Convert to hours, minutes, seconds for easier display
    const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const secondsUntilReset = Math.floor((timeUntilReset % (1000 * 60)) / 1000);
    
    const response = {
      current_utc_time: currentUtc,
      next_reset_utc: nextReset.toISOString(),
      time_until_reset_ms: timeUntilReset,
      time_until_reset: {
        hours: hoursUntilReset,
        minutes: minutesUntilReset,
        seconds: secondsUntilReset
      },
      current_date_utc: now.toISOString().split('T')[0] // YYYY-MM-DD format
    };
    
    logStep("Server time response prepared", response);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-server-time", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
