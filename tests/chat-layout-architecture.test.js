import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Chat Layout Architecture & Scrolling Mechanics', () => {
  const rootDir = path.resolve(__dirname, '..');
  const cssPath = path.join(rootDir, 'src', 'style.css');
  const htmlPath = path.join(rootDir, 'index.html');
  const mainJsPath = path.join(rootDir, 'src', 'main.js');

  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

  it('enforces viewport locking and interactive-widget in index.html', () => {
    expect(htmlContent).toContain('interactive-widget=resizes-content');
    expect(htmlContent).toContain('id="messagesStream"');
    expect(htmlContent).toContain('class="input-dock"');
    expect(htmlContent).toContain('id="questionInput"');
  });

  it('guarantees root body is bounded by CSS Grid without position:fixed hack', () => {
    // Body must use pure CSS Grid to partition header and main workspace
    expect(cssContent).toMatch(/body\s*\{[^}]*display:\s*grid/);
    expect(cssContent).toMatch(/grid-template-rows:\s*var\(--header-height\)\s+1fr/);
    expect(cssContent).toMatch(/body\s*\{[^}]*overflow:\s*hidden/);
    
    // Body must NOT use position: fixed hack
    const bodyBlockMatch = cssContent.match(/body\s*\{([^}]+)\}/);
    expect(bodyBlockMatch).not.toBeNull();
    const bodyStyles = bodyBlockMatch[1];
    expect(bodyStyles).not.toContain('position: fixed');
  });

  it('guarantees chat-workspace is CSS Grid with messagesStream in dedicated row 2', () => {
    // Chat workspace must be grid with auto 1fr auto
    expect(cssContent).toMatch(/\.chat-workspace\s*\{[^}]*display:\s*grid/);
    expect(cssContent).toMatch(/grid-template-rows:\s*auto\s+1fr\s+auto/);
    expect(cssContent).toMatch(/\.chat-workspace\s*\{[^}]*min-height:\s*0/);

    // Messages container is the ONLY vertically scrolling viewport
    expect(cssContent).toMatch(/\.messages-container\s*\{[^}]*grid-row:\s*2/);
    expect(cssContent).toMatch(/\.messages-container\s*\{[^}]*min-height:\s*0/);
    expect(cssContent).toMatch(/\.messages-container\s*\{[^}]*overflow-y:\s*auto/);
    expect(cssContent).toMatch(/\.messages-container\s*\{[^}]*overflow-x:\s*hidden/);

    // Input dock is fixed in row 3
    expect(cssContent).toMatch(/\.input-dock\s*\{[^}]*grid-row:\s*3/);
  });

  it('guarantees code blocks never cause horizontal page blowout', () => {
    expect(cssContent).toMatch(/\.code-block-wrapper\s*\{[^}]*max-width:\s*100%/);
    expect(cssContent).toMatch(/\.code-block-wrapper pre\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('guarantees smart sticky scroll mechanics in main.js without page window scrolling', () => {
    // Never calls window.scrollTo or document scrolling
    expect(mainJsContent).not.toContain('window.scrollTo(');
    expect(mainJsContent).not.toContain('document.body.scrollTop');

    // Implements isUserNearBottom and respects scroll position
    expect(mainJsContent).toContain('isUserNearBottom');
    expect(mainJsContent).toContain('this.userIsAtBottom');
    expect(mainJsContent).toContain('this.messagesStream.scrollTop = this.messagesStream.scrollHeight');
  });
});
