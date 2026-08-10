import { env } from '../../config/env.js';
import { MockAIProvider } from './providers/mock-ai.provider.js';
import { OpenAIAIProvider } from './providers/openai-ai.provider.js';

export interface AIProvider {
  chat(prompt: string): Promise<string>;
  summarize(text: string): Promise<string>;
  generateFlashcards(text: string, count: number): Promise<Array<{ question: string; answer: string }>>;
  coach(prompt: string): Promise<unknown>;
}

export type AIProviderName = 'mock' | 'openai';

export type AIProviderConfig = {
  provider: AIProviderName;
  openaiApiKey?: string;
  openaiModel: string;
};

export class AIProviderError extends Error {
  readonly statusCode: number;

  constructor(message = 'AI provider is temporarily unavailable', statusCode = 503) {
    super(message);
    this.name = 'AIProviderError';
    this.statusCode = statusCode;
  }
}

export function normalizeAIProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;
  return new AIProviderError();
}

export function createAIProvider(config: AIProviderConfig): AIProvider {
  if (config.provider === 'mock') return new MockAIProvider();

  if (!config.openaiApiKey) {
    throw new AIProviderError('OPENAI_API_KEY is required when AI_PROVIDER=openai', 500);
  }

  return new OpenAIAIProvider({
    apiKey: config.openaiApiKey,
    model: config.openaiModel,
  });
}

export const aiProviderName: AIProviderName = env.AI_PROVIDER;
export const aiProvider = createAIProvider({
  provider: aiProviderName,
  openaiApiKey: env.OPENAI_API_KEY,
  openaiModel: env.OPENAI_MODEL,
});
