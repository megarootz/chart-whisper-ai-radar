
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// API key is securely stored in Supabase's environment variables
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    const { base64Image, pairName, timeframe } = await req.json();
    
    // Prepare request for OpenRouter API with optimized prompt
    const requestData = {
      model: "openai/gpt-4.1-mini", // Updated model to gpt-4.1-mini
      messages: [
        {
          role: "system",
          content: "You are an expert forex and technical analysis expert. Analyze chart images with precision and consistency."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this chart image. Identify the trading pair, timeframe, and provide detailed technical analysis including trend direction, key support and resistance levels, chart patterns, and trading insights."
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 1000  // Reduced token limit to control response size
    };

    console.log("Sending request to OpenRouter API with model:", requestData.model);
    
    // Create headers with proper authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chartanalysis.app',
      'X-Title': 'Forex Chart Analyzer'
    };
    
    console.log("Request headers prepared");
    
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    console.log("API Response status:", response.status);
    
    // Get full response text
    const responseText = await response.text();
    console.log("Response received:", responseText.substring(0, 200) + "...");
    
    if (!response.ok) {
      throw new Error(`Failed to analyze chart: ${response.status} - ${responseText}`);
    }
    
    // Return the raw response to the client
    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Error in analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while analyzing the chart" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
