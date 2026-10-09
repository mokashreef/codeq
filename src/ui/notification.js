/**
 * Accessible Toast Notification System for CodeQ
 */

export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
  };

  const iconClass = iconMap[type] || 'fa-circle-info';

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${iconClass}"></i>
    </div>
    <div class="toast-body">
      <span>${message}</span>
    </div>
    <button type="button" class="toast-close" aria-label="إغلاق التنبيه">
      <i class="fas fa-times"></i>
    </button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    dismissToast(toast);
  });

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  const timer = setTimeout(() => {
    dismissToast(toast);
  }, duration);

  function dismissToast(el) {
    clearTimeout(timer);
    el.classList.remove('visible');
    el.classList.add('hiding');
    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 300);
  }
}
