const res = await fetch('https://text.pollinations.ai/models');
console.log('Status:', res.status);
const models = await res.json();
console.log('Available models:', models.map(m => m.name || m));
