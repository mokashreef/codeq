const targets = [
  'https://duckduckgo.com',
  'https://huggingface.co',
  'https://raw.githubusercontent.com',
  'https://api.github.com',
  'https://text.pollinations.ai',
];

for (const t of targets) {
  try {
    const start = performance.now();
    const res = await fetch(t, { signal: AbortSignal.timeout(6000) });
    const dur = Math.round(performance.now() - start);
    console.log(`[OK] ${t} (${res.status}) in ${dur}ms`);
  } catch (err) {
    console.log(`[FAIL] ${t}: ${err.message}`);
  }
}
