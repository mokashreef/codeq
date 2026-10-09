/**
 * Curated Programming Questions & Guidance
 * Real programming topics categorized for instant discovery.
 */

export const CURATED_CATEGORIES = [
  {
    id: 'all',
    name: 'الكل',
    icon: 'fa-globe',
  },
  {
    id: 'javascript',
    name: 'JavaScript & Web',
    icon: 'fa-brands fa-js',
  },
  {
    id: 'python',
    name: 'Python & Backend',
    icon: 'fa-brands fa-python',
  },
  {
    id: 'algorithms',
    name: 'الخوارزميات وهياكل البيانات',
    icon: 'fa-solid fa-network-wired',
  },
  {
    id: 'clean-code',
    name: 'هندسة الكود وتصحيح الأخطاء',
    icon: 'fa-solid fa-bug-slash',
  },
];

export const CURATED_QUESTIONS = [
  {
    id: 'q1',
    category: 'javascript',
    language: 'javascript',
    title: 'كيف تعمل آلية الـ Event Loop والـ Microtasks في JavaScript؟',
    description: 'فهم ترتيب تنفيذ Promises مقابل setTimeout و Call Stack بالتفصيل.',
    prompt: 'اشرح لي بالتفصيل مع مثال عملي كيف تعمل آلية الـ Event Loop في JavaScript، وما الفرق بين الـ Macrotasks والـ Microtasks وترتيب تنفيذهما عند استخدام Promise و setTimeout.',
  },
  {
    id: 'q2',
    category: 'javascript',
    language: 'javascript',
    title: 'ما الفرق بين let و const و var ومفهوم الـ Hoisting؟',
    description: 'شرح النطاقات (Scopes) ومتى تستخدم كلاً منها مع أمثلة برمجية واضحة.',
    prompt: 'ما هي الفروقات الدقيقة بين var و let و const في JavaScript؟ وضح مفهوم الـ Hoisting والـ Temporal Dead Zone (TDZ) مع أمثلة توضيحية.',
  },
  {
    id: 'q3',
    category: 'python',
    language: 'python',
    title: 'كيف أتعامل مع الـ Async I/O في Python باستخدام httpx أو aiohttp؟',
    description: 'طريقة إرسال عشرات الطلبات المتزامنة بكفاءة وبدون حجب الـ Event Loop.',
    prompt: 'كيف يمكنني استدعاء عدة APIs بشكل متزامن وبكفاءة في Python باستخدام asyncio و httpx؟ أعطني كوداً عملياً مع معالجة الأخطاء والـ Timeouts.',
  },
  {
    id: 'q4',
    category: 'python',
    language: 'python',
    title: 'ما هي الـ Generators ودالة yield في Python ومتى تفضلها؟',
    description: 'توفير الذاكرة عند معالجة البيانات الضخمة (Streaming Data) بتطبيق Generator.',
    prompt: 'اشرح مفهوم الـ Generators ودالة yield في Python، وكيف توفر استهلاك الذاكرة (Memory Efficiency) مقارنة بالقوائم العادية مع مثال تطبيقي لقراءة ملف ضخم.',
  },
  {
    id: 'q5',
    category: 'algorithms',
    language: 'python',
    title: 'كيف أطبق خوارزمية البحث الثنائي (Binary Search) بدقة؟',
    description: 'كتابة خوارزمية البحث الثنائي مع حساب التعقيد الزمني وتجنب أخطاء المؤشرات.',
    prompt: 'اكتب كوداً نظيفاً لخوارزمية البحث الثنائي (Binary Search) في Python، واشرح التعقيد الزمني والمكاني لها، وكيف نتجنب خطأ Integer Overflow في حساب المنتصف.',
  },
  {
    id: 'q6',
    category: 'algorithms',
    language: 'javascript',
    title: 'كيف أحل مسألة إيجاد العقدة الدائرية في القائمة المترابطة (Floyd\'s Cycle)?',
    description: 'استخدام مؤشري السلحفاة والأرنب (Two Pointers) لاكتشاف الحلقات التكرارية.',
    prompt: 'اشرح خوارزمية Floyd\'s Cycle Detection (مؤشري السلحفاة والأرنب) لاكتشاف الحلقات في Linked List مع تطبيق كامل بلغة JavaScript وشرح التعقيد.',
  },
  {
    id: 'q7',
    category: 'clean-code',
    language: 'general',
    title: 'ما هي مبادئ SOLID الخمسة وكيف أطبقها عملياً؟',
    description: 'أمثلة واقعية على كتابة كود نظيف وقابل للتوسع والصيانة على المدى الطويل.',
    prompt: 'اشرح مبادئ SOLID الخمسة في هندسة البرمجيات مع تقديم مثال كود واقعي قبل وبعد تطبيق المبادئ لتوضيح الفرق في قابلية الصيانة.',
  },
  {
    id: 'q8',
    category: 'clean-code',
    language: 'javascript',
    title: 'كيف أكتشف وأعالج تسريبات الذاكرة (Memory Leaks) في المتصفح؟',
    description: 'أشهر أسباب الـ Leaks مثل Event Listeners و Closures وأدوات كشفها.',
    prompt: 'ما هي أشهر أسباب حدوث تسريبات الذاكرة (Memory Leaks) في تطبيقات الويب الحديثة (مثل React أو Vanilla JS)؟ وكيف أستخدم Chrome DevTools لرصدها وحلها؟',
  },
];
