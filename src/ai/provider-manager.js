/**
 * Unified AI Provider Manager for CodeQ
 * Seamlessly manages In-Browser WebLLM, Zero-Key Puter Cloud, and optional Custom BYOK.
 */

import {
  PROVIDER_TYPES,
  WEBGPU_MODELS,
  PUTER_MODELS,
} from './types.js';
import { WebLLMProvider } from './webllm-provider.js';
import { PuterProvider } from './puter-provider.js';
import { CustomProvider } from './custom-provider.js';
import { detectWebGPU } from './webgpu-detect.js';

export class AIProviderManager {
  constructor() {
    this.webllm = new WebLLMProvider();
    this.puter = new PuterProvider();
    this.custom = new CustomProvider();

    // Default provider and models
    this.providerType = PROVIDER_TYPES.PUTER; // Defaults to instant zero-key cloud for immediate experience
    this.selectedModel = 'gpt-4o-mini';
    this.webgpuStatus = null;

    this.loadPersistedPreferences();
  }

  loadPersistedPreferences() {
    try {
      const savedProvider = localStorage.getItem('codeq_active_provider');
      const savedModel = localStorage.getItem('codeq_active_model');
      if (savedProvider && Object.values(PROVIDER_TYPES).includes(savedProvider)) {
        this.providerType = savedProvider;
      }
      if (savedModel) {
        this.selectedModel = savedModel;
      }
    } catch {
      // Ignore storage errors
    }
  }

  savePreferences() {
    try {
      localStorage.setItem('codeq_active_provider', this.providerType);
      localStorage.setItem('codeq_active_model', this.selectedModel);
    } catch {
      // Ignore storage errors
    }
  }

  async checkHardwareCapabilities() {
    if (!this.webgpuStatus) {
      this.webgpuStatus = await detectWebGPU();
    }
    return this.webgpuStatus;
  }

  setProvider(providerType, modelId = null) {
    if (!Object.values(PROVIDER_TYPES).includes(providerType)) {
      throw new Error(`نوع المزود غير صالح: ${providerType}`);
    }

    this.providerType = providerType;

    if (modelId) {
      this.selectedModel = modelId;
    } else {
      // Pick sensible default for provider
      if (providerType === PROVIDER_TYPES.WEBGPU) {
        this.selectedModel = this.webgpuStatus?.recommendedModel || WEBGPU_MODELS[0].id;
      } else if (providerType === PROVIDER_TYPES.PUTER) {
        this.selectedModel = PUTER_MODELS[1].id; // gpt-4o-mini
      } else if (providerType === PROVIDER_TYPES.CUSTOM) {
        this.selectedModel = this.custom.getConfig().model || 'gpt-4o-mini';
      }
    }

    this.savePreferences();
    return {
      providerType: this.providerType,
      selectedModel: this.selectedModel,
    };
  }

  getActiveConfig() {
    return {
      providerType: this.providerType,
      selectedModel: this.selectedModel,
      isWebGPU: this.providerType === PROVIDER_TYPES.WEBGPU,
      isPuter: this.providerType === PROVIDER_TYPES.PUTER,
      isCustom: this.providerType === PROVIDER_TYPES.CUSTOM,
    };
  }

  /**
   * Initializes the active model if needed (especially for WebLLM download/cache).
   */
  async ensureReady(onProgress = () => {}) {
    if (this.providerType === PROVIDER_TYPES.WEBGPU) {
      const gpu = await this.checkHardwareCapabilities();
      if (!gpu.isSupported) {
        throw new Error(gpu.reason || 'المتصفح لا يدعم WebGPU لتشغيل النموذج محلياً.');
      }
      return await this.webllm.initModel(this.selectedModel, onProgress);
    }

    if (this.providerType === PROVIDER_TYPES.PUTER) {
      onProgress({ text: 'جاري التحقق من خدمة الذكاء الاصطناعي السحابية المجانية...', progress: 0.5 });
      const puter = await this.puter.ensurePuter();
      onProgress({ text: 'الخدمة جاهزة للاستخدام الفوري.', progress: 1.0 });
      return puter;
    }

    if (this.providerType === PROVIDER_TYPES.CUSTOM) {
      if (!this.custom.hasKey()) {
        throw new Error('لم تقم بتعيين مفتاح API خاص بك في إعدادات BYOK.');
      }
      return true;
    }
  }

  /**
   * Primary entry point for asking a question.
   * Streams the response in real time to onChunk callback.
   */
  async ask({ question, language = '', conversationHistory = [], onProgress = () => {}, onChunk = () => {} }) {
    if (!question || !question.trim()) {
      throw new Error('يرجى إدخال السؤال البرمجي.');
    }

    // Build conversation context
    const messages = [];

    // Append prior thread history
    for (const item of conversationHistory) {
      if (item.question) {
        messages.push({ role: 'user', content: item.question });
      }
      if (item.answer) {
        messages.push({ role: 'assistant', content: item.answer });
      }
    }

    // Prepare current prompt with explicit language context if specified
    let userPrompt = question.trim();
    if (language && language !== 'general') {
      userPrompt = `[لغة البرمجة: ${language}]\n\n${userPrompt}`;
    }
    messages.push({ role: 'user', content: userPrompt });

    // Step 1: Ensure provider is initialized
    await this.ensureReady(onProgress);

    // Step 2: Stream response based on active provider
    try {
      if (this.providerType === PROVIDER_TYPES.WEBGPU) {
        return await this.webllm.generateStream(messages, onChunk);
      }

      if (this.providerType === PROVIDER_TYPES.PUTER) {
        return await this.puter.generateStream(messages, onChunk, {
          model: this.selectedModel,
        });
      }

      if (this.providerType === PROVIDER_TYPES.CUSTOM) {
        return await this.custom.generateStream(messages, onChunk, {
          model: this.selectedModel,
        });
      }
    } catch (primaryError) {
      console.warn(`Primary provider (${this.providerType}) failed:`, primaryError);

      // Auto-fallback: If WebLLM fails (e.g. out of memory on device), offer or fallback to Puter
      if (this.providerType === PROVIDER_TYPES.WEBGPU) {
        onProgress({
          text: 'تعذر تشغيل النموذج المحلي على هذا الجهاز. جاري التحويل التلقائي للمزود السحابي المجاني...',
          progress: 0.8,
        });
        return await this.puter.generateStream(messages, onChunk, {
          model: 'gpt-4o-mini',
        });
      }

      throw primaryError;
    }
  }
}
