const res = await fetch('https://js.puter.com/v2/');
const js = await res.text();

const regex = /["'`][^"'`]*chat[^"'`]*["'`]/gi;
const matches = [...new Set(js.match(regex) || [])];
console.log('Matches with "chat":', matches.slice(0, 30));

// Find function definitions for ai.chat
const aiChatIdx = js.indexOf('ai.chat');
console.log('Index of ai.chat:', aiChatIdx);

// Search for /drivers/call or /puterai/ or /ai/
const urls = [...new Set(js.match(/\/drivers\/[^\s"']+/g) || [])];
console.log('Driver URLs:', urls);

const postUrls = [...new Set(js.match(/path:\s*["'][^"']+["']/g) || [])];
console.log('Paths:', postUrls.slice(0, 20));
