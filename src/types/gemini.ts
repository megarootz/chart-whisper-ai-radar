// Keeping this file for backwards compatibility
// New implementation uses OpenAI API via src/types/openai.ts

export interface GeminiRequest {
  contents: Content[];
}

interface Content {
  role: string;
  parts: Part[];
}

interface Part {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

export interface GeminiResponse {
  candidates: Candidate[];
  promptFeedback?: {
    blockReason?: string;
  };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

interface Candidate {
  content: Content;
  finishReason: string;
  index: number;
  safetyRatings?: SafetyRating[];
}

interface SafetyRating {
  category: string;
  probability: string;
}
