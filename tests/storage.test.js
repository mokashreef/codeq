import { describe, it, expect, beforeEach } from 'vitest';
import { SessionStore } from '../src/storage/session-store.js';

// Polyfill minimal localStorage for non-browser Node environments
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe('SessionStore & Local Storage', () => {
  let sessionStore;

  beforeEach(async () => {
    globalThis.localStorage.clear();
    sessionStore = new SessionStore();
    await sessionStore.init();
  });

  it('initializes with a default session', () => {
    const current = sessionStore.getCurrentSession();
    expect(current).not.toBeNull();
    expect(current.turns).toEqual([]);
    expect(sessionStore.sessions.length).toBe(1);
  });

  it('creates new sessions with unique IDs', () => {
    const s1 = sessionStore.getCurrentSession();
    const s2 = sessionStore.createNewSession('جلسة بايثون');
    expect(s2.id).not.toBe(s1.id);
    expect(sessionStore.getCurrentSession().id).toBe(s2.id);
    expect(sessionStore.sessions.length).toBe(2);
  });

  it('adds turns to current session and auto-generates title', async () => {
    const turn = await sessionStore.addTurnToCurrentSession({
      question: 'كيف أنشئ دالة في بايثون؟',
      answer: 'def my_func(): pass',
      language: 'python',
      model: 'gpt-4o-mini',
      durationMs: 1200,
    });

    const current = sessionStore.getCurrentSession();
    expect(current.turns.length).toBe(1);
    expect(current.turns[0].question).toBe('كيف أنشئ دالة في بايثون؟');
    expect(current.title).toContain('كيف أنشئ دالة في بايثون؟');
  });

  it('toggles favorites and tracks bookmarks', async () => {
    const turn = await sessionStore.addTurnToCurrentSession({
      question: 'سؤال تجريبي',
      answer: 'إجابة تجريبية',
    });

    expect(turn.isFavorite).toBe(false);

    const isFav = await sessionStore.toggleFavorite(turn.id);
    expect(isFav).toBe(true);

    const favs = sessionStore.getFavoriteTurns();
    expect(favs.length).toBe(1);
    expect(favs[0].id).toBe(turn.id);

    const isFavAfter = await sessionStore.toggleFavorite(turn.id);
    expect(isFavAfter).toBe(false);
    expect(sessionStore.getFavoriteTurns().length).toBe(0);
  });

  it('searches sessions by question text and title', async () => {
    await sessionStore.addTurnToCurrentSession({
      question: 'شرح خوارزمية البحث الثنائي Binary Search',
      answer: 'خوارزمية O(log n)',
    });

    const resultsFound = sessionStore.searchSessions('Binary');
    expect(resultsFound.length).toBe(1);

    const resultsNotFound = sessionStore.searchSessions('كلمة غير موجودة بتاتاً');
    expect(resultsNotFound.length).toBe(0);
  });

  it('exports and imports data correctly', async () => {
    await sessionStore.addTurnToCurrentSession({
      question: 'سؤال للتصدير',
      answer: 'إجابة للتصدير',
    });

    const exportedJson = sessionStore.exportAllData();
    expect(exportedJson).toContain('سؤال للتصدير');

    // Create fresh store and import
    const newStore = new SessionStore();
    const imported = await newStore.importData(exportedJson);
    expect(imported).toBe(true);
    expect(newStore.sessions.length).toBeGreaterThan(0);
  });
});
