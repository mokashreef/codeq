/**
 * IndexedDB Storage Layer with LocalStorage Fallback
 * Provides persistent local storage for sessions, history, and bookmarks.
 */

const DB_NAME = 'CodeQ_Storage';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_BOOKMARKS = 'bookmarks';

export class CodeQStorage {
  constructor() {
    this.db = null;
    this.isIndexedDBAvailable = typeof indexedDB !== 'undefined';
  }

  async init() {
    if (!this.isIndexedDBAvailable) return;
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_BOOKMARKS)) {
          const bookmarkStore = db.createObjectStore(STORE_BOOKMARKS, { keyPath: 'id' });
          bookmarkStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB error, falling back to localStorage:', event.target.error);
        resolve(null);
      };
    });
  }

  // --- Session Methods ---

  async getAllSessions() {
    await this.init();
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([STORE_SESSIONS], 'readonly');
        const store = transaction.objectStore(STORE_SESSIONS);
        const request = store.getAll();

        request.onsuccess = () => {
          const list = request.result || [];
          list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          resolve(list);
        };
        request.onerror = () => resolve(this.getFallbackSessions());
      });
    }
    return this.getFallbackSessions();
  }

  async saveSession(session) {
    await this.init();
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([STORE_SESSIONS], 'readwrite');
        const store = transaction.objectStore(STORE_SESSIONS);
        const request = store.put(session);

        request.onsuccess = () => {
          this.syncFallbackSession(session);
          resolve(session);
        };
        request.onerror = () => {
          this.syncFallbackSession(session);
          resolve(session);
        };
      });
    }
    this.syncFallbackSession(session);
    return session;
  }

  async deleteSession(sessionId) {
    await this.init();
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([STORE_SESSIONS], 'readwrite');
        const store = transaction.objectStore(STORE_SESSIONS);
        store.delete(sessionId);
        transaction.oncomplete = () => {
          this.deleteFallbackSession(sessionId);
          resolve(true);
        };
      });
    }
    this.deleteFallbackSession(sessionId);
    return true;
  }

  async clearAll() {
    await this.init();
    if (this.db) {
      const transaction = this.db.transaction([STORE_SESSIONS, STORE_BOOKMARKS], 'readwrite');
      transaction.objectStore(STORE_SESSIONS).clear();
      transaction.objectStore(STORE_BOOKMARKS).clear();
    }
    localStorage.removeItem('codeq_sessions_backup');
    localStorage.removeItem('codeq_bookmarks_backup');
  }

  // --- LocalStorage Fallback Helpers ---

  getFallbackSessions() {
    try {
      const data = localStorage.getItem('codeq_sessions_backup');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  syncFallbackSession(session) {
    try {
      const list = this.getFallbackSessions();
      const idx = list.findIndex(s => s.id === session.id);
      if (idx >= 0) {
        list[idx] = session;
      } else {
        list.unshift(session);
      }
      localStorage.setItem('codeq_sessions_backup', JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.warn('LocalStorage quota or sync error:', e);
    }
  }

  deleteFallbackSession(sessionId) {
    try {
      const list = this.getFallbackSessions().filter(s => s.id !== sessionId);
      localStorage.setItem('codeq_sessions_backup', JSON.stringify(list));
    } catch {}
  }
}
