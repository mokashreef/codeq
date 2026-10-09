/**
 * AI Provider & Model Constants for CodeQ
 */

export const PROVIDER_TYPES = {
  CLOUD: 'cloud',
  WEBGPU: 'webllm',
  CUSTOM: 'custom',
};

export const CLOUD_MODELS = [
  {
    id: 'openai-fast',
    name: 'OpenAI Fast (سحابي مجاني)',
    badge: 'استجابة سريعة',
    description: 'نموذج سحابي عالي السرعة، يدعم كتابة وتصحيح الأكواد البرمجية باللغة العربية دون الحاجة لمفتاح API.',
    requiresKey: false,
  },
];

export const WEBGPU_MODELS = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 (360M)',
    size: '~240 MB',
    vram: '~500 MB',
    badge: 'خفيف جداً',
    description: 'يعمل محلياً بالكامل على كرت الشاشة (WebGPU). مناسب للأجهزة ذات الذاكرة المحدودة.',
    requiresKey: false,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 (1B)',
    size: '~850 MB',
    vram: '~1.2 GB',
    badge: 'متوازن',
    description: 'نموذج لغوي محلي متوازن من Meta للإجابات البرمجية والمفاهيمية العامة.',
    requiresKey: false,
  },
  {
    id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 Coder (1.5B)',
    size: '~1.1 GB',
    vram: '~1.8 GB',
    badge: 'متخصص بالأكواد',
    description: 'نموذج محلي متخصص في كتابة وهندسة الأكواد واكتشاف الأخطاء وتصحيحها.',
    requiresKey: false,
  },
];

export const CODEQ_SYSTEM_PROMPT = `أنت المساعد البرمجي في منصة CodeQ، التابعة لمنظومة كود التطور ومطورة بواسطة المهندس محمد أبو خشريف.
مهمتك: تقديم إجابات برمجية احترافية ودقيقة ومفيدة باللغة العربية.
إرشادات الإجابة:
1. قدم شروحات مباشرة وموجزة تفيد المبرمج وتوفر وقته.
2. نسق دائماً الأكواد داخل كتل Markdown محددة اللغة مثل \`\`\`javascript أو \`\`\`python.
3. اكتب كوداً نظيفاً يتبع معايير الصناعة وقابلاً للتشغيل المباشر.
4. أضف تعليقات توضيحية مختصرة داخل الكود لتفسير الأجزاء الهامة.
5. لا تقدم وعوداً تسويقية أو نصوصاً دعائية، وركز على المنطق البرمجي والحل التقني.`;
