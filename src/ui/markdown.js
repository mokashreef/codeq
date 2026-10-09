/**
 * Markdown & Syntax Highlighting Engine for CodeQ
 * Uses Marked + Highlight.js with interactive code blocks and copy buttons.
 */

import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure Marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Escapes HTML characters
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Custom renderer for Marked
 */
const renderer = {
  code({ text, lang }) {
    const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    let highlighted = '';

    try {
      if (validLang !== 'plaintext') {
        highlighted = hljs.highlight(text, { language: validLang }).value;
      } else {
        highlighted = escapeHtml(text);
      }
    } catch {
      highlighted = escapeHtml(text);
    }

    const codeId = 'code_' + Math.random().toString(36).substring(2, 9);
    const langDisplay = validLang.toUpperCase();

    return `
      <div class="code-block-wrapper" id="${codeId}">
        <div class="code-block-header">
          <span class="code-lang-badge"><i class="fas fa-terminal"></i> ${langDisplay}</span>
          <button type="button" class="btn-copy-code" data-code="${encodeURIComponent(text)}" title="نسخ الكود">
            <i class="fas fa-copy"></i>
            <span class="copy-label">نسخ الكود</span>
          </button>
        </div>
        <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
      </div>
    `;
  },

  table(token) {
    const header = token.header.map(cell => `<th>${marked.parseInline(cell.text)}</th>`).join('');
    const rows = token.rows.map(row => {
      const cells = row.map(cell => `<td>${marked.parseInline(cell.text)}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <div class="table-container">
        <table class="markdown-table">
          <thead><tr>${header}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  link({ href, title, text }) {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  },
};

marked.use({ renderer });

/**
 * Renders raw markdown into safe, highlighted HTML.
 * @param {string} markdownText
 * @returns {string} HTML string
 */
export function renderMarkdown(markdownText) {
  if (!markdownText) return '';
  return marked.parse(markdownText);
}

/**
 * Attaches interactive copy event handlers to rendered code blocks in a container.
 * @param {HTMLElement} container
 */
export function attachCodeBlockListeners(container) {
  if (!container) return;

  const copyButtons = container.querySelectorAll('.btn-copy-code');
  copyButtons.forEach((btn) => {
    // Avoid double binding
    if (btn._hasCopyListener) return;
    btn._hasCopyListener = true;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const encodedCode = btn.getAttribute('data-code');
      if (!encodedCode) return;

      const code = decodeURIComponent(encodedCode);
      try {
        await navigator.clipboard.writeText(code);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> <span class="copy-label" style="color: #10b981;">تم النسخ!</span>';
        btn.classList.add('copied');

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove('copied');
        }, 2200);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    });
  });
}
