/**
 * Puter.js Free Cloud AI Provider
 * Connects to top-tier AI models (Claude 3.5 Sonnet, GPT-4o-mini, DeepSeek)
 * Zero developer API keys, zero user payment, zero registration required.
 */

import { CODEQ_SYSTEM_PROMPT } from './types.js';

export class PuterProvider {
  constructor() {
    this.isScriptLoaded = false;
    this.loadPromise = null;
  }

  /**
   * Dynamically loads the official Puter.js v2 SDK from CDN if not already present.
   */
  async ensurePuter() {
    if (typeof window === 'undefined') {
      throw new Error('PuterProvider can only run in a browser environment.');
    }

    if (window.puter && window.puter.ai) {
      this.isScriptLoaded = true;
      return window.puter;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if script tag is already in DOM
      const existing = document.querySelector('script[src*="js.puter.com"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.puter));
        existing.addEventListener('error', () => reject(new Error('فشل تحميل Puter SDK')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        reject(new Error('انتهت مهلة تحميل خدمة Puter السحابية. يرجى التحقق من اتصال الإنترنت أو تجربة تشغيل النموذج المحلي.'));
      }, 12000);

      script.onload = () => {
        clearTimeout(timeout);
        this.isScriptLoaded = true;
        resolve(window.puter);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('تعذر الاتصال بخدمة Puter. قد يكون هناك مانع إعلانات أو قيود شبكة تعطل الرابط https://js.puter.com/v2/.'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Generates a streaming response using Puter.js
   * @param {Array} messages [{ role: 'user'|'assistant', content: string }]
   * @param {function} onChunk
   * @param {object} options
   */
  async generateStream(messages, onChunk, options = {}) {
    const puter = await this.ensurePuter();
    const model = options.model || 'gpt-4o-mini';

    // Format prompt messages with system prompt
    const fullMessages = [
      { role: 'system', content: CODEQ_SYSTEM_PROMPT },
      ...messages,
    ];

    const startTime = performance.now();
    let totalChars = 0;

    try {
      // Puter AI chat accepts array of messages and options
      const response = await puter.ai.chat(fullMessages, {
        model,
        stream: true,
      });

      if (!response) {
        throw new Error('لم يتم استلام أي استجابة من خدمة الذكاء الاصطناعي.');
      }

      // Check if response is an async iterable stream
      if (typeof response[Symbol.asyncIterator] === 'function') {
        for await (const part of response) {
          const text = part?.text || (typeof part === 'string' ? part : '');
          if (text) {
            totalChars += text.length;
            onChunk(text);
          }
        }
      } else if (response.message?.content) {
        // Fallback for non-streaming response
        const text = response.message.content;
        totalChars = text.length;
        onChunk(text);
      } else if (typeof response === 'string') {
        totalChars = response.length;
        onChunk(response);
      }

      const durationMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        durationMs,
        charCount: totalChars,
        modelId: model,
        provider: 'puter',
      };
    } catch (error) {
      console.error('Puter AI error:', error);
      throw new Error(`خطأ في خدمة الذكاء الاصطناعي المجانية (${model}): ${error.message || 'فشل الاتصال'}`);
    }
  }
}
