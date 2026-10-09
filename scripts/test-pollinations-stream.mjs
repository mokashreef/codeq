const payload = {
  messages: [{ role: 'user', content: 'ما هو المتغير في البرمجة باختصار؟' }],
  model: 'openai-fast',
  stream: true,
};

const res = await fetch('https://text.pollinations.ai/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

console.log('Status:', res.status, res.headers.get('content-type'));
const reader = res.body.getReader();
const decoder = new TextDecoder();
let chunkCount = 0;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  chunkCount++;
  const txt = decoder.decode(value);
  process.stdout.write(`[Chunk ${chunkCount}]: ${txt.slice(0, 50)}\n`);
}
