/**
 * Optional BYOK (Bring Your Own Key) Provider
 * Allows power users to optionally provide their own custom API endpoint and key,
 * stored strictly in their local browser storage.
 */

import { CODEQ_SYSTEM_PROMPT } from './types.js';

export class CustomProvider {
  constructor() {
    this.storageKey = 'codeq_custom_provider_config';
  }

  getConfig() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {
        endpoint: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o-mini',
      };
    } catch {
      return {
        endpoint: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o-mini',
      };
    }
  }

  saveConfig(config) {
    localStorage.setItem(this.storageKey, JSON.stringify(config));
  }

  clearConfig() {
    localStorage.removeItem(this.storageKey);
  }

  hasKey() {
    const config = this.getConfig();
    return !!(config.apiKey && config.apiKey.trim().length > 5);
  }

  /**
   * Generates a streaming response via an OpenAI-compatible HTTP endpoint.
   */
  async generateStream(messages, onChunk, options = {}) {
    const config = this.getConfig();
    if (!this.hasKey()) {
      throw new Error('لم يتم تعيين مفتاح API الخاص بك. يمكنك تعيينه في الإعدادات أو استخدام النماذج المجانية المتاحة تلقائياً.');
    }

    const endpoint = (config.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const model = options.model || config.model || 'gpt-4o-mini';

    const fullMessages = [
      { role: 'system', content: CODEQ_SYSTEM_PROMPT },
      ...messages,
    ];

    const startTime = performance.now();
    let totalChars = 0;

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        stream: true,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`خطأ في استدعاء الـ API (${response.status}): ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            totalChars += delta.length;
            onChunk(delta);
          }
        } catch {
          // ignore malformed SSE line
        }
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    return {
      success: true,
      durationMs,
      charCount: totalChars,
      modelId: model,
      provider: 'custom',
    };
  }
}
