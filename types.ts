export enum GPUProfile {
  LOW = 'Integrated Graphics / CPU',
  MID = 'NVIDIA RTX 3060/4060 (8GB)',
  HIGH = 'NVIDIA RTX 3090/4090 (24GB+)',
}

export interface AppConfig {
  gpuProfile: GPUProfile;
  features: {
    textToImage: boolean;
    imageToVideo: boolean;
    documentUpload: boolean;
    webSearch: boolean;
    deepThinking: boolean;
  };
  llmProvider: 'gemini' | 'ollama' | 'openai';
}

export interface GeneratedScript {
  filename: string;
  content: string;
  language: 'python' | 'powershell' | 'text';
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}