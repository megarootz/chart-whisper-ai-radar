
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { AnalysisRequest, OpenRouterRequest } from './types.ts';
import { validateImageData, validateAnalysisContent } from './validation.ts';
import { OpenRouterClient } from './openrouter-client.ts';
import { buildAnalysisPrompt } from './prompt-builder.ts';

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    const { base64Image, pairName, timeframe }: AnalysisRequest = await req.json();
    
    console.log("🔍 Received analysis request:", { 
      pairName, 
      timeframe, 
      hasImage: !!base64Image,
      imageLength: base64Image?.length || 0
    });
    
    // Validate image data
    const validation = validateImageData(base64Image);
    if (!validation.isValid) {
      throw new Error(validation.error!);
    }
    
    // Build the analysis prompt
    const analysisPrompt = buildAnalysisPrompt(pairName, timeframe);
    
    // Create the request data for OpenRouter API with image
    const requestData: OpenRouterRequest = {
      model: "openai/gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
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
      temperature: 0.1,
      max_tokens: 4000
    };

    console.log("🚀 Sending request to OpenRouter API:", {
      model: requestData.model,
      maxTokens: requestData.max_tokens,
      imageSizeKB: Math.round((validation.imageSize || 0) / 1024)
    });
    
    // Initialize OpenRouter client and make the request
    const client = new OpenRouterClient(OPENROUTER_API_KEY);
    const parsedResponse = await client.makeRequest(requestData);
    
    const analysisContent = parsedResponse.choices[0].message?.content;
    
    // Validate analysis content
    const contentValidation = validateAnalysisContent(analysisContent || '');
    if (!contentValidation.isValid) {
      throw new Error(contentValidation.error!);
    }
    
    // Log successful analysis
    const usage = parsedResponse.usage;
    console.log("✅ Analysis completed successfully:", {
      pairName,
      timeframe,
      analysisLength: analysisContent?.length || 0,
      tokensUsed: usage ? {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      } : 'not available',
      model: parsedResponse.model || requestData.model
    });
    
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ Error in analyze-chart function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred during analysis",
        error_type: "analysis_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
