/**
 * Hash-Based SPA Router with Route Normalization, Alias Resolution, and ARIA State Synchronization
 */

import { qs, qsa } from '../utils/dom.js';
import { appStore } from './store.js';

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = null;
    this.routeAliases = {
      'q1': 'q1-dom',
      'q2': 'q2-form',
      'q3': 'q3-api',
      'q4': 'q4-crud',
      'q5': 'q5-security',
      'q6': 'q6-git',
      'overview': 'overview'
    };
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => this.handleRoute());
      // Immediately handle initial route on boot
      this.handleRoute();
    }
  }

  register(route, handler) {
    this.routes[route] = handler;
  }

  normalizeRoute(rawRoute) {
    if (!rawRoute) return 'overview';
    
    // Strip leading hash and slashes e.g. '#/q1-dom' -> 'q1-dom', '/q1' -> 'q1'
    let cleaned = String(rawRoute).replace(/^#+/, '').replace(/^\/+/, '').trim().toLowerCase();
    
    if (!cleaned) return 'overview';

    // Check direct aliases
    if (this.routeAliases[cleaned]) {
      return this.routeAliases[cleaned];
    }

    // Check registered routes
    if (this.routes[cleaned]) {
      return cleaned;
    }

    return 'overview';
  }

  handleRoute() {
    const rawHash = typeof window !== 'undefined' ? window.location.hash : '';
    const targetRoute = this.normalizeRoute(rawHash);
    this.renderRoute(targetRoute);
  }

  navigate(route) {
    const targetRoute = this.normalizeRoute(route);
    const expectedHash = `#/${targetRoute}`;

    // Render route immediately to guarantee visual update
    this.renderRoute(targetRoute);

    // Sync window hash if differing
    if (typeof window !== 'undefined' && window.location.hash !== expectedHash && window.location.hash !== `#${targetRoute}`) {
      window.location.hash = expectedHash;
    }
  }

  renderRoute(targetRoute) {
    this.currentRoute = targetRoute;

    // Update active view panels
    const panels = qsa('.view-panel');
    panels.forEach(panel => {
      if (panel.id === `view-${targetRoute}`) {
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');
      } else {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
      }
    });

    // Update sidebar navigation buttons & tabs
    const navButtons = qsa('.nav-item-btn');
    navButtons.forEach(btn => {
      const btnRoute = this.normalizeRoute(btn.dataset.route);
      if (btnRoute === targetRoute) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
        btn.removeAttribute('aria-current');
      }
    });

    // Update state store
    appStore.setState({ activeView: targetRoute });

    // Scroll to top of workspace
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Execute route handler callback if registered
    if (typeof this.routes[targetRoute] === 'function') {
      this.routes[targetRoute]();
    }
  }
}

