/**
 * Accessible Toast Notification Engine
 * Provides rich feedback (success, error, warning, info) with action/undo support.
 */

import { createElement, qs } from '../utils/dom.js';

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;
    let container = qs('#toast-container');
    if (!container) {
      container = createElement('div', {
        className: 'toast-container',
        attributes: {
          id: 'toast-container',
          'aria-live': 'polite',
          'aria-atomic': 'true'
        }
      });
      document.body.appendChild(container);
    }
    this.container = container;
  }

  /**
   * Shows a toast notification
   * @param {Object} options
   * @param {string} options.message
   * @param {'success'|'error'|'warning'|'info'} [options.type='info']
   * @param {number} [options.duration=4000]
   * @param {Object} [options.action] - Optional action button { label: string, onClick: Function }
   */
  show({ message, type = 'info', duration = 4000, action = null }) {
    if (!this.container) this.init();

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const iconSpan = createElement('span', {
      className: 'toast-icon font-mono',
      text: icons[type] || 'ℹ'
    });

    const msgSpan = createElement('span', {
      className: 'toast-text',
      text: message
    });

    const contentDiv = createElement('div', {
      className: 'toast-content',
      children: [iconSpan, msgSpan]
    });

    const children = [contentDiv];

    if (action && typeof action.onClick === 'function') {
      const actionBtn = createElement('button', {
        className: 'toast-action-btn',
        text: action.label || 'Undo',
        events: {
          click: () => {
            action.onClick();
            this.dismiss(toastEl);
          }
        }
      });
      children.push(actionBtn);
    }

    const closeBtn = createElement('button', {
      className: 'btn-icon btn-sm',
      attributes: { 'aria-label': 'Close Notification' },
      text: '✕',
      events: {
        click: () => this.dismiss(toastEl)
      }
    });
    children.push(closeBtn);

    const toastEl = createElement('div', {
      className: `toast toast-${type}`,
      attributes: { role: 'status' },
      children
    });

    this.container.appendChild(toastEl);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toastEl);
      }, duration);
    }

    return toastEl;
  }

  dismiss(toastEl) {
    if (!toastEl || !toastEl.parentNode) return;
    toastEl.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 300);
  }

  success(message, action = null) {
    return this.show({ message, type: 'success', action });
  }

  error(message) {
    return this.show({ message, type: 'error', duration: 6000 });
  }

  warning(message) {
    return this.show({ message, type: 'warning' });
  }

  info(message) {
    return this.show({ message, type: 'info' });
  }
}

export const toast = new ToastManager();
