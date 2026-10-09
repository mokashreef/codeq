/**
 * AI Provider & Model Constants for CodeQ
 */

export const PROVIDER_TYPES = {
  WEBGPU: 'webllm',
  PUTER: 'puter',
  CUSTOM: 'custom',
};

export const WEBGPU_MODELS = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 (360M) — فائق الخفة',
    size: '~240 MB',
    vram: '~500 MB',
    badge: 'سريع واقتصادي',
    description: 'تحميل سريع جداً، يعمل بسلاسة على الحواسيب المحمولة والأجهزة المتوسطة.',
    recommendedFor: 'البدء الفوري وتجربة تشغيل النموذج محلياً دون انتظار تنزيل كبير.',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 (1B) — متوازن',
    size: '~850 MB',
    vram: '~1.2 GB',
    badge: 'متوازن وشامل',
    description: 'نموذج Meta الحديث، يقدم إجابات متماسكة وشروحاً ممتازة للمفاهيم.',
    recommendedFor: 'الأسئلة البرمجية والمفاهيمية العامة.',
  },
  {
    id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 Coder (1.5B) — خبير الأكواد',
    size: '~1.1 GB',
    vram: '~1.8 GB',
    badge: 'الأفضل للبرمجة',
    description: 'نموذج مدرب خصيصاً على كتابة وهندسة الأكواد واكتشاف الثغرات وتصحيحها.',
    recommendedFor: 'كتابة الدوال والحلول البرمجية العملية وتصحيح أخطاء الـ Syntax.',
  },
];

export const PUTER_MODELS = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet (سحابي مجاني)',
    badge: 'دقة قصوى',
    description: 'أداء استثنائي في كتابة وتدقيق الأكواد المعقدة والتصميم المعماري.',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini (سحابي مجاني)',
    badge: 'استجابة سريعة',
    description: 'سريع جداً في توليد الأكواد وحل المشكلات البرمجية الشائعة.',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3 (سحابي مجاني)',
    badge: 'ذكاء خوارزمي',
    description: 'قوي للغاية في حل الخوارزميات وهياكل البيانات والمسائل الرياضية.',
  },
];

export const CODEQ_SYSTEM_PROMPT = `أنت المساعد الذكي الرسمي لمنصة CodeQ العربية.
مهمتك: تقديم إجابات برمجية احترافية، دقيقة، ومفيدة باللغة العربية.
إرشادات الإجابة:
1. قدم شروحات موجزة ومباشرة دون إطالة غير مفيدة.
2. نسق دائماً الأكواد البرمجية داخل كتل Markdown محددة اللغة مثل \`\`\`javascript أو \`\`\`python.
3. اكتب كوداً نظيفاً، يتبع أفضل الممارسات البرمجية، وخالياً من الأخطاء.
4. ضع تعليقات توضيحية داخل الكود لتفسير الأجزاء الهامة.
5. إذا تطلب السؤال أمثلة عملية أو حالات حافة، اذكرها بوضوح.`;
