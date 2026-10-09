/**
 * Theme Manager for Light / Dark Mode
 */

export class ThemeManager {
  constructor() {
    this.storageKey = 'codeq_theme_preference';
    this.currentTheme = 'dark'; // Default to modern sleek dark mode
  }

  init() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'light' || saved === 'dark') {
      this.currentTheme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      this.currentTheme = 'light';
    } else {
      this.currentTheme = 'dark';
    }

    this.applyTheme(this.currentTheme);

    // Listen for OS system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.storageKey)) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
      toggleBtn.setAttribute('title', theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن');
      toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن');
    }
  }

  toggle() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    return nextTheme;
  }

  isDark() {
    return this.currentTheme === 'dark';
  }
}
