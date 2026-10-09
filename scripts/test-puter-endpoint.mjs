const res = await fetch('https://api.puter.com/puterai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Say hello in 3 words' }],
    model: 'gpt-4o-mini',
  }),
});

console.log('Status:', res.status, res.statusText);
const text = await res.text();
console.log('Response body:', text);
