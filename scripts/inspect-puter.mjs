import fs from 'node:fs';

const res = await fetch('https://js.puter.com/v2/');
const js = await res.text();
console.log('Puter.js size:', js.length);

// Look for API endpoints in Puter.js
const endpoints = js.match(/https?:\/\/[a-zA-Z0-9.-]+\.puter\.com[^\s"']*/g) || [];
console.log('Puter endpoints found:', [...new Set(endpoints)].slice(0, 10));

// Look for auth requirements or how chat is implemented
const chatSnippetIdx = js.indexOf('ai/chat');
if (chatSnippetIdx !== -1) {
  console.log('Snippet around ai/chat:');
  console.log(js.substring(chatSnippetIdx - 100, chatSnippetIdx + 200));
} else {
  console.log('No direct "ai/chat" substring found. Searching for chat:');
  const chatMatches = js.match(/[a-zA-Z0-9_$.]+\.chat\s*=/g);
  console.log('Chat matches:', chatMatches);
}
