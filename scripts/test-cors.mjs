const res = await fetch('https://text.pollinations.ai/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://mokashreef.github.io',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'hello' }],
    model: 'openai-fast',
  }),
});

console.log('Status:', res.status);
console.log('CORS Header:', res.headers.get('access-control-allow-origin'));
const text = await res.text();
console.log('Result:', text.slice(0, 100));
