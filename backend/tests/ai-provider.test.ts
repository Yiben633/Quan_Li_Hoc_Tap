import { AI_PROVIDER_UNAVAILABLE_MESSAGE, aiProvider, createAIProvider, normalizeAIProviderError } from '../src/modules/ai/ai.provider.js';
import { MockAIProvider } from '../src/modules/ai/providers/mock-ai.provider.js';
import { GeminiAIProvider } from '../src/modules/ai/providers/gemini-ai.provider.js';
import { OpenAIAIProvider } from '../src/modules/ai/providers/openai-ai.provider.js';

describe('AI provider selection', () => {
  it('uses MockAIProvider when AI_PROVIDER=mock', () => {
    expect(aiProvider).toBeInstanceOf(MockAIProvider);
    expect(createAIProvider({ provider: 'mock', openaiModel: 'gpt-4.1-mini' })).toBeInstanceOf(MockAIProvider);
  });

  it('returns a clear configuration error when OpenAI is selected without a key', () => {
    expect(() => createAIProvider({ provider: 'openai', openaiModel: 'gpt-4.1-mini' })).toThrow(
      'OPENAI_API_KEY is required when AI_PROVIDER=openai',
    );
  });

  it('creates an OpenAI adapter without performing a network request', () => {
    const provider = createAIProvider({
      provider: 'openai',
      openaiApiKey: 'test-key-not-used-for-network-calls',
      openaiModel: 'gpt-4.1-mini',
    });

    expect(provider).toBeInstanceOf(OpenAIAIProvider);
  });

  it('returns a clear configuration error when Gemini is selected without a key', () => {
    expect(() => createAIProvider({ provider: 'gemini' })).toThrow(
      'GEMINI_API_KEY is required when AI_PROVIDER=gemini',
    );
  });

  it('creates a Gemini adapter without performing a network request', () => {
    const provider = createAIProvider({
      provider: 'gemini',
      geminiApiKey: 'test-key-not-used-for-network-calls',
      geminiModel: 'gemini-2.5-flash',
    });

    expect(provider).toBeInstanceOf(GeminiAIProvider);
  });

  it('normalizes unexpected provider failures without exposing sensitive details', () => {
    const error = normalizeAIProviderError(new Error('401 Authorization: Bearer sk-sensitive-key'));

    expect(error.message).toBe(AI_PROVIDER_UNAVAILABLE_MESSAGE);
    expect(error.message).not.toContain('sk-sensitive-key');
    expect(error.statusCode).toBe(503);
  });
});

const runOpenAIIntegration = process.env.RUN_OPENAI_INTEGRATION_TESTS === 'true';
const openAIKey = process.env.OPENAI_API_KEY;
const describeOpenAIIntegration = runOpenAIIntegration && openAIKey ? describe : describe.skip;

describeOpenAIIntegration('OpenAI provider integration', () => {
  it('calls the Responses API only when explicitly enabled', async () => {
    const provider = new OpenAIAIProvider({
      apiKey: openAIKey!,
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    });

    await expect(provider.chat('Reply with one short Vietnamese greeting.')).resolves.toMatch(/\S/);
  }, 30_000);
});
