import { describe, it, expect, beforeEach } from 'vitest';
import { AIProviderManager } from '../src/ai/provider-manager.js';
import { PROVIDER_TYPES, WEBGPU_MODELS, CLOUD_MODELS } from '../src/ai/types.js';
import { detectWebGPU } from '../src/ai/webgpu-detect.js';
import { ECOSYSTEM_PROJECTS, DEVELOPER_PROFILE } from '../src/data/ecosystem.js';

describe('AI Provider Management & Ecosystem Audit', () => {
  let manager;

  beforeEach(() => {
    manager = new AIProviderManager();
  });

  it('initializes with verified zero-key cloud AI provider by default', () => {
    const config = manager.getActiveConfig();
    expect(config.providerType).toBe(PROVIDER_TYPES.CLOUD);
    expect(config.selectedModel).toBe('openai-fast');
    expect(config.isCloud).toBe(true);
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
    }).toThrow('نوع المزوّد غير صالح');
  });

  it('defines valid models for both Cloud and WebGPU', () => {
    expect(CLOUD_MODELS.length).toBeGreaterThanOrEqual(1);
    expect(WEBGPU_MODELS.length).toBeGreaterThanOrEqual(3);

    const smolModel = WEBGPU_MODELS.find(m => m.id.includes('SmolLM2'));
    expect(smolModel).toBeDefined();
    expect(smolModel.size).toBeDefined();

    const qwenModel = WEBGPU_MODELS.find(m => m.id.includes('Qwen2.5-Coder'));
    expect(qwenModel).toBeDefined();
  });

  it('detectWebGPU gracefully reports when window/gpu is undefined in node', async () => {
    const report = await detectWebGPU();
    expect(report.isSupported).toBe(false);
    expect(report.reason).toBeDefined();
  });

  it('validates official Code Elta6ur ecosystem projects and developer data', () => {
    expect(DEVELOPER_PROFILE.name).toContain('محمد أبو خشريف');
    expect(DEVELOPER_PROFILE.portfolioUrl).toBe('https://mohammad.code-elta6ur.com/');
    expect(DEVELOPER_PROFILE.githubUrl).toBe('https://github.com/mokashreef');

    expect(ECOSYSTEM_PROJECTS.length).toBeGreaterThanOrEqual(8);
    const mainEcosystem = ECOSYSTEM_PROJECTS.find(p => p.id === 'code-elta6ur');
    expect(mainEcosystem.url).toBe('https://code-elta6ur.com/');

    const softwareCo = ECOSYSTEM_PROJECTS.find(p => p.id === 'code-elta6ur-software');
    expect(softwareCo.url).toBe('https://code-elta6ur.net/');

    const codeqProject = ECOSYSTEM_PROJECTS.find(p => p.id === 'codeq');
    expect(codeqProject.url).toContain('mokashreef.github.io/codeq');
  });
});
