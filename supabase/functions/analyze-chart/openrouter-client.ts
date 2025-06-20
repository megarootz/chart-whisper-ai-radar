
import { OpenRouterRequest, OpenRouterResponse } from './types.ts';

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async makeRequest(requestData: OpenRouterRequest): Promise<OpenRouterResponse> {
    console.log("🚀 Making request to OpenRouter API:", {
      model: requestData.model,
      messagesCount: requestData.messages.length,
      maxTokens: requestData.max_tokens
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://forexradar7.com',
        'X-Title': 'ForexRadar7 Chart Analysis'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenRouter API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const parsedResponse = await response.json() as OpenRouterResponse;
    
    console.log("✅ OpenRouter API response received:", {
      hasChoices: !!parsedResponse.choices,
      choicesLength: parsedResponse.choices?.length,
      hasContent: !!parsedResponse.choices?.[0]?.message?.content,
      usage: parsedResponse.usage
    });

    return parsedResponse;
  }
}
