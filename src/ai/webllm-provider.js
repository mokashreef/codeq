/**
 * WebLLM In-Browser AI Provider
 * Runs LLM models locally inside the user's browser using WebGPU.
 * Zero API keys, zero external backend, works offline once cached.
 */

import { CODEQ_SYSTEM_PROMPT } from './types.js';

export class WebLLMProvider {
  constructor() {
    this.engine = null;
    this.currentModelId = null;
    this.isLoading = false;
    this.webllmModule = null;
    this.abortController = null;
  }

  /**
   * Lazily loads the WebLLM module to keep the initial page bundle light.
   */
  async loadModule() {
    if (!this.webllmModule) {
      this.webllmModule = await import('@mlc-ai/web-llm');
    }
    return this.webllmModule;
  }

  /**
   * Initializes or switches the local MLC model.
   * @param {string} modelId
   * @param {function} onProgress Callback receiving { text, progress, timeElapsed }
   */
  async initModel(modelId, onProgress = () => {}) {
    if (this.engine && this.currentModelId === modelId) {
      return this.engine;
    }

    this.isLoading = true;
    try {
      const webllm = await this.loadModule();

      // If an existing engine is loaded with another model, unload it to free GPU memory
      if (this.engine) {
        try {
          await this.engine.unload();
        } catch (e) {
          console.warn('Error unloading previous model:', e);
        }
        this.engine = null;
      }

      onProgress({
        text: `جاري تهيئة بيئة WebGPU للنموذج ${modelId}...`,
        progress: 0.05,
      });

      this.engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          onProgress({
            text: report.text,
            progress: report.progress !== undefined ? report.progress : 0.5,
            timeElapsed: report.timeElapsed,
          });
        },
      });

      this.currentModelId = modelId;
      this.isLoading = false;
      return this.engine;
    } catch (error) {
      this.isLoading = false;
      this.engine = null;
      this.currentModelId = null;
      throw new Error(`فشل تحميل النموذج المحلي (${modelId}): ${error.message}`);
    }
  }

  /**
   * Generates a streaming response for the given messages.
   * @param {Array} messages [{ role: 'user'|'assistant', content: string }]
   * @param {function} onChunk Callback receiving text delta chunk
   * @param {object} options
   */
  async generateStream(messages, onChunk, options = {}) {
    if (!this.engine) {
      throw new Error('محرك WebLLM لم يتم تهيئته بعد. يرجى اختيار نموذج وتحميله أولاً.');
    }

    const fullMessages = [
      { role: 'system', content: CODEQ_SYSTEM_PROMPT },
      ...messages,
    ];

    const startTime = performance.now();
    let totalChars = 0;

    try {
      const chunks = await this.engine.chat.completions.create({
        messages: fullMessages,
        stream: true,
        temperature: options.temperature || 0.6,
        max_tokens: options.max_tokens || 2048,
      });

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          totalChars += delta.length;
          onChunk(delta);
        }
      }

      const durationMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        durationMs,
        charCount: totalChars,
        modelId: this.currentModelId,
        provider: 'webllm',
      };
    } catch (error) {
      console.error('WebLLM generation error:', error);
      throw new Error(`حدث خطأ أثناء توليد الإجابة محلياً: ${error.message}`);
    }
  }

  /**
   * Unload model and free GPU VRAM
   */
  async unload() {
    if (this.engine) {
      try {
        await this.engine.unload();
      } catch (err) {
        console.warn('Error during unload:', err);
      }
      this.engine = null;
      this.currentModelId = null;
    }
  }

  isLoaded() {
    return !!this.engine;
  }
}
