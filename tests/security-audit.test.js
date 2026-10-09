import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Security & Production Readiness Audit', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('verifies that .gitignore contains .env and node_modules', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toContain('.env');
    expect(content).toContain('node_modules');
  });

  it('verifies no leaked API keys or secrets in src/ files', () => {
    const srcDir = path.join(rootDir, 'src');
    const files = fs.readdirSync(srcDir, { recursive: true })
      .filter(f => typeof f === 'string' && (f.endsWith('.js') || f.endsWith('.css')));

    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for Google AI Studio / Gemini API key regex
      expect(content).not.toMatch(/AIza[0-9A-Za-z-_]{35}/);
      // Check for OpenAI API key pattern
      expect(content).not.toMatch(/sk-[a-zA-Z0-9]{32,}/);
      // Check for GitHub tokens
      expect(content).not.toMatch(/ghp_[0-9A-Za-z]{36}/);
    }
  });

  it('verifies no localhost API URLs exist in production src/ or index.html', () => {
    const checkFiles = [
      path.join(rootDir, 'index.html'),
      path.join(rootDir, 'src/main.js'),
      path.join(rootDir, 'src/ai/provider-manager.js'),
      path.join(rootDir, 'src/ai/webllm-provider.js'),
      path.join(rootDir, 'src/ai/puter-provider.js'),
    ];

    for (const filePath of checkFiles) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toContain('http://localhost:3000/api');
        expect(content).not.toContain('localhost:3000');
      }
    }
  });

  it('verifies GitHub Pages static assets exist (.nojekyll and 404.html)', () => {
    const nojekyllPath = path.join(rootDir, 'public', '.nojekyll');
    const notFoundPath = path.join(rootDir, 'public', '404.html');

    expect(fs.existsSync(nojekyllPath)).toBe(true);
    expect(fs.existsSync(notFoundPath)).toBe(true);
  });

  it('verifies GitHub Actions deployment workflow is properly configured', () => {
    const workflowPath = path.join(rootDir, '.github', 'workflows', 'deploy.yml');
    expect(fs.existsSync(workflowPath)).toBe(true);

    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('actions/deploy-pages');
    expect(content).toContain('npm run build');
    expect(content).toContain('npm run test');
  });
});
