import fs from 'node:fs';
const js = fs.readFileSync('scripts/puter_v2.js', 'utf8');

// Find all occurrences of "chat" in Puter.js
const regex = /["'`][^"'`]*chat[^"'`]*["'`]/gi;
const matches = [...new Set(js.match(regex) || [])];
console.log('Matches with "chat":', matches.slice(0, 30));
