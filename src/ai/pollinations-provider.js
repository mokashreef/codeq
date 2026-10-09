/**
 * Real Zero-Key Cloud AI Provider using Pollinations AI
 * Free, legal, zero user-provided keys, zero login, full streaming SSE support.
 */

import { CODEQ_SYSTEM_PROMPT } from './types.js';

export class PollinationsProvider {
  constructor() {
    this.endpoint = 'https://text.pollinations.ai/';
    this.model = 'openai-fast';
  }

  /**
   * Generates a streaming response for the given conversation messages.
   * @param {Array} messages [{ role: 'user'|'assistant', content: string }]
   * @param {function} onChunk Callback receiving text delta
   * @param {object} options
   */
  async generateStream(messages, onChunk, options = {}) {
    const fullMessages = [
      { role: 'system', content: CODEQ_SYSTEM_PROMPT },
      ...messages,
    ];

    const modelName = options.model || this.model;
    const startTime = performance.now();
    let accumulatedText = '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s safety timeout

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: fullMessages,
          model: modelName,
          stream: true,
          seed: Math.floor(Math.random() * 100000),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`خطأ في استجابة المزوّد السحابي (${response.status}): ${errorBody || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('لم يتم استلام تدفق بيانات من المزوّد السحابي.');
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
          if (!trimmed) continue;

          // Standard OpenAI-compatible SSE format: data: {...}
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                accumulatedText += delta;
                onChunk(delta);
              }
            } catch {
              // Non-JSON SSE chunk fallback
              if (dataStr && dataStr !== '[DONE]') {
                accumulatedText += dataStr;
                onChunk(dataStr);
              }
            }
          }
        }
      }

      // If buffer still has remaining content
      if (buffer.trim() && buffer.trim().startsWith('data:')) {
        const dataStr = buffer.trim().slice(5).trim();
        if (dataStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulatedText += delta;
              onChunk(delta);
            }
          } catch {}
        }
      }

      // If for any reason streaming yielded nothing, attempt a fallback non-streaming fetch
      if (!accumulatedText.trim()) {
        const fallbackRes = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: fullMessages,
            model: modelName,
            stream: false,
          }),
        });
        if (fallbackRes.ok) {
          const text = await fallbackRes.text();
          accumulatedText = text;
          onChunk(text);
        } else {
          throw new Error('لم يُرجع المزوّد السحابي أي إجابة نصية.');
        }
      }

      // Clean up promotional footer if present
      accumulatedText = this.cleanPromo(accumulatedText);

      const durationMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        text: accumulatedText,
        durationMs,
        modelId: modelName,
        provider: 'cloud-pollinations',
        providerName: 'سحابي مجاني (Pollinations AI)',
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('انتهت مهلة استجابة المزوّد السحابي (Timeout). يرجى التحقق من اتصال الإنترنت.');
      }
      throw error;
    }
  }

  /**
   * Strips promotional lines automatically added by the free tier
   */
  cleanPromo(text) {
    if (!text) return '';
    return text
      .replace(/---\s*\*\*Support Pollinations\.AI:\*\*[\s\S]*$/gi, '')
      .replace(/🌸\s*\*\*Ad\*\*[\s\S]*$/gi, '')
      .trim();
  }
}
