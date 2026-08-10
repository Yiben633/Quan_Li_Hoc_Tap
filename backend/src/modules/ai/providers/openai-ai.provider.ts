import OpenAI from 'openai';
import type { AIProvider } from '../ai.provider.js';
import { AIProviderError, normalizeAIProviderError } from '../ai.provider.js';

type OpenAIProviderOptions = {
  apiKey: string;
  model: string;
};

type Flashcard = {
  question: string;
  answer: string;
};

export class OpenAIAIProvider implements AIProvider {
  private readonly client: OpenAI;

  constructor(private readonly options: OpenAIProviderOptions) {
    this.client = new OpenAI({ apiKey: options.apiKey });
  }

  async chat(prompt: string): Promise<string> {
    return this.createTextResponse(prompt);
  }

  async summarize(text: string): Promise<string> {
    return this.createTextResponse([
      'Summarize the following content accurately and concisely.',
      'Preserve key facts and use the same language as the source when practical.',
      '',
      text,
    ].join('\n'));
  }

  async generateFlashcards(text: string, count: number): Promise<Flashcard[]> {
    const output = await this.createTextResponse([
      `Create at most ${count} concise study flashcards from the content below.`,
      'Return only a valid JSON array. Each item must have string fields "question" and "answer".',
      '',
      text,
    ].join('\n'));

    try {
      const parsed: unknown = JSON.parse(output);
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
      return cards;
    } catch {
      throw new AIProviderError('AI provider returned an invalid flashcard response');
    }
  }

  async coach(prompt: string): Promise<unknown> {
    const output = await this.createTextResponse([
      'Return only a valid JSON object. Do not wrap it in Markdown.',
      'The object must contain intent, confidence, and optional subjectIds, taskIds, dateRange, constraints, and missingInformation fields.',
      '',
      prompt,
    ].join('\n'));

    try {
      return JSON.parse(output) as unknown;
    } catch {
      throw new AIProviderError('AI provider returned an invalid structured response');
    }
  }

  private async createTextResponse(input: string): Promise<string> {
    try {
      const response = await this.client.responses.create({
        model: this.options.model,
        input,
      });
      const output = response.output_text.trim();
      if (!output) throw new AIProviderError('AI provider returned an empty response');
      return output;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw normalizeAIProviderError(error);
    }
  }
}
