const prompt = encodeURIComponent('ما هي لغة بايثون باختصار شديد في سطرين؟');
console.log('Testing GET https://text.pollinations.ai/' + prompt);

try {
  const start = performance.now();
  const res = await fetch(`https://text.pollinations.ai/${prompt}`, {
    signal: AbortSignal.timeout(15000),
  });
  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Duration:', Math.round(performance.now() - start), 'ms');
  console.log('Response content (first 300 chars):');
  console.log(text.slice(0, 300));
} catch (e) {
  console.error('Error:', e.message);
}
