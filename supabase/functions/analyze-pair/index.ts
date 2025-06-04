
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY environment variable is not set");
    }

    const { pairName, timeframe } = await req.json();
    
    const requestData = {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `I want you to act as a professional Forex (Foreign Exchange) analyst. Analyze the following currency pair: ${pairName} and ${timeframe}.`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      stream: false
    };

    console.log("Sending request to DeepSeek API for pair:", pairName, "timeframe:", timeframe);
    
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestData)
    });

    console.log("DeepSeek API Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API Error:", errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log("DeepSeek response received successfully");
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Error in analyze-pair function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the pair" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
