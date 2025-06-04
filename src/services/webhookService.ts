
export interface WebhookAnalysisRequest {
  pairName: string;
  userId?: string;
  userEmail?: string;
}

export interface WebhookAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class WebhookService {
  private static readonly N8N_WEBHOOK_URL = 'https://megarootz181.app.n8n.cloud/webhook-test/92ea5fbb-7aba-4a49-938b-a831e3c65757';

  static async sendAnalysisRequest(request: WebhookAnalysisRequest): Promise<WebhookAnalysisResponse> {
    try {
      console.log('🔗 Sending analysis request to n8n webhook:', request);
      
      const response = await fetch(this.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_pair',
          pairName: request.pairName,
          userId: request.userId,
          userEmail: request.userEmail,
          timestamp: new Date().toISOString(),
          source: 'ForexRadar7'
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Webhook response received:', data);

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ Webhook request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown webhook error'
      };
    }
  }
}
