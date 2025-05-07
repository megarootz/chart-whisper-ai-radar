
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
}

interface Candidate {
  content: Content;
  finishReason: string;
  index: number;
}
