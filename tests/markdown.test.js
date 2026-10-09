import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../src/ui/markdown.js';

describe('Markdown Renderer', () => {
  it('renders bold and italic text properly', () => {
    const md = '**نص غامق** و *نص مائل*';
    const html = renderMarkdown(md);
    expect(html).toContain('<strong>نص غامق</strong>');
    expect(html).toContain('<em>نص مائل</em>');
  });

  it('renders code blocks with language badge and copy button', () => {
    const md = '```javascript\nconst x = 42;\nconsole.log(x);\n```';
    const html = renderMarkdown(md);

    expect(html).toContain('code-block-wrapper');
    expect(html).toContain('code-lang-badge');
    expect(html).toContain('btn-copy-code');
    expect(html).toContain('language-javascript');
    expect(html).toContain(encodeURIComponent('const x = 42;\nconsole.log(x);'));
  });

  it('renders markdown tables with container', () => {
    const md = `
| المعيار | القيمة |
| :--- | :--- |
| المعالج | WebGPU |
| التكلفة | مجاني |
    `.trim();
    const html = renderMarkdown(md);
    expect(html).toContain('table-container');
    expect(html).toContain('markdown-table');
    expect(html).toContain('WebGPU');
    expect(html).toContain('مجاني');
  });

  it('renders links with rel="noopener noreferrer" and target="_blank"', () => {
    const md = '[رابط المستودع](https://github.com/mokashreef/codeq)';
    const html = renderMarkdown(md);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('https://github.com/mokashreef/codeq');
  });

  it('handles empty input gracefully', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown(null)).toBe('');
  });
});
