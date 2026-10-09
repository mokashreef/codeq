/**
 * CodeQ v2.0 - Main Application Controller
 * Professional Arabic AI Programming Platform
 */

import './style.css';
import { ThemeManager } from './ui/theme.js';
import { showToast } from './ui/notification.js';
import { renderMarkdown, attachCodeBlockListeners } from './ui/markdown.js';
import { AIProviderManager } from './ai/provider-manager.js';
import { PROVIDER_TYPES, WEBGPU_MODELS, PUTER_MODELS } from './ai/types.js';
import { SessionStore } from './storage/session-store.js';
import { CURATED_CATEGORIES, CURATED_QUESTIONS } from './data/curated-questions.js';

class CodeQApplication {
  constructor() {
    this.theme = new ThemeManager();
    this.ai = new AIProviderManager();
    this.store = new SessionStore();

    this.isGenerating = false;
    this.currentGeneratingTurnId = null;
    this.activeCategory = 'all';
    this.activeSidebarTab = 'history'; // 'history' | 'bookmarks'
  }

  async init() {
    this.theme.init();
    await this.store.init();
    this.setupDOM();
    this.setupEventListeners();
    this.setupHardwareCheck();
    this.updateProviderUI();
    this.renderSidebar();
    this.renderCurrentSession();
    this.renderCuratedQuestions();
    this.listenNetworkStatus();
  }

  setupDOM() {
    // Top Bar
    this.themeToggleBtn = document.getElementById('themeToggle');
    this.providerBadgeBtn = document.getElementById('providerBadgeBtn');
    this.sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    this.newChatBtn = document.getElementById('newChatBtn');
    this.aboutBtn = document.getElementById('aboutBtn');
    this.hwCheckBtn = document.getElementById('hwCheckBtn');

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

    // Modals
    this.providerModal = document.getElementById('providerModal');
    this.hwModal = document.getElementById('hwModal');
    this.aboutModal = document.getElementById('aboutModal');

    // Subscribe to store updates
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
      if (window.innerWidth <= 900) {
        this.sidebar.classList.remove('open');
      }
    });

    // Provider modal trigger
    this.providerBadgeBtn?.addEventListener('click', () => {
      this.openModal(this.providerModal);
    });

    // Hardware check modal trigger
    this.hwCheckBtn?.addEventListener('click', async () => {
      await this.showHardwareModal();
    });

    // About modal trigger
    this.aboutBtn?.addEventListener('click', () => {
      this.openModal(this.aboutModal);
    });

    // Close buttons for modals
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // Close modal on clicking overlay backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeAllModals();
        }
      });
    });

    // Sidebar search
    this.sidebarSearchInput?.addEventListener('input', (e) => {
      this.renderSidebar(e.target.value);
    });

    // Sidebar tabs (History vs Bookmarks)
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

    // Export and clear
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
      if (confirm('هل أنت متأكد من رغبتك في مسح جميع المحادثات والمفضلة المخزنة محلياً؟')) {
        await this.store.storage.clearAll();
        await this.store.init();
        this.renderCurrentSession();
        showToast('تم مسح جميع البيانات المحلية بنجاح.', 'info');
      }
    });

    // Question Input handling
    this.btnSend?.addEventListener('click', () => {
      this.handleAskQuestion();
    });

    this.questionInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleAskQuestion();
      }
    });

    // Auto-grow textarea
    this.questionInput?.addEventListener('input', () => {
      this.questionInput.style.height = 'auto';
      this.questionInput.style.height = Math.min(this.questionInput.scrollHeight, 220) + 'px';
    });

    // Setup Provider Selection within Modal
    this.setupProviderModalEvents();
  }

  async setupHardwareCheck() {
    const gpu = await this.ai.checkHardwareCapabilities();
    const hwDot = document.getElementById('hwStatusDot');
    if (hwDot) {
      if (gpu.isSupported) {
        hwDot.className = 'status-dot local';
        hwDot.setAttribute('title', `WebGPU مدعوم: ${gpu.deviceName}`);
      } else {
        hwDot.className = 'status-dot warning';
        hwDot.setAttribute('title', gpu.reason);
      }
    }
  }

  async showHardwareModal() {
    const gpu = await this.ai.checkHardwareCapabilities();
    const hwInfoBody = document.getElementById('hwInfoBody');
    if (!hwInfoBody) return;

    if (gpu.isSupported) {
      hwInfoBody.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <h4 style="color: #10b981; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <i class="fas fa-check-circle"></i> معالج الرسوميات متوافق مع WebGPU بالكامل
          </h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary);">
            جهازك ومتصفحك يدعمان تشغيل نماذج الذكاء الاصطناعي محلياً عبر WebLLM دون الحاجة لأي خادم وسيط.
          </p>
        </div>
        <table class="markdown-table" style="width: 100%;">
          <tbody>
            <tr><th>معالج الرسوميات:</th><td>${gpu.deviceName}</td></tr>
            <tr><th>المزود / Vendor:</th><td>${gpu.vendor}</td></tr>
            <tr><th>أقصى حجم للذاكرة المخصصة:</th><td>${gpu.maxBufferSizeMb} MB</td></tr>
            <tr><th>الموديل الموصى به:</th><td><strong>${gpu.recommendedModel}</strong></td></tr>
          </tbody>
        </table>
      `;
    } else {
      hwInfoBody.innerHTML = `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <h4 style="color: #f59e0b; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <i class="fas fa-exclamation-triangle"></i> WebGPU غير متاح حالياً
          </h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            ${gpu.reason}
          </p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            لا تقلق! المنصة تدعم المزود السحابي المجاني (Puter.js) الذي يعمل بسلاسة وفورية على جميع الأجهزة دون الحاجة لـ WebGPU وبدون أي مفاتيح API.
          </p>
        </div>
      `;
    }
    this.openModal(this.hwModal);
  }

  updateProviderUI() {
    const config = this.ai.getActiveConfig();
    const badgeText = document.getElementById('providerBadgeText');
    const badgeDot = document.getElementById('providerStatusDot');

    if (config.isWebGPU) {
      const modelObj = WEBGPU_MODELS.find(m => m.id === config.selectedModel) || WEBGPU_MODELS[0];
      if (badgeText) badgeText.textContent = `محلي: ${modelObj.name.split('—')[0].trim()}`;
      if (badgeDot) badgeDot.className = 'status-dot local';
    } else if (config.isPuter) {
      const modelObj = PUTER_MODELS.find(m => m.id === config.selectedModel) || PUTER_MODELS[1];
      if (badgeText) badgeText.textContent = `سحابي مجاني: ${modelObj.name.split('(')[0].trim()}`;
      if (badgeDot) badgeDot.className = 'status-dot';
    } else {
      if (badgeText) badgeText.textContent = `BYOK: ${config.selectedModel}`;
      if (badgeDot) badgeDot.className = 'status-dot warning';
    }
  }

  setupProviderModalEvents() {
    const providerCards = document.querySelectorAll('.provider-option-card');
    providerCards.forEach(card => {
      card.addEventListener('click', () => {
        const pType = card.getAttribute('data-provider');
        providerCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // Toggle sub-options visibility
        document.querySelectorAll('.provider-sub-options').forEach(el => el.style.display = 'none');
        const sub = document.getElementById(`subOptions_${pType}`);
        if (sub) sub.style.display = 'block';
      });
    });

    const btnSaveProvider = document.getElementById('btnSaveProvider');
    btnSaveProvider?.addEventListener('click', () => {
      const selectedCard = document.querySelector('.provider-option-card.selected');
      if (!selectedCard) return;

      const pType = selectedCard.getAttribute('data-provider');
      let chosenModel = null;

      if (pType === PROVIDER_TYPES.WEBGPU) {
        const select = document.getElementById('selectWebgpuModel');
        chosenModel = select?.value;
      } else if (pType === PROVIDER_TYPES.PUTER) {
        const select = document.getElementById('selectPuterModel');
        chosenModel = select?.value;
      } else if (pType === PROVIDER_TYPES.CUSTOM) {
        const apiKey = document.getElementById('customApiKey')?.value || '';
        const endpoint = document.getElementById('customEndpoint')?.value || 'https://api.openai.com/v1';
        const model = document.getElementById('customModel')?.value || 'gpt-4o-mini';
        this.ai.custom.saveConfig({ apiKey, endpoint, model });
        chosenModel = model;
      }

      this.ai.setProvider(pType, chosenModel);
      this.updateProviderUI();
      this.closeAllModals();
      showToast('تم تحديث مزود الذكاء الاصطناعي بنجاح.', 'success');
    });
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  // --- Sidebar Renderers ---
  renderSidebar(query = '') {
    if (!this.sessionListContainer) return;
    this.sessionListContainer.innerHTML = '';

    if (this.activeSidebarTab === 'bookmarks') {
      const favs = this.store.getFavoriteTurns();
      if (favs.length === 0) {
        this.sessionListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem; font-size: 0.85rem;">
            <i class="far fa-bookmark" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
            لا توجد أسئلة محفوظة في المفضلة بعد.<br>انقر على أيقونة النجمة بجانب أي إجابة لحفظها هنا.
          </div>
        `;
        return;
      }

      favs.forEach(turn => {
        const item = document.createElement('div');
        item.className = 'session-item';
        item.innerHTML = `
          <div class="session-item-content">
            <span class="session-title">${turn.question}</span>
            <span class="session-meta"><i class="fas fa-folder"></i> ${turn.sessionTitle}</span>
          </div>
          <button type="button" class="btn-icon" style="width: 28px; height: 28px;" title="عرض في المحادثة">
            <i class="fas fa-arrow-left"></i>
          </button>
        `;
        item.addEventListener('click', () => {
          this.store.switchSession(turn.sessionId);
          this.renderCurrentSession();
          if (window.innerWidth <= 900) this.sidebar.classList.remove('open');
        });
        this.sessionListContainer.appendChild(item);
      });
      return;
    }

    // Sessions History tab
    const sessions = this.store.searchSessions(query);
    if (sessions.length === 0) {
      this.sessionListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem; font-size: 0.85rem;">
          لا توجد محادثات تطابق بحثك.
        </div>
      `;
      return;
    }

    sessions.forEach(session => {
      const isActive = session.id === this.store.currentSessionId;
      const item = document.createElement('div');
      item.className = `session-item ${isActive ? 'active' : ''}`;

      const dateStr = new Date(session.updatedAt).toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
      });

      item.innerHTML = `
        <div class="session-item-content">
          <span class="session-title">${session.title}</span>
          <span class="session-meta">${session.turns.length} سؤال • ${dateStr}</span>
        </div>
        <div class="session-item-actions">
          <button type="button" class="session-del-btn" title="حذف المحادثة">
            <i class="fas fa-trash-can"></i>
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.session-del-btn')) {
          e.stopPropagation();
          if (confirm(`هل تريد بالتأكيد حذف "${session.title}"؟`)) {
            this.store.deleteSession(session.id);
            this.renderCurrentSession();
          }
          return;
        }
        this.store.switchSession(session.id);
        this.renderCurrentSession();
        if (window.innerWidth <= 900) this.sidebar.classList.remove('open');
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
    turnEl.className = 'turn-item';
    turnEl.id = turn.id;

    const langBadge = turn.language && turn.language !== 'general'
      ? `<span class="lang-tag">${turn.language}</span>`
      : '';

    const durationBadge = turn.durationMs
      ? `<span><i class="fas fa-stopwatch"></i> ${(turn.durationMs / 1000).toFixed(1)} ث</span>`
      : '';

    const modelName = turn.model || 'الذكاء الاصطناعي';

    turnEl.innerHTML = `
      <!-- User Question -->
      <div class="user-msg-bubble">
        <div class="user-msg-header">
          <i class="fas fa-user-circle"></i>
          <span>سؤالك:</span>
          ${langBadge}
        </div>
        <div class="user-msg-text">${this.escapeHtml(turn.question)}</div>
      </div>

      <!-- Assistant Answer -->
      <div class="assistant-msg-bubble">
        <div class="assistant-msg-header">
          <div class="ai-badge">
            <i class="fas fa-robot" style="color: var(--primary);"></i>
            <span>${modelName}</span>
          </div>
          <div class="ai-meta-info">
            ${durationBadge}
            <div class="assistant-actions">
              <button type="button" class="btn-action-small btn-toggle-fav ${turn.isFavorite ? 'active-fav' : ''}" title="حفظ في المفضلة">
                <i class="${turn.isFavorite ? 'fas fa-bookmark' : 'far fa-bookmark'}"></i>
                <span>${turn.isFavorite ? 'محفوظ' : 'حفظ'}</span>
              </button>
              <button type="button" class="btn-action-small btn-copy-all" title="نسخ كامل الإجابة">
                <i class="fas fa-copy"></i>
                <span>نسخ</span>
              </button>
            </div>
          </div>
        </div>
        <div class="markdown-body answer-markdown-content">
          ${renderMarkdown(turn.answer)}
        </div>
      </div>
    `;

    // Hook buttons
    const favBtn = turnEl.querySelector('.btn-toggle-fav');
    favBtn?.addEventListener('click', async () => {
      const isFav = await this.store.toggleFavorite(turn.id);
      favBtn.classList.toggle('active-fav', isFav);
      favBtn.innerHTML = `
        <i class="${isFav ? 'fas fa-bookmark' : 'far fa-bookmark'}"></i>
        <span>${isFav ? 'محفوظ' : 'حفظ'}</span>
      `;
      showToast(isFav ? 'تم الحفظ في المفضلة.' : 'تمت الإزالة من المفضلة.', 'info', 1800);
    });

    const copyAllBtn = turnEl.querySelector('.btn-copy-all');
    copyAllBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(turn.answer);
        copyAllBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> <span>تم النسخ!</span>';
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
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `cat-pill ${cat.id === this.activeCategory ? 'active' : ''}`;
      pill.innerHTML = `<i class="${cat.icon}"></i> <span>${cat.name}</span>`;
      pill.addEventListener('click', () => {
        this.activeCategory = cat.id;
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderCuratedGrid();
      });
      catsContainer.appendChild(pill);
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
      card.className = 'curated-card';
      card.innerHTML = `
        <div class="curated-card-title">${q.title}</div>
        <div class="curated-card-desc">${q.description}</div>
      `;
      card.addEventListener('click', () => {
        this.questionInput.value = q.prompt;
        this.languageSelect.value = q.language || '';
        this.handleAskQuestion();
      });
      gridContainer.appendChild(card);
    });
  }

  // --- Asking Question Execution ---
  async handleAskQuestion() {
    if (this.isGenerating) return;

    const question = this.questionInput.value.trim();
    const language = this.languageSelect.value;

    if (!question) {
      showToast('يرجى كتابة سؤالك البرمجي أولاً.', 'warning');
      this.questionInput.focus();
      return;
    }

    // Hide empty state if visible
    this.emptyState.style.display = 'none';

    this.isGenerating = true;
    this.btnSend.disabled = true;
    this.btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري التوليد...</span>';

    // Create placeholder turn in DOM
    const session = this.store.getCurrentSession() || this.store.createNewSession();
    const placeholderTurn = {
      id: 'turn_temp_' + Date.now(),
      question,
      answer: '',
      language,
      model: this.ai.selectedModel,
      durationMs: 0,
      timestamp: new Date().toISOString(),
      isFavorite: false,
    };

    const turnEl = this.createTurnElement(placeholderTurn);
    const answerMarkdownEl = turnEl.querySelector('.answer-markdown-content');

    // Add pulse thinking state
    answerMarkdownEl.innerHTML = `
      <div class="generating-pulse">
        <div class="dot-pulse"><span></span><span></span><span></span></div>
        <span>جاري استحضار الإجابة وتحليل الأكواد...</span>
      </div>
    `;

    this.messagesStream.appendChild(turnEl);
    this.scrollToBottom();

    // Clear input
    this.questionInput.value = '';
    this.questionInput.style.height = 'auto';

    let streamedText = '';
    const startTime = performance.now();

    try {
      // Progress callback for model download or initialization
      const onProgress = (report) => {
        if (report.progress !== undefined) {
          this.modelLoadingBanner.style.display = 'flex';
          this.modelBannerText.textContent = report.text || 'جاري تجهيز النموذج...';
          const pct = Math.round(report.progress * 100);
          this.modelProgressBar.style.width = `${pct}%`;
        }
      };

      const onChunk = (chunk) => {
        streamedText += chunk;
        answerMarkdownEl.innerHTML = renderMarkdown(streamedText);
        attachCodeBlockListeners(answerMarkdownEl);
        this.scrollToBottom();
      };

      const result = await this.ai.ask({
        question,
        language,
        conversationHistory: session.turns.slice(-4), // context window of last 4 turns
        onProgress,
        onChunk,
      });

      this.modelLoadingBanner.style.display = 'none';

      const durationMs = Math.round(performance.now() - startTime);

      // Persist completed turn to session store
      await this.store.addTurnToCurrentSession({
        question,
        answer: streamedText,
        language,
        model: result.modelId || this.ai.selectedModel,
        durationMs,
      });

      // Re-render session clean with persisted ID and listeners
      this.renderCurrentSession();
      showToast('تمت الإجابة بنجاح.', 'success', 2000);
    } catch (error) {
      console.error('Generation failed:', error);
      this.modelLoadingBanner.style.display = 'none';

      answerMarkdownEl.innerHTML = `
        <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid #f43f5e; border-radius: 8px; padding: 1rem; color: var(--text-primary);">
          <h4 style="color: #f43f5e; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <i class="fas fa-circle-exclamation"></i> تعذر توليد الإجابة
          </h4>
          <p style="font-size: 0.9rem; margin-bottom: 0.75rem;">${error.message}</p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="btn-action-small" id="retryWithCloudBtn" style="border-color: var(--primary); color: var(--primary);">
              <i class="fas fa-cloud"></i> التجربة عبر المزود السحابي المجاني
            </button>
          </div>
        </div>
      `;

      turnEl.querySelector('#retryWithCloudBtn')?.addEventListener('click', () => {
        this.ai.setProvider(PROVIDER_TYPES.PUTER, 'gpt-4o-mini');
        this.updateProviderUI();
        this.questionInput.value = question;
        this.languageSelect.value = language;
        turnEl.remove();
        this.handleAskQuestion();
      });

      showToast(`فشل في توليد الإجابة: ${error.message}`, 'error', 4500);
    } finally {
      this.isGenerating = false;
      this.btnSend.disabled = false;
      this.btnSend.innerHTML = '<i class="fas fa-paper-plane"></i> <span>اطرح السؤال</span>';
      this.questionInput.focus();
    }
  }

  scrollToBottom() {
    this.messagesStream.scrollTop = this.messagesStream.scrollHeight;
  }

  listenNetworkStatus() {
    window.addEventListener('online', () => {
      showToast('عادت خدمة الإنترنت للعمل.', 'success', 2500);
    });
    window.addEventListener('offline', () => {
      showToast('أنت حالياً بدون اتصال بالإنترنت. النماذج المحملة مسبقاً (WebGPU) ستستمر بالعمل دون انقطاع!', 'warning', 4500);
    });
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Bootstrap Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.codeqApp = new CodeQApplication();
  window.codeqApp.init().catch(err => {
    console.error('Fatal initialization error:', err);
  });
});
