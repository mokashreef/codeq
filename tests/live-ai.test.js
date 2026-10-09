import { describe, it, expect } from 'vitest';
import { PollinationsProvider } from '../src/ai/pollinations-provider.js';

describe('Real Live Cloud AI Verification (No Keys Required)', () => {
  it('generates real Arabic coding response without fake mocks or API keys', async () => {
    const provider = new PollinationsProvider();
    const chunks = [];

    const result = await provider.generateStream(
      [{ role: 'user', content: 'ما هو الأمر البرمجي لطباعة نص في بايثون؟ أجب في سطر واحد فقط.' }],
      (chunk) => chunks.push(chunk)
    );

    expect(result.success).toBe(true);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(chunks.length).toBeGreaterThan(0);

    const fullResponse = chunks.join('');
    expect(fullResponse.length).toBeGreaterThan(5);
    expect(fullResponse.toLowerCase()).toContain('print');
    expect(fullResponse).not.toContain('الكود سيكون هنا في الإصدار الكامل');
  }, 35000); // 35s timeout for live API test
});
