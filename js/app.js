/**
 * MA SOFT TECH SOLUTIONS - WEB DEVELOPMENT ASSESSMENT
 * Main Application Orchestrator & Bootstrap
 */

import { APP_CONFIG } from './config.js';
import { qs, qsa } from './utils/dom.js';
import { appStore } from './core/store.js';
import { toast } from './core/toast.js';
import { Router } from './core/router.js';
import { storageService } from './services/storageService.js';

// Module Controllers
import { domController } from './modules/q1-dom-manipulator/domController.js';
import { formController } from './modules/q2-form-validation/formController.js';
import { apiViewController } from './modules/q3-api-integration/apiViewController.js';
import { studentController } from './modules/q4-student-crud/studentController.js';
import { securityLab } from './modules/q5-security-perf/securityLab.js';
import { gitVisualizer } from './modules/q6-git-workflow/gitVisualizer.js';

class Application {
  constructor() {
    this.router = null;
  }

  init() {
    this.setupTheme();
    this.setupNetworkMonitor();
    this.setupGlobalShortcuts();
    this.setupErrorBoundaries();
    this.initRouter();
    this.setupSidebarNavigation();
    this.setupOverviewModuleCards();

    console.info(`%c${APP_CONFIG.appName} v${APP_CONFIG.version} initialized successfully.`, 'color: #6366f1; font-weight: bold;');
  }

  setupTheme() {
    const savedTheme = storageService.getItem(APP_CONFIG.storageKeys.theme, APP_CONFIG.defaultTheme);
    this.applyTheme(savedTheme);

    const themeToggleBtn = qs('#theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        storageService.setItem(APP_CONFIG.storageKeys.theme, newTheme);
        toast.info(`Switched to ${newTheme.toUpperCase()} theme.`);
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    appStore.setState({ theme });

    const themeIcon = qs('#theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  setupNetworkMonitor() {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      appStore.setState({ online: isOnline });

      const dot = qs('#network-status-dot');
      const text = qs('#network-status-text');

      if (dot && text) {
        if (isOnline) {
          dot.classList.remove('offline');
          text.textContent = 'Online';
        } else {
          dot.classList.add('offline');
          text.textContent = 'Offline';
          toast.warning('Network connection lost. Offline fallback mode active.');
        }
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
  }

  setupGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.altKey) {
        switch (e.key) {
          case '0':
            this.router.navigate('overview');
            break;
          case '1':
            this.router.navigate('q1-dom');
            break;
          case '2':
            this.router.navigate('q2-form');
            break;
          case '3':
            this.router.navigate('q3-api');
            break;
          case '4':
            this.router.navigate('q4-crud');
            break;
          case '5':
            this.router.navigate('q5-security');
            break;
          case '6':
            this.router.navigate('q6-git');
            break;
        }
      }
    });
  }

  setupErrorBoundaries() {
    window.addEventListener('error', (event) => {
      console.error('[Global Error Boundary]:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Global Unhandled Promise Rejection]:', event.reason);
    });
  }

  initRouter() {
    this.router = new Router({
      overview: () => {
        // Sync overview stats
        const q1Total = qs('#q1-stat-total')?.textContent || '3';
        const q4Total = qs('#q4-stat-total')?.textContent || '5';
        const overviewQ1Stat = qs('#ov-q1-count');
        const overviewQ4Stat = qs('#ov-q4-count');
        if (overviewQ1Stat) overviewQ1Stat.textContent = q1Total;
        if (overviewQ4Stat) overviewQ4Stat.textContent = q4Total;
      },
      'q1-dom': () => domController.init(),
      'q2-form': () => formController.init(),
      'q3-api': () => apiViewController.init(),
      'q4-crud': () => studentController.init(),
      'q5-security': () => securityLab.init(),
      'q6-git': () => gitVisualizer.init()
    });

    // Initialize all controllers on page load to prepare DOM listeners
    domController.init();
    formController.init();
    studentController.init();
    securityLab.init();
    gitVisualizer.init();
  }

  setupSidebarNavigation() {
    const navButtons = qsa('.nav-item-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        if (route) {
          this.router.navigate(route);
        }
      });
    });
  }

  setupOverviewModuleCards() {
    const cards = qsa('.module-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const targetRoute = card.dataset.targetRoute;
        if (targetRoute) {
          this.router.navigate(targetRoute);
        }
      });
    });
  }
}

// Bootstrap on DOM Ready
const app = new Application();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
