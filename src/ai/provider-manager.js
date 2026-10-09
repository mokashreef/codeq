/**
 * Unified AI Provider Manager for CodeQ
 * Real Zero-Key Cloud AI (Pollinations), In-Browser WebLLM, and Optional Custom BYOK.
 */

import {
  PROVIDER_TYPES,
  CLOUD_MODELS,
  WEBGPU_MODELS,
} from './types.js';
import { PollinationsProvider } from './pollinations-provider.js';
import { WebLLMProvider } from './webllm-provider.js';
import { CustomProvider } from './custom-provider.js';
import { detectWebGPU } from './webgpu-detect.js';

export class AIProviderManager {
  constructor() {
    this.cloud = new PollinationsProvider();
    this.webllm = new WebLLMProvider();
    this.custom = new CustomProvider();

    // Default to verified zero-key cloud AI
    this.providerType = PROVIDER_TYPES.CLOUD;
    this.selectedModel = 'openai-fast';
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
      // Ignore localStorage errors
    }
  }

  savePreferences() {
    try {
      localStorage.setItem('codeq_active_provider', this.providerType);
      localStorage.setItem('codeq_active_model', this.selectedModel);
    } catch {
      // Ignore localStorage errors
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
      throw new Error(`نوع المزوّد غير صالح: ${providerType}`);
    }

    this.providerType = providerType;

    if (modelId) {
      this.selectedModel = modelId;
    } else {
      if (providerType === PROVIDER_TYPES.CLOUD) {
        this.selectedModel = CLOUD_MODELS[0].id;
      } else if (providerType === PROVIDER_TYPES.WEBGPU) {
        this.selectedModel = this.webgpuStatus?.recommendedModel || WEBGPU_MODELS[0].id;
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
      isCloud: this.providerType === PROVIDER_TYPES.CLOUD,
      isWebGPU: this.providerType === PROVIDER_TYPES.WEBGPU,
      isCustom: this.providerType === PROVIDER_TYPES.CUSTOM,
      providerLabel: this.getProviderLabel(),
    };
  }

  getProviderLabel() {
    if (this.providerType === PROVIDER_TYPES.CLOUD) {
      return 'سحابي مجاني (بدون مفتاح)';
    }
    if (this.providerType === PROVIDER_TYPES.WEBGPU) {
      return 'محلي في المتصفح (WebGPU)';
    }
    return 'مفتاح خاص (BYOK)';
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

    // Handle Local In-Browser WebGPU execution
    if (this.providerType === PROVIDER_TYPES.WEBGPU) {
      const gpu = await this.checkHardwareCapabilities();
      if (!gpu.isSupported) {
        throw new Error(`البيئة الحالية لا تدعم تشغيل النماذج محلياً عبر WebGPU:\n${gpu.reason}\n\nيرجى التبديل إلى "المزوّد السحابي المجاني" للبدء فوراً.`);
      }

      onProgress({ text: `جاري تهيئة النموذج المحلي (${this.selectedModel})...`, progress: 0.1 });
      await this.webllm.initModel(this.selectedModel, onProgress);

      const result = await this.webllm.generateStream(messages, onChunk);
      return {
        ...result,
        providerName: 'محلي (WebGPU WebLLM)',
      };
    }

    // Handle Custom BYOK execution
    if (this.providerType === PROVIDER_TYPES.CUSTOM) {
      if (!this.custom.hasKey()) {
        throw new Error('لم يتم إدخال مفتاح API في إعدادات المزوّد المخصص (BYOK).');
      }
      onProgress({ text: 'جاري الاتصال بنقطة النهاية المخصصة...', progress: 0.5 });
      const result = await this.custom.generateStream(messages, onChunk, {
        model: this.selectedModel,
      });
      return {
        ...result,
        providerName: 'مزوّد مخصص (BYOK)',
      };
    }

    // Default: Cloud Free AI (Pollinations)
    onProgress({ text: 'جاري إرسال السؤال إلى المزوّد السحابي المجاني...', progress: 0.3 });
    const result = await this.cloud.generateStream(messages, onChunk, {
      model: this.selectedModel,
    });
    return result;
  }
}
