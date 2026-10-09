/**
 * WebGPU Capability Detector for In-Browser AI Models
 * Checks hardware acceleration, GPU adapter limits, and device feasibility.
 */

export async function detectWebGPU() {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      reason: 'البيئة الحالية لا تدعم واجهة المتصفح Window.',
    };
  }

  if (!navigator.gpu) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return {
      isSupported: false,
      reason: isMobile
        ? 'متصفح الهاتف الحالي لا يدعم WebGPU بشكل افتراضي. يوصى باستخدام متصفح يدعم WebGPU (مثل Chrome الحديث) أو التبديل إلى المزود السحابي المجاني المتاح.'
        : 'المتصفح الحالي لا يدعم WebGPU. يرجى استخدام متصفح حديث (مثل Chrome أو Edge أو Firefox بعد تفعيل الميزة).',
      suggestion: 'cloud',
    };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!adapter) {
      return {
        isSupported: false,
        reason: 'لم يتم العثور على معالج رسوميات (GPU) متوافق مع WebGPU على هذا الجهاز.',
        suggestion: 'cloud',
      };
    }

    const info = adapter.info || {};
    const limits = adapter.limits || {};

    // Estimate capability based on maxBufferSize
    const maxBufferSizeMb = limits.maxBufferSize
      ? Math.round(limits.maxBufferSize / (1024 * 1024))
      : 0;
    const maxStorageBufferMb = limits.maxStorageBufferBindingSize
      ? Math.round(limits.maxStorageBufferBindingSize / (1024 * 1024))
      : 0;

    const deviceName = info.description || info.device || info.architecture || 'معالج رسوميات متوافق';
    const vendor = info.vendor || 'غير محدد';

    // Device memory estimate (navigator.deviceMemory in GB if available)
    const systemRamGb = navigator.deviceMemory || null;

    // Check if device can comfortably run >1GB models
    const isCapableOf1GB = maxBufferSizeMb >= 1024 || (systemRamGb && systemRamGb >= 6);

    return {
      isSupported: true,
      deviceName,
      vendor,
      architecture: info.architecture || 'عام',
      maxBufferSizeMb,
      maxStorageBufferMb,
      systemRamGb,
      isCapableOf1GB,
      recommendedModel: isCapableOf1GB
        ? 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC'
        : 'SmolLM2-360M-Instruct-q4f16_1-MLC',
      reason: 'المتصفح والجهاز يدعمان تسريع WebGPU بالكامل لتشغيل الذكاء الاصطناعي محلياً.',
    };
  } catch (error) {
    return {
      isSupported: false,
      reason: `فشل التحقق من WebGPU: ${error.message}`,
      suggestion: 'cloud',
    };
  }
}
