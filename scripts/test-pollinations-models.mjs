const payload = {
  messages: [
    { role: 'system', content: 'أنت مساعد برمجي في منصة CodeQ. أجب باللغة العربية مع كود Markdown نظيف.' },
    { role: 'user', content: 'اكتب دالة بلغة JavaScript لعكس نص (Reverse a String)' },
  ],
  model: 'openai',
  seed: 42,
};

try {
  const start = performance.now();
  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });

  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Duration:', Math.round(performance.now() - start), 'ms');
  console.log('Length:', text.length);
  console.log('Content:\n', text);
} catch (e) {
  console.error('Error:', e.message);
}
