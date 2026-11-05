/**
 * NoteTrack - UI Utilities & Reusable Components (ui.js)
 * Toast notifications, accessible modals, skeletons, theme management, and formatting.
 */

const UI = {
  /**
   * Initializes global UI listeners (theme, dropdowns, sidebar drawer)
   */
  init() {
    this.initTheme();
    this.setupDropdowns();
    this.setupSidebarDrawer();
    this.checkRedirectMessage();
  },

  /**
   * Toast Notification System
   * @param {string} message - Toast message text
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {string} title - Optional title
   * @param {number} duration - Auto dismiss in ms (default 4000)
   */
  showToast(message, type = 'info', title = '', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    let defaultTitle = '';
    switch (type) {
      case 'success':
        iconSvg = '<i class="fa-solid fa-circle-check"></i>';
        defaultTitle = title || 'Success';
        break;
      case 'error':
        iconSvg = '<i class="fa-solid fa-circle-xmark"></i>';
        defaultTitle = title || 'Error';
        break;
      case 'warning':
        iconSvg = '<i class="fa-solid fa-triangle-exclamation"></i>';
        defaultTitle = title || 'Attention';
        break;
      default:
        iconSvg = '<i class="fa-solid fa-circle-info"></i>';
        defaultTitle = title || 'Notification';
        break;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${this.escapeHTML(defaultTitle)}</div>
        <div class="toast-message">${this.escapeHTML(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const closeToast = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', closeToast);

    if (duration > 0) {
      setTimeout(closeToast, duration);
    }
  },

  /**
   * Universal Modal Dialog
   */
  showModal({
    title = 'Confirm Action',
    content = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmClass = 'btn-primary',
    showCancel = true,
    onConfirm = null,
    onCancel = null
  }) {
    let overlay = document.getElementById('global-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>${this.escapeHTML(title)}</h3>
          <button class="modal-close-btn" id="modal-btn-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          ${typeof content === 'string' ? content : ''}
        </div>
        <div class="modal-footer">
          ${showCancel ? `<button class="btn btn-secondary" id="modal-btn-cancel">${this.escapeHTML(cancelText)}</button>` : ''}
          <button class="btn ${confirmClass}" id="modal-btn-confirm">${this.escapeHTML(confirmText)}</button>
        </div>
      </div>
    `;

    // Append DOM node if content is an Element
    if (content instanceof HTMLElement) {
      overlay.querySelector('.modal-body').appendChild(content);
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    const cleanup = () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    const handleConfirm = async () => {
      const confirmBtn = overlay.querySelector('#modal-btn-confirm');
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner"></span> Processing...';
      try {
        if (onConfirm) await onConfirm();
        cleanup();
      } catch (err) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = this.escapeHTML(confirmText);
        UI.showToast(err.message, 'error');
      }
    };

    const handleCancel = () => {
      if (onCancel) onCancel();
      cleanup();
    };

    overlay.querySelector('#modal-btn-confirm').addEventListener('click', handleConfirm);
    if (showCancel) overlay.querySelector('#modal-btn-cancel').addEventListener('click', handleCancel);
    overlay.querySelector('#modal-btn-close').addEventListener('click', handleCancel);

    // Backdrop click dismisses
    overlay.onclick = (e) => {
      if (e.target === overlay) handleCancel();
    };
  },

  closeModal() {
    const overlay = document.getElementById('global-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Theme Toggler (Light / Dark)
   */
  initTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcons(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, next);
    this.updateThemeIcons(next);
    this.showToast(`Switched to ${next} mode`, 'info', 'Theme Updated', 2000);
  },

  updateThemeIcons(theme) {
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach((btn) => {
      btn.innerHTML = theme === 'dark' 
        ? '<i class="fa-solid fa-sun"></i>' 
        : '<i class="fa-solid fa-moon"></i>';
      btn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
  },

  /**
   * Dropdowns System
   */
  setupDropdowns() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-dropdown-target]');
      const activeDropdowns = document.querySelectorAll('.dropdown-menu.active');

      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        const targetId = trigger.getAttribute('data-dropdown-target');
        const targetMenu = document.getElementById(targetId);

        activeDropdowns.forEach(menu => {
          if (menu !== targetMenu) menu.classList.remove('active');
        });

        if (targetMenu) targetMenu.classList.toggle('active');
      } else if (!e.target.closest('.dropdown-menu')) {
        activeDropdowns.forEach(menu => menu.classList.remove('active'));
      }
    });
  },

  /**
   * Sidebar Drawer System for Mobile
   */
  setupSidebarDrawer() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.app-sidebar');
    let backdrop = document.querySelector('.sidebar-backdrop');

    if (!backdrop && sidebar) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('drawer-open');
        backdrop.classList.toggle('active');
      });

      if (backdrop) {
        backdrop.addEventListener('click', () => {
          sidebar.classList.remove('drawer-open');
          backdrop.classList.remove('active');
        });
      }
    }
  },

  /**
   * Check for any redirect toast messages queued in sessionStorage
   */
  checkRedirectMessage() {
    const msg = sessionStorage.getItem('auth_redirect_reason');
    if (msg) {
      this.showToast(msg, 'warning', 'Session Notice');
      sessionStorage.removeItem('auth_redirect_reason');
    }
    const successMsg = sessionStorage.getItem('flash_success_message');
    if (successMsg) {
      this.showToast(successMsg, 'success');
      sessionStorage.removeItem('flash_success_message');
    }
  },

  /**
   * Format ISO date string into readable SaaS format
   * e.g., "Nov 5, 2026, 08:00 AM"
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  },

  /**
   * Relative time ago
   * e.g. "Just now", "10 minutes ago", "2 hours ago"
   */
  timeAgo(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const seconds = Math.floor((now - d) / 1000);

      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return this.formatDate(dateStr);
    } catch {
      return dateStr;
    }
  },

  /**
   * Extract Initials for User Avatar
   */
  getInitials(name) {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * API Base URL Configuration Modal
   */
  showApiConfigModal() {
    const currentBase = CONFIG.getBaseUrl();
    const content = `
      <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
        Configure the backend API URL. Make sure your Django REST Framework server is running.
      </p>
      <div class="form-group">
        <label class="form-label" for="api-base-input">API Base URL</label>
        <input type="url" id="api-base-input" class="form-control" value="${this.escapeHTML(currentBase)}" placeholder="http://127.0.0.1:8000/">
        <span class="text-muted" style="font-size: 0.75rem; margin-top: 0.25rem; display: block;">Default: <code>http://127.0.0.1:8000/</code></span>
      </div>
    `;

    this.showModal({
      title: 'Backend API Connection Settings',
      content,
      confirmText: 'Save & Reconnect',
      onConfirm: async () => {
        const input = document.getElementById('api-base-input');
        if (input && input.value) {
          CONFIG.setBaseUrl(input.value.trim());
          UI.showToast(`API URL updated to: ${CONFIG.getBaseUrl()}`, 'success');
          // Reload page to re-fetch with new URL
          setTimeout(() => window.location.reload(), 1000);
        }
      }
    });
  }
};

// Auto-initialize UI enhancements on DOM ready
document.addEventListener('DOMContentLoaded', () => UI.init());

