/**
 * Hash-Based SPA Router with View Management and ARIA State Synchronization
 */

import { qs, qsa } from '../utils/dom.js';
import { appStore } from './store.js';

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = null;
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('DOMContentLoaded', () => this.handleRoute());
  }

  register(route, handler) {
    this.routes[route] = handler;
  }

  handleRoute() {
    const rawHash = window.location.hash.slice(1);
    const route = rawHash || 'overview';
    this.navigate(route, false);
  }

  navigate(route, updateHash = true) {
    if (updateHash) {
      window.location.hash = `#${route}`;
      return;
    }

    const targetRoute = this.routes[route] ? route : 'overview';
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

    // Update sidebar navigation buttons
    const navButtons = qsa('.nav-item-btn');
    navButtons.forEach(btn => {
      const btnRoute = btn.dataset.route;
      if (btnRoute === targetRoute) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      }
    });

    // Update state store
    appStore.setState({ activeView: targetRoute });

    // Scroll to top of workspace
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Execute route handler callback if registered
    if (typeof this.routes[targetRoute] === 'function') {
      this.routes[targetRoute]();
    }
  }
}
