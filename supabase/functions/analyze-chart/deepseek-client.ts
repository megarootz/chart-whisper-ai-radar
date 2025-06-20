
import { DeepSeekRequest, DeepSeekResponse } from './types.ts';

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl = "https://api.deepseek.com/chat/completions";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async makeRequest(requestData: DeepSeekRequest, maxAttempts = 3): Promise<DeepSeekResponse> {
    let response: Response;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📤 API call attempt ${attempts}/${maxAttempts}`);
      
      try {
        response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          console.log("✅ API call successful");
          break;
        } else {
          const errorText = await response.text();
          console.error(`❌ API call failed (attempt ${attempts}):`, response.status, errorText);
          
          if (response.status === 400) {
            throw new Error(`Invalid request: ${errorText}`);
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please check API key.");
          } else if (response.status === 429 && attempts < maxAttempts) {
            console.log("⚠️ Rate limit hit, waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
            continue;
          }
          
          if (attempts === maxAttempts) {
            throw new Error(`API call failed after ${maxAttempts} attempts: ${response.status} - ${errorText}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ API call error (attempt ${attempts}):`, error);
        
        if (attempts === maxAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    console.log("📈 API Response status:", response!.status);
    
    const responseText = await response!.text();
    console.log("📄 Response received, length:", responseText.length);
    
    if (!response!.ok) {
      console.error("❌ API Error Response:", responseText);
      throw new Error(`API request failed: ${response!.status} - ${responseText}`);
    }
    
    let parsedResponse: DeepSeekResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse API response:", parseError);
      console.error("❌ Raw response:", responseText.substring(0, 500));
      throw new Error("Invalid response format from AI API");
    }
    
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
      console.error("❌ Invalid response structure:", parsedResponse);
      throw new Error("No analysis content received from AI");
    }
    
    return parsedResponse;
  }
}
