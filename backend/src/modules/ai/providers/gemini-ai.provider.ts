import { GoogleGenAI } from '@google/genai';
import type { AIProvider, AIProviderCallResult, AIProviderUsage } from '../ai.provider.js';
import { AIProviderError, normalizeAIProviderError } from '../ai.provider.js';

type GeminiProviderOptions = {
  apiKey: string;
  model: string;
};

type Flashcard = {
  question: string;
  answer: string;
};

export class GeminiAIProvider implements AIProvider {
  private readonly client: GoogleGenAI;

  constructor(private readonly options: GeminiProviderOptions) {
    this.client = new GoogleGenAI({ apiKey: options.apiKey });
  }

  async chat(prompt: string): Promise<string> {
    return (await this.chatWithUsage(prompt)).value;
  }

  async chatWithUsage(prompt: string): Promise<AIProviderCallResult<string>> {
    return this.createTextResponse(prompt);
  }

  async *chatStream(prompt: string): AsyncIterable<string> {
    try {
      const stream = await this.client.models.generateContentStream({
        model: this.options.model,
        contents: prompt,
      });

      for await (const chunk of stream) {
        const text = chunk.text?.trim();
        if (text) yield text;
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw normalizeAIProviderError(error);
    }
  }

  async summarize(text: string): Promise<string> {
    return (await this.summarizeWithUsage(text)).value;
  }

  async summarizeWithUsage(text: string): Promise<AIProviderCallResult<string>> {
    return this.createTextResponse([
      'Summarize the following content accurately and concisely.',
      'Preserve key facts and use the same language as the source when practical.',
      '',
      text,
    ].join('\n'));
  }

  async generateFlashcards(text: string, count: number): Promise<Flashcard[]> {
    return (await this.generateFlashcardsWithUsage(text, count)).value;
  }

  async generateFlashcardsWithUsage(text: string, count: number): Promise<AIProviderCallResult<Flashcard[]>> {
    const response = await this.createTextResponse([
      `Create at most ${count} concise study flashcards from the content below.`,
      'Return only a valid JSON array. Each item must have string fields "question" and "answer".',
      '',
      text,
    ].join('\n'), 'application/json');

    try {
      const parsed: unknown = JSON.parse(response.value);
      if (!Array.isArray(parsed)) throw new Error('Expected an array');

      const cards = parsed
        .filter((item): item is Flashcard => (
          typeof item === 'object'
          && item !== null
          && typeof (item as Record<string, unknown>).question === 'string'
          && typeof (item as Record<string, unknown>).answer === 'string'
        ))
        .slice(0, count)
        .map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }))
        .filter((item) => item.question.length > 0 && item.answer.length > 0);

      if (cards.length === 0) throw new Error('No valid cards');
      return { value: cards, ...(response.usage ? { usage: response.usage } : {}) };
    } catch {
      throw new AIProviderError('AI provider returned an invalid flashcard response');
    }
  }

  async coach(prompt: string): Promise<unknown> {
    return (await this.coachWithUsage(prompt)).value;
  }

  async coachWithUsage(prompt: string): Promise<AIProviderCallResult<unknown>> {
    const response = await this.createTextResponse([
      'Return only a valid JSON object.',
      'The object must contain intent, confidence, and optional subjectIds, taskIds, dateRange, constraints, and missingInformation fields.',
      '',
      prompt,
    ].join('\n'), 'application/json');

    try {
      return { value: JSON.parse(response.value) as unknown, ...(response.usage ? { usage: response.usage } : {}) };
    } catch {
      throw new AIProviderError('AI provider returned an invalid structured response');
    }
  }

  private async createTextResponse(
    input: string,
    responseMimeType?: string,
  ): Promise<AIProviderCallResult<string>> {
    try {
      const response = await this.client.models.generateContent({
        model: this.options.model,
        contents: input,
        ...(responseMimeType ? { config: { responseMimeType } } : {}),
      });
      const output = response.text?.trim();
      if (!output) throw new AIProviderError('AI provider returned an empty response');

      const usage: AIProviderUsage | undefined = response.usageMetadata
        ? {
          model: response.modelVersion || this.options.model,
          ...(response.usageMetadata.promptTokenCount === undefined
            ? {}
            : { inputTokens: response.usageMetadata.promptTokenCount }),
          ...(response.usageMetadata.candidatesTokenCount === undefined
            ? {}
            : { outputTokens: response.usageMetadata.candidatesTokenCount }),
        }
        : undefined;
      return { value: output, ...(usage ? { usage } : {}) };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw normalizeAIProviderError(error);
    }
  }
}
