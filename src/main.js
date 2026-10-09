/**
 * CodeQ - Main Application Controller
 * Developed by Eng. Mohammad Abu Kashreef | Code Elta6ur Ecosystem
 */

import './style.css';
import { ThemeManager } from './ui/theme.js';
import { showToast } from './ui/notification.js';
import { renderMarkdown, attachCodeBlockListeners } from './ui/markdown.js';
import { AIProviderManager } from './ai/provider-manager.js';
import { PROVIDER_TYPES, WEBGPU_MODELS, CLOUD_MODELS } from './ai/types.js';
import { SessionStore } from './storage/session-store.js';
import { CURATED_CATEGORIES, CURATED_QUESTIONS } from './data/curated-questions.js';
import { ECOSYSTEM_PROJECTS, DEVELOPER_PROFILE } from './data/ecosystem.js';

class CodeQApplication {
  constructor() {
    this.theme = new ThemeManager();
    this.ai = new AIProviderManager();
    this.store = new SessionStore();

    this.isGenerating = false;
    this.activeCategory = 'all';
    this.activeSidebarTab = 'history';
  }

  async init() {
    this.theme.init();
    await this.store.init();
    this.setupDOM();
    this.setupEventListeners();
    this.renderEcosystemData();
    this.setupHardwareCheck();
    this.updateProviderUI();
    this.renderSidebar();
    this.renderCurrentSession();
    this.renderCuratedQuestions();
    this.listenNetworkStatus();
  }

  setupDOM() {
    // Header Buttons
    this.themeToggleBtn = document.getElementById('themeToggle');
    this.providerBadgeBtn = document.getElementById('providerBadgeBtn');
    this.sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    this.newChatBtn = document.getElementById('newChatBtn');
    this.aboutBtn = document.getElementById('aboutBtn');
    this.hwCheckBtn = document.getElementById('hwCheckBtn');
    this.ecosystemBtn = document.getElementById('ecosystemBtn');

    // Sidebar
    this.sidebar = document.getElementById('appSidebar');
    this.sidebarSearchInput = document.getElementById('sidebarSearch');
    this.tabHistoryBtn = document.getElementById('tabHistory');
    this.tabBookmarksBtn = document.getElementById('tabBookmarks');
    this.sessionListContainer = document.getElementById('sessionList');
    this.exportDataBtn = document.getElementById('exportDataBtn');
    this.clearAllBtn = document.getElementById('clearAllBtn');

    // Chat Area
    this.messagesStream = document.getElementById('messagesStream');
    this.emptyState = document.getElementById('emptyState');
    this.modelLoadingBanner = document.getElementById('modelLoadingBanner');
    this.modelBannerText = document.getElementById('modelBannerText');
    this.modelProgressBar = document.getElementById('modelProgressBar');

    // Input Area
    this.questionInput = document.getElementById('questionInput');
    this.languageSelect = document.getElementById('languageSelect');
    this.btnSend = document.getElementById('btnSend');

    // Dialogs
    this.providerModal = document.getElementById('providerModal');
    this.hwModal = document.getElementById('hwModal');
    this.aboutModal = document.getElementById('aboutModal');
    this.ecosystemModal = document.getElementById('ecosystemModal');

    // Store subscription
    this.store.subscribe(() => {
      this.renderSidebar();
    });
  }

  setupEventListeners() {
    // Theme toggle
    this.themeToggleBtn?.addEventListener('click', () => {
      const newTheme = this.theme.toggle();
      showToast(`تم التبديل إلى الوضع ${newTheme === 'dark' ? 'الداكن' : 'الفاتح'}`, 'info', 2000);
    });

    // Mobile sidebar toggle
    this.sidebarToggleBtn?.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
    });

    // New conversation
    this.newChatBtn?.addEventListener('click', () => {
      this.store.createNewSession();
      this.renderCurrentSession();
      this.questionInput.value = '';
      this.questionInput.focus();
      if (window.innerWidth <= 850) {
        this.sidebar.classList.remove('open');
      }
    });

    // Modals open triggers
    this.providerBadgeBtn?.addEventListener('click', () => this.openModal(this.providerModal));
    this.hwCheckBtn?.addEventListener('click', async () => await this.showHardwareModal());
    this.aboutBtn?.addEventListener('click', () => this.openModal(this.aboutModal));
    this.ecosystemBtn?.addEventListener('click', () => this.openModal(this.ecosystemModal));

    // Modals close triggers
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    document.querySelectorAll('.dialog-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeAllModals();
      });
    });

    // Sidebar search
    this.sidebarSearchInput?.addEventListener('input', (e) => {
      this.renderSidebar(e.target.value);
    });

    // Sidebar tabs
    this.tabHistoryBtn?.addEventListener('click', () => {
      this.activeSidebarTab = 'history';
      this.tabHistoryBtn.classList.add('active');
      this.tabBookmarksBtn.classList.remove('active');
      this.renderSidebar();
    });

    this.tabBookmarksBtn?.addEventListener('click', () => {
      this.activeSidebarTab = 'bookmarks';
      this.tabBookmarksBtn.classList.add('active');
      this.tabHistoryBtn.classList.remove('active');
      this.renderSidebar();
    });

    // Data export & clear
    this.exportDataBtn?.addEventListener('click', () => {
      const dataStr = this.store.exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CodeQ-Export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('تم تصدير سجل المحادثات بنجاح.', 'success');
    });

    this.clearAllBtn?.addEventListener('click', async () => {
      if (confirm('هل ترغب في مسح سجل المحادثات والمفضلة المخزنة محلياً بالكامل؟')) {
        await this.store.storage.clearAll();
        await this.store.init();
        this.renderCurrentSession();
        showToast('تم مسح السجل المحلي بنجاح.', 'info');
      }
    });

    // Send question triggers
    this.btnSend?.addEventListener('click', () => {
      this.handleAskQuestion();
    });

    this.questionInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleAskQuestion();
      }
    });

    // Textarea auto-grow
    this.questionInput?.addEventListener('input', () => {
      this.questionInput.style.height = 'auto';
      this.questionInput.style.height = Math.min(this.questionInput.scrollHeight, 200) + 'px';
    });

    // Provider modal selection events
    this.setupProviderModalEvents();
  }

  renderEcosystemData() {
    // Render Developer Profile Box
    const devContainer = document.getElementById('devProfileContainer');
    if (devContainer) {
      devContainer.innerHTML = `
        <div class="dev-profile-name">${DEVELOPER_PROFILE.name}</div>
        <div class="dev-profile-title">${DEVELOPER_PROFILE.title}</div>
        <div class="dev-profile-bio">${DEVELOPER_PROFILE.bio}</div>
        <div class="dev-profile-links">
          <a href="${DEVELOPER_PROFILE.portfolioUrl}" target="_blank" rel="noopener noreferrer" class="ecosystem-card-link">
            <i class="fas fa-globe"></i> الموقع الشخصي
          </a>
          <a href="${DEVELOPER_PROFILE.githubUrl}" target="_blank" rel="noopener noreferrer" class="ecosystem-card-link">
            <i class="fab fa-github"></i> حساب GitHub
          </a>
          <a href="${DEVELOPER_PROFILE.repoUrl}" target="_blank" rel="noopener noreferrer" class="ecosystem-card-link">
            <i class="fas fa-code-branch"></i> مستودع CodeQ
          </a>
        </div>
      `;
    }

    // Render Ecosystem Projects Grid
    const gridContainer = document.getElementById('ecosystemGridContainer');
    if (gridContainer) {
      gridContainer.innerHTML = '';
      ECOSYSTEM_PROJECTS.forEach(proj => {
        const card = document.createElement('div');
        card.className = 'ecosystem-card';
        card.innerHTML = `
          <div class="ecosystem-card-header">
            <span class="ecosystem-card-title">${proj.name}</span>
            <span class="ecosystem-badge">${proj.badge}</span>
          </div>
          <div class="ecosystem-card-desc">${proj.description}</div>
          <a href="${proj.url}" target="_blank" rel="noopener noreferrer" class="ecosystem-card-link">
            <span>زيارة المنصة</span>
            <i class="fas fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i>
          </a>
        `;
        gridContainer.appendChild(card);
      });
    }
  }

  async setupHardwareCheck() {
    const gpu = await this.ai.checkHardwareCapabilities();
    const dot = document.getElementById('providerStatusDot');
    if (dot && this.ai.providerType === PROVIDER_TYPES.WEBGPU) {
      dot.className = gpu.isSupported ? 'status-indicator local' : 'status-indicator warning';
    }
  }

  async showHardwareModal() {
    const gpu = await this.ai.checkHardwareCapabilities();
    const body = document.getElementById('hwInfoBody');
    if (!body) return;

    if (gpu.isSupported) {
      body.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--success); border-radius: 6px; padding: 0.85rem; margin-bottom: 1rem;">
          <h4 style="color: var(--success); margin-bottom: 0.35rem; font-size: 0.95rem;">
            <i class="fas fa-check-circle"></i> معالج الرسوميات متوافق مع WebGPU
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">
            يدعم متصفحك تشغيل نماذج الذكاء الاصطناعي محلياً على جهازك دون اتصال بالإنترنت بعد تحميل الأوزان.
          </p>
        </div>
        <table class="markdown-table" style="width: 100%;">
          <tbody>
            <tr><th>معالج الرسوميات:</th><td>${gpu.deviceName}</td></tr>
            <tr><th>الشركة المصنعة:</th><td>${gpu.vendor}</td></tr>
            <tr><th>حجم الذاكرة الأقصى:</th><td>${gpu.maxBufferSizeMb} MB</td></tr>
            <tr><th>النموذج المحلي الموصى به:</th><td>${gpu.recommendedModel}</td></tr>
          </tbody>
        </table>
      `;
    } else {
      body.innerHTML = `
        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid var(--warning); border-radius: 6px; padding: 0.85rem; margin-bottom: 1rem;">
          <h4 style="color: var(--warning); margin-bottom: 0.35rem; font-size: 0.95rem;">
            <i class="fas fa-circle-exclamation"></i> WebGPU غير مفعل أو غير مدعوم
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            ${gpu.reason}
          </p>
          <p style="font-size: 0.82rem; color: var(--text-muted);">
            تعمل المنصة تلقائياً عبر "المزوّد السحابي المجاني" بكفاءة تامة ودون الحاجة لتنزيل أي نماذج أو معالجة على كرت الشاشة.
          </p>
        </div>
      `;
    }
    this.openModal(this.hwModal);
  }

  updateProviderUI() {
    const config = this.ai.getActiveConfig();
    const textEl = document.getElementById('providerBadgeText');
    const dotEl = document.getElementById('providerStatusDot');

    if (config.isCloud) {
      if (textEl) textEl.textContent = 'سحابي مجاني • OpenAI Fast';
      if (dotEl) dotEl.className = 'status-indicator';
    } else if (config.isWebGPU) {
      const modelObj = WEBGPU_MODELS.find(m => m.id === config.selectedModel) || WEBGPU_MODELS[0];
      if (textEl) textEl.textContent = `محلي • ${modelObj.name}`;
      if (dotEl) dotEl.className = 'status-indicator local';
    } else {
      if (textEl) textEl.textContent = `مخصص • ${config.selectedModel}`;
      if (dotEl) dotEl.className = 'status-indicator warning';
    }
  }

  setupProviderModalEvents() {
    const cards = document.querySelectorAll('#providerModal .curated-item-card[data-provider]');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const pType = card.getAttribute('data-provider');
        cards.forEach(c => {
          c.style.borderRight = '1px solid var(--border-subtle)';
        });
        card.style.borderRight = '3px solid var(--primary)';

        const subWebllm = document.getElementById('subOptions_webllm');
        const subCustom = document.getElementById('subOptions_custom');
        if (subWebllm) subWebllm.style.display = pType === 'webllm' ? 'block' : 'none';
        if (subCustom) subCustom.style.display = pType === 'custom' ? 'block' : 'none';
      });
    });

    const btnSave = document.getElementById('btnSaveProvider');
    btnSave?.addEventListener('click', () => {
      let chosenType = 'cloud';
      cards.forEach(c => {
        if (c.style.borderRight.includes('3px')) {
          chosenType = c.getAttribute('data-provider');
        }
      });

      let chosenModel = null;
      if (chosenType === PROVIDER_TYPES.WEBGPU) {
        chosenModel = document.getElementById('selectWebgpuModel')?.value;
      } else if (chosenType === PROVIDER_TYPES.CUSTOM) {
        const apiKey = document.getElementById('customApiKey')?.value || '';
        const endpoint = document.getElementById('customEndpoint')?.value || 'https://api.openai.com/v1';
        const model = document.getElementById('customModel')?.value || 'gpt-4o-mini';
        this.ai.custom.saveConfig({ apiKey, endpoint, model });
        chosenModel = model;
      } else {
        chosenModel = CLOUD_MODELS[0].id;
      }

      this.ai.setProvider(chosenType, chosenModel);
      this.updateProviderUI();
      this.closeAllModals();
      showToast('تم تحديث إعدادات المزوّد بنجاح.', 'success');
    });
  }

  openModal(modal) {
    if (modal) modal.classList.add('active');
  }

  closeAllModals() {
    document.querySelectorAll('.dialog-overlay').forEach(m => m.classList.remove('active'));
  }

  // --- Sidebar Renderers ---
  renderSidebar(query = '') {
    if (!this.sessionListContainer) return;
    this.sessionListContainer.innerHTML = '';

    if (this.activeSidebarTab === 'bookmarks') {
      const favs = this.store.getFavoriteTurns();
      if (favs.length === 0) {
        this.sessionListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem; font-size: 0.8rem;">
            لا توجد أسئلة محفوظة في المفضلة بعد.
          </div>
        `;
        return;
      }

      favs.forEach(turn => {
        const item = document.createElement('div');
        item.className = 'session-entry';
        item.innerHTML = `
          <div class="session-entry-info">
            <span class="session-entry-title">${this.escapeHtml(turn.question)}</span>
            <span class="session-entry-meta">${turn.sessionTitle}</span>
          </div>
          <button type="button" class="btn-icon-square" style="width: 24px; height: 24px; font-size: 0.7rem;" title="عرض">
            <i class="fas fa-arrow-left"></i>
          </button>
        `;
        item.addEventListener('click', () => {
          this.store.switchSession(turn.sessionId);
          this.renderCurrentSession();
          if (window.innerWidth <= 850) this.sidebar.classList.remove('open');
        });
        this.sessionListContainer.appendChild(item);
      });
      return;
    }

    const sessions = this.store.searchSessions(query);
    if (sessions.length === 0) {
      this.sessionListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem; font-size: 0.8rem;">
          لا توجد محادثات سابقة.
        </div>
      `;
      return;
    }

    sessions.forEach(session => {
      const isActive = session.id === this.store.currentSessionId;
      const item = document.createElement('div');
      item.className = `session-entry ${isActive ? 'active' : ''}`;

      const dateStr = new Date(session.updatedAt).toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
      });

      item.innerHTML = `
        <div class="session-entry-info">
          <span class="session-entry-title">${this.escapeHtml(session.title)}</span>
          <span class="session-entry-meta">${session.turns.length} أسئلة • ${dateStr}</span>
        </div>
        <button type="button" class="session-entry-del" title="حذف">
          <i class="fas fa-trash-can"></i>
        </button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.session-entry-del')) {
          e.stopPropagation();
          if (confirm(`هل تريد بالتأكيد حذف "${session.title}"؟`)) {
            this.store.deleteSession(session.id);
            this.renderCurrentSession();
          }
          return;
        }
        this.store.switchSession(session.id);
        this.renderCurrentSession();
        if (window.innerWidth <= 850) this.sidebar.classList.remove('open');
      });

      this.sessionListContainer.appendChild(item);
    });
  }

  // --- Chat Stream Renderers ---
  renderCurrentSession() {
    const session = this.store.getCurrentSession();
    if (!session || session.turns.length === 0) {
      this.emptyState.style.display = 'flex';
      this.messagesStream.innerHTML = '';
      this.messagesStream.appendChild(this.emptyState);
      return;
    }

    this.emptyState.style.display = 'none';
    this.messagesStream.innerHTML = '';

    session.turns.forEach(turn => {
      const turnEl = this.createTurnElement(turn);
      this.messagesStream.appendChild(turnEl);
    });

    attachCodeBlockListeners(this.messagesStream);
    this.scrollToBottom();
  }

  createTurnElement(turn) {
    const turnEl = document.createElement('div');
    turnEl.className = 'turn-container';
    turnEl.id = turn.id;

    const langBadge = turn.language && turn.language !== 'general'
      ? `<span class="lang-badge">${turn.language}</span>`
      : '';

    const durationInfo = turn.durationMs
      ? `<span>${(turn.durationMs / 1000).toFixed(1)} ثانية</span>`
      : '';

    const sourceLabel = turn.providerName || turn.model || 'الذكاء الاصطناعي';

    turnEl.innerHTML = `
      <!-- Question -->
      <div class="question-bubble">
        <div class="question-bubble-header">
          <span>السؤال</span>
          ${langBadge}
        </div>
        <div class="question-bubble-text">${this.escapeHtml(turn.question)}</div>
      </div>

      <!-- Answer -->
      <div class="answer-bubble">
        <div class="answer-bubble-header">
          <div class="answer-source-info">
            <span class="source-tag">${sourceLabel}</span>
            ${durationInfo}
          </div>
          <div class="answer-actions">
            <button type="button" class="btn-bubble-action btn-fav ${turn.isFavorite ? 'bookmarked' : ''}" title="حفظ في المفضلة">
              <i class="${turn.isFavorite ? 'fas fa-bookmark' : 'far fa-bookmark'}"></i>
              <span>${turn.isFavorite ? 'محفوظ' : 'حفظ'}</span>
            </button>
            <button type="button" class="btn-bubble-action btn-copy-all" title="نسخ كامل الإجابة">
              <i class="fas fa-copy"></i>
              <span>نسخ</span>
            </button>
          </div>
        </div>
        <div class="markdown-content answer-markdown-content">
          ${renderMarkdown(turn.answer)}
        </div>
      </div>
    `;

    // Hook buttons
    const favBtn = turnEl.querySelector('.btn-fav');
    favBtn?.addEventListener('click', async () => {
      const isFav = await this.store.toggleFavorite(turn.id);
      favBtn.classList.toggle('bookmarked', isFav);
      favBtn.innerHTML = `
        <i class="${isFav ? 'fas fa-bookmark' : 'far fa-bookmark'}"></i>
        <span>${isFav ? 'محفوظ' : 'حفظ'}</span>
      `;
      showToast(isFav ? 'تم الحفظ في المفضلة.' : 'تمت الإزالة من المفضلة.', 'info', 1600);
    });

    const copyAllBtn = turnEl.querySelector('.btn-copy-all');
    copyAllBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(turn.answer);
        copyAllBtn.innerHTML = '<i class="fas fa-check" style="color: var(--success);"></i> <span>تم النسخ</span>';
        setTimeout(() => {
          copyAllBtn.innerHTML = '<i class="fas fa-copy"></i> <span>نسخ</span>';
        }, 2000);
      } catch (err) {
        showToast('تعذر النسخ إلى الحافظة.', 'error');
      }
    });

    return turnEl;
  }

  // --- Curated Questions ---
  renderCuratedQuestions() {
    const catsContainer = document.getElementById('curatedCats');
    const gridContainer = document.getElementById('curatedGrid');
    if (!catsContainer || !gridContainer) return;

    catsContainer.innerHTML = '';
    CURATED_CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cat-btn ${cat.id === this.activeCategory ? 'active' : ''}`;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => {
        this.activeCategory = cat.id;
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderCuratedGrid();
      });
      catsContainer.appendChild(btn);
    });

    this.renderCuratedGrid();
  }

  renderCuratedGrid() {
    const gridContainer = document.getElementById('curatedGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    const filtered = this.activeCategory === 'all'
      ? CURATED_QUESTIONS
      : CURATED_QUESTIONS.filter(q => q.category === this.activeCategory);

    filtered.forEach(q => {
      const card = document.createElement('div');
      card.className = 'curated-item-card';
      card.innerHTML = `
        <h4>${q.title}</h4>
        <p>${q.description}</p>
      `;
      card.addEventListener('click', () => {
        this.questionInput.value = q.prompt;
        this.languageSelect.value = q.language || '';
        this.handleAskQuestion();
      });
      gridContainer.appendChild(card);
    });
  }

  // --- Real Question Execution ---
  async handleAskQuestion() {
    if (this.isGenerating) return;

    const question = this.questionInput.value.trim();
    const language = this.languageSelect.value;

    if (!question) {
      showToast('يرجى كتابة السؤال البرمجي أولاً.', 'warning');
      this.questionInput.focus();
      return;
    }

    this.emptyState.style.display = 'none';
    this.isGenerating = true;
    this.btnSend.disabled = true;
    this.btnSend.innerHTML = '<div class="pulse-spinner"></div> <span>جاري المعالجة...</span>';

    const session = this.store.getCurrentSession() || this.store.createNewSession();
    const placeholderTurn = {
      id: 'turn_temp_' + Date.now(),
      question,
      answer: '',
      language,
      model: this.ai.selectedModel,
      providerName: this.ai.getProviderLabel(),
      durationMs: 0,
      timestamp: new Date().toISOString(),
      isFavorite: false,
    };

    const turnEl = this.createTurnElement(placeholderTurn);
    const markdownContentEl = turnEl.querySelector('.answer-markdown-content');

    markdownContentEl.innerHTML = `
      <div class="thinking-box">
        <div class="pulse-spinner"></div>
        <span>جاري استدعاء النموذج وتوليد الحل البرمجي...</span>
      </div>
    `;

    this.messagesStream.appendChild(turnEl);
    this.scrollToBottom();

    this.questionInput.value = '';
    this.questionInput.style.height = 'auto';

    let streamedText = '';
    const startTime = performance.now();

    try {
      const onProgress = (report) => {
        if (report.progress !== undefined) {
          this.modelLoadingBanner.style.display = 'flex';
          this.modelBannerText.textContent = report.text || 'جاري تهيئة النموذج...';
          const pct = Math.round(report.progress * 100);
          this.modelProgressBar.style.width = `${pct}%`;
        }
      };

      const onChunk = (chunk) => {
        streamedText += chunk;
        markdownContentEl.innerHTML = renderMarkdown(streamedText);
        attachCodeBlockListeners(markdownContentEl);
        this.scrollToBottom();
      };

      const result = await this.ai.ask({
        question,
        language,
        conversationHistory: session.turns.slice(-4),
        onProgress,
        onChunk,
      });

      this.modelLoadingBanner.style.display = 'none';
      const durationMs = Math.round(performance.now() - startTime);

      await this.store.addTurnToCurrentSession({
        question,
        answer: result.text || streamedText,
        language,
        model: result.modelId || this.ai.selectedModel,
        providerName: result.providerName || this.ai.getProviderLabel(),
        durationMs,
      });

      this.renderCurrentSession();
      showToast('تمت الإجابة وتوليد الكود بنجاح.', 'success', 2000);
    } catch (error) {
      console.error('Question execution failed:', error);
      this.modelLoadingBanner.style.display = 'none';

      markdownContentEl.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid var(--error); border-radius: 6px; padding: 0.85rem; color: var(--text-primary);">
          <h4 style="color: var(--error); font-size: 0.9rem; margin-bottom: 0.35rem;">
            <i class="fas fa-triangle-exclamation"></i> تعذر الحصول على إجابة
          </h4>
          <p style="font-size: 0.85rem; line-height: 1.6; color: var(--text-secondary);">${this.escapeHtml(error.message)}</p>
        </div>
      `;

      showToast(`خطأ: ${error.message}`, 'error', 5000);
    } finally {
      this.isGenerating = false;
      this.btnSend.disabled = false;
      this.btnSend.innerHTML = '<i class="fas fa-paper-plane"></i> <span>إرسال</span>';
      this.questionInput.focus();
    }
  }

  scrollToBottom() {
    this.messagesStream.scrollTop = this.messagesStream.scrollHeight;
  }

  listenNetworkStatus() {
    window.addEventListener('online', () => {
      showToast('تمت استعادة الاتصال بالإنترنت.', 'success', 2000);
    });
    window.addEventListener('offline', () => {
      showToast('انقطع الاتصال بالإنترنت. النماذج المحلية (WebGPU) فقط هي القابلة للعمل بدون إنترنت.', 'warning', 4000);
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.codeqApp = new CodeQApplication();
  window.codeqApp.init().catch(err => {
    console.error('CodeQ bootstrap error:', err);
  });
});
