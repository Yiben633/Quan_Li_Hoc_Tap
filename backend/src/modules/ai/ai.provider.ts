import { env } from '../../config/env.js';
import { GeminiAIProvider } from './providers/gemini-ai.provider.js';
import { MockAIProvider } from './providers/mock-ai.provider.js';
import { OpenAIAIProvider } from './providers/openai-ai.provider.js';

export interface AIProvider {
  chat(prompt: string): Promise<string>;
  chatStream?(prompt: string): AsyncIterable<string>;
  summarize(text: string): Promise<string>;
  generateFlashcards(text: string, count: number): Promise<Array<{ question: string; answer: string }>>;
  coach(prompt: string): Promise<unknown>;
  chatWithUsage?(prompt: string): Promise<AIProviderCallResult<string>>;
  summarizeWithUsage?(text: string): Promise<AIProviderCallResult<string>>;
  generateFlashcardsWithUsage?(text: string, count: number): Promise<AIProviderCallResult<Array<{ question: string; answer: string }>>>;
  coachWithUsage?(prompt: string): Promise<AIProviderCallResult<unknown>>;
}

export type AIProviderUsage = {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
};

export type AIProviderCallResult<T> = {
  value: T;
  usage?: AIProviderUsage;
};

export type AIProviderName = 'mock' | 'openai' | 'gemini';

export type AIProviderConfig = {
  provider: AIProviderName;
  openaiApiKey?: string;
  openaiModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
};

export const AI_PROVIDER_UNAVAILABLE_MESSAGE = 'Trợ lý AI đang tạm thời không phản hồi. Các chức năng StudyFlow khác vẫn hoạt động bình thường.';

export class AIProviderError extends Error {
  readonly statusCode: number;
  readonly providerStatusCode?: number;
  readonly providerCode?: string;
  readonly providerType?: string;

  constructor(
    message = AI_PROVIDER_UNAVAILABLE_MESSAGE,
    statusCode = 503,
    details: {
      providerStatusCode?: number;
      providerCode?: string;
      providerType?: string;
    } = {},
  ) {
    super(message);
    this.name = 'AIProviderError';
    this.statusCode = statusCode;
    this.providerStatusCode = details.providerStatusCode;
    this.providerCode = details.providerCode;
    this.providerType = details.providerType;
  }
}

export function normalizeAIProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;

  const providerError = typeof error === 'object' && error !== null
    ? error as Record<string, unknown>
    : undefined;
  const providerStatusCode = typeof providerError?.status === 'number' ? providerError.status : undefined;
  const providerCode = typeof providerError?.code === 'string' ? providerError.code : undefined;
  const providerType = typeof providerError?.type === 'string' ? providerError.type : undefined;

  return new AIProviderError(undefined, 503, {
    ...(providerStatusCode === undefined ? {} : { providerStatusCode }),
    ...(providerCode === undefined ? {} : { providerCode }),
    ...(providerType === undefined ? {} : { providerType }),
  });
}

export function createAIProvider(config: AIProviderConfig): AIProvider {
  if (config.provider === 'mock') return new MockAIProvider();

  if (config.provider === 'openai') {
    if (!config.openaiApiKey) {
      throw new AIProviderError('OPENAI_API_KEY is required when AI_PROVIDER=openai', 500);
    }

    return new OpenAIAIProvider({
      apiKey: config.openaiApiKey,
      model: config.openaiModel || 'gpt-4.1-mini',
    });
  }

  if (!config.geminiApiKey) {
    throw new AIProviderError('GEMINI_API_KEY is required when AI_PROVIDER=gemini', 500);
  }

  return new GeminiAIProvider({
    apiKey: config.geminiApiKey,
    model: config.geminiModel || 'gemini-2.5-flash',
  });
}

export const aiProviderName: AIProviderName = env.AI_PROVIDER;
export const aiProvider = createAIProvider({
  provider: aiProviderName,
  openaiApiKey: env.OPENAI_API_KEY,
  openaiModel: env.OPENAI_MODEL,
  geminiApiKey: env.GEMINI_API_KEY,
  geminiModel: env.GEMINI_MODEL,
});
