import { describe, it, expect, beforeEach } from 'vitest';
import { AIProviderManager } from '../src/ai/provider-manager.js';
import { PROVIDER_TYPES, WEBGPU_MODELS, PUTER_MODELS } from '../src/ai/types.js';
import { detectWebGPU } from '../src/ai/webgpu-detect.js';

describe('AI Provider Management & Detection', () => {
  let manager;

  beforeEach(() => {
    manager = new AIProviderManager();
  });

  it('initializes with default zero-key provider', () => {
    const config = manager.getActiveConfig();
    expect(config.providerType).toBe(PROVIDER_TYPES.PUTER);
    expect(config.selectedModel).toBe('gpt-4o-mini');
  });

  it('switches to WebGPU in-browser provider seamlessly', () => {
    manager.setProvider(PROVIDER_TYPES.WEBGPU, 'SmolLM2-360M-Instruct-q4f16_1-MLC');
    const config = manager.getActiveConfig();
    expect(config.isWebGPU).toBe(true);
    expect(config.selectedModel).toBe('SmolLM2-360M-Instruct-q4f16_1-MLC');
  });

  it('throws error when setting invalid provider type', () => {
    expect(() => {
      manager.setProvider('unknown_provider');
    }).toThrow('نوع المزود غير صالح');
  });

  it('contains valid predefined models for WebLLM and Puter', () => {
    expect(WEBGPU_MODELS.length).toBeGreaterThanOrEqual(3);
    expect(PUTER_MODELS.length).toBeGreaterThanOrEqual(3);

    const smolModel = WEBGPU_MODELS.find(m => m.id.includes('SmolLM2'));
    expect(smolModel).toBeDefined();
    expect(smolModel.size).toBeDefined();

    const claudeModel = PUTER_MODELS.find(m => m.id.includes('claude'));
    expect(claudeModel).toBeDefined();
  });

  it('detectWebGPU gracefully reports when window/gpu is undefined in node', async () => {
    const report = await detectWebGPU();
    expect(report.isSupported).toBe(false);
    expect(report.reason).toBeDefined();
  });
});
