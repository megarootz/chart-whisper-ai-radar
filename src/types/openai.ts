
export interface OpenAIRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message?: string;
    type?: string;
    param?: string;
    code?: string;
  };
}

interface Choice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

// Adding standalone error response interface for OpenRouter API
export interface OpenRouterErrorResponse {
  error?: {
    message?: string;
    type?: string;
    param?: string;
    code?: string;
  };
}
