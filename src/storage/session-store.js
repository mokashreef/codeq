/**
 * High-level Session & Chat History Store
 */

import { CodeQStorage } from './db.js';

export class SessionStore {
  constructor() {
    this.storage = new CodeQStorage();
    this.sessions = [];
    this.currentSessionId = null;
    this.bookmarks = [];
    this.listeners = new Set();
  }

  async init() {
    await this.storage.init();
    this.sessions = await this.storage.getAllSessions();
    this.loadBookmarks();

    // If there are existing sessions, select the most recent; otherwise create a fresh session
    if (this.sessions.length > 0) {
      this.currentSessionId = this.sessions[0].id;
    } else {
      this.createNewSession();
    }

    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (e) {
        console.error('SessionStore listener error:', e);
      }
    }
  }

  getCurrentSession() {
    return this.sessions.find(s => s.id === this.currentSessionId) || null;
  }

  createNewSession(title = 'محادثة برمجية جديدة') {
    const newSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      turns: [], // array of { id, question, answer, language, model, timestamp, isFavorite }
    };

    this.sessions.unshift(newSession);
    this.currentSessionId = newSession.id;
    this.storage.saveSession(newSession);
    this.notify();
    return newSession;
  }

  switchSession(sessionId) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      this.currentSessionId = session.id;
      this.notify();
      return session;
    }
    return null;
  }

  async addTurnToCurrentSession({ question, answer, language = '', model = '', durationMs = 0 }) {
    let session = this.getCurrentSession();
    if (!session) {
      session = this.createNewSession();
    }

    // Auto-generate title from first question if session is default
    if (session.turns.length === 0) {
      const trimmedTitle = question.trim().split('\n')[0].substring(0, 45);
      session.title = trimmedTitle || 'محادثة برمجية';
    }

    const turn = {
      id: 'turn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      question,
      answer,
      language,
      model,
      durationMs,
      timestamp: new Date().toISOString(),
      isFavorite: false,
    };

    session.turns.push(turn);
    session.updatedAt = new Date().toISOString();

    // Reorder sessions so most recent is first
    this.sessions = this.sessions.filter(s => s.id !== session.id);
    this.sessions.unshift(session);

    await this.storage.saveSession(session);
    this.notify();
    return turn;
  }

  async updateTurnAnswer(turnId, updatedAnswer) {
    const session = this.getCurrentSession();
    if (!session) return;

    const turn = session.turns.find(t => t.id === turnId);
    if (turn) {
      turn.answer = updatedAnswer;
      session.updatedAt = new Date().toISOString();
      await this.storage.saveSession(session);
      this.notify();
    }
  }

  async toggleFavorite(turnId) {
    for (const session of this.sessions) {
      const turn = session.turns.find(t => t.id === turnId);
      if (turn) {
        turn.isFavorite = !turn.isFavorite;
        session.updatedAt = new Date().toISOString();
        await this.storage.saveSession(session);

        if (turn.isFavorite) {
          this.bookmarks.push({ ...turn, sessionId: session.id, sessionTitle: session.title });
        } else {
          this.bookmarks = this.bookmarks.filter(b => b.id !== turnId);
        }
        this.saveBookmarks();
        this.notify();
        return turn.isFavorite;
      }
    }
    return false;
  }

  async deleteSession(sessionId) {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    await this.storage.deleteSession(sessionId);

    if (this.currentSessionId === sessionId) {
      if (this.sessions.length > 0) {
        this.currentSessionId = this.sessions[0].id;
      } else {
        this.createNewSession();
      }
    }

    this.notify();
  }

  searchSessions(query) {
    if (!query || !query.trim()) {
      return this.sessions;
    }
    const q = query.trim().toLowerCase();
    return this.sessions.filter(session => {
      if (session.title.toLowerCase().includes(q)) return true;
      return session.turns.some(turn =>
        turn.question.toLowerCase().includes(q) ||
        (turn.answer && turn.answer.toLowerCase().includes(q))
      );
    });
  }

  getFavoriteTurns() {
    const favs = [];
    for (const s of this.sessions) {
      for (const t of s.turns) {
        if (t.isFavorite) {
          favs.push({ ...t, sessionId: s.id, sessionTitle: s.title });
        }
      }
    }
    return favs;
  }

  exportAllData() {
    return JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      sessions: this.sessions,
      bookmarks: this.bookmarks,
    }, null, 2);
  }

  async importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.sessions)) {
        for (const s of parsed.sessions) {
          await this.storage.saveSession(s);
        }
        this.sessions = await this.storage.getAllSessions();
        if (this.sessions.length > 0) {
          this.currentSessionId = this.sessions[0].id;
        }
        this.notify();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  loadBookmarks() {
    try {
      const data = localStorage.getItem('codeq_bookmarks_v2');
      this.bookmarks = data ? JSON.parse(data) : [];
    } catch {
      this.bookmarks = [];
    }
  }

  saveBookmarks() {
    try {
      localStorage.setItem('codeq_bookmarks_v2', JSON.stringify(this.bookmarks));
    } catch {}
  }
}
