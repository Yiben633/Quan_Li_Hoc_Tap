import type { AIProvider } from '../ai.provider.js';

export class MockAIProvider implements AIProvider {
  async chat(prompt: string): Promise<string> {
    return `Mock assistant response for: ${prompt}`;
  }

  async summarize(text: string): Promise<string> {
    return text.trim().split(/\s+/).slice(0, 80).join(' ');
  }

  async generateFlashcards(text: string, count: number): Promise<Array<{ question: string; answer: string }>> {
    const words = text.trim().split(/\s+/);
    const cardCount = Math.min(count, Math.max(1, Math.ceil(words.length / 12)));

    return Array.from({ length: cardCount }, (_, index) => ({
      question: `Key point ${index + 1}`,
      answer: words.slice(index * 12, index * 12 + 12).join(' '),
    }));
  }

  async coach(): Promise<unknown> {
    return {
      intent: 'clarify',
      confidence: 1,
      missingInformation: ['AI Coach dang o che do mock. Hay cau hinh provider de nhan phan tich ca nhan hoa.'],
    };
  }
}
