import { env } from '../../config/env.js';

export interface AIProvider { chat(prompt: string): Promise<string>; summarize(text: string): Promise<string>; generateFlashcards(text: string, count: number): Promise<Array<{ question: string; answer: string }>>; }
export class MockAIProvider implements AIProvider { async chat(prompt: string) { return `Mock assistant response for: ${prompt}`; } async summarize(text: string) { return text.trim().split(/\s+/).slice(0, 80).join(' '); } async generateFlashcards(text: string, count: number) { const words = text.trim().split(/\s+/); return Array.from({ length: Math.min(count, Math.max(1, Math.ceil(words.length / 12))) }, (_, index) => ({ question: `Key point ${index + 1}`, answer: words.slice(index * 12, index * 12 + 12).join(' ') })); } }
export const aiProvider: AIProvider = new MockAIProvider();
export const aiProviderName = env.AI_PROVIDER;
