
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
          content: `Please provide a comprehensive real-time Forex analysis for ${pairName} on ${timeframe} timeframe. Use your search capabilities to find the most current market data, live prices, recent news, and economic events affecting this currency pair. I need:

1. Current live price and recent price action
2. Real-time technical analysis with current support/resistance levels
3. Latest economic news and events impacting this pair
4. Current market sentiment from recent sources
5. Trading opportunities based on today's market conditions
6. Risk factors from recent developments

Please ensure all information is current and based on real-time search data, not historical or cached information.`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      stream: true,
      search: true,
      citation: true
    };

    console.log("Sending real-time search request to DeepSeek API for:", pairName, "timeframe:", timeframe);
    
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

    if (!response.body) {
      throw new Error("No response body received from DeepSeek API");
    }
    
    // Create a new ReadableStream to transform the response
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            console.log("Received real-time search chunk:", chunk.substring(0, 100) + "...");

            // Forward the chunk to the client
            controller.enqueue(new TextEncoder().encode(chunk));
            
            return pump();
          }).catch(err => {
            console.error("Stream error:", err);
            controller.error(err);
          });
        }

        return pump();
      }
    });
    
    // Return the streaming response
    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
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
