/**
 * Q3 API View Controller: REST API Integration
 * Features:
 * - Live fetch from jsonplaceholder.typicode.com
 * - Skeleton loading state
 * - Granular error handling (404, 500, Offline, Timeout simulation controls)
 * - Debounced search & City dropdown filter
 * - No-results state
 * - View mode toggle (Grid vs Table)
 * - Raw JSON viewer & User Posts inspection modal
 * - Error Handling & Architectural explanation drawer
 */

import { qs, qsa, createElement, clearElement, batchRender } from '../../utils/dom.js';
import { debounce } from '../../utils/debounce.js';
import { getInitials } from '../../utils/formatters.js';
import { apiService } from '../../services/apiService.js';
import { toast } from '../../core/toast.js';
import { filterUsers } from './apiFilters.js';

export class ApiViewController {
  constructor() {
    this.rawUsers = [];
    this.currentViewMode = 'grid'; // 'grid' | 'table'
    this.isInitialized = false;
    this.isLoading = false;
  }

  init() {
    if (this.isInitialized) {
      if (this.rawUsers && this.rawUsers.length > 0) {
        this.render();
      }
      return;
    }

    this.setupEventListeners();
    this.fetchData();
    this.isInitialized = true;
  }

  setupEventListeners() {
    const searchInput = qs('#q3-search-input');
    const citySelect = qs('#q3-city-filter');
    const refreshBtn = qs('#q3-refresh-btn');
    const viewGridBtn = qs('#q3-view-grid-btn');
    const viewTableBtn = qs('#q3-view-table-btn');
    const simModeSelect = qs('#q3-sim-mode-select');
    const latencyInput = qs('#q3-sim-latency');

    // Debounced Search (300ms)
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        this.render();
      }, 300));
    }

    // City Filter
    if (citySelect) {
      citySelect.addEventListener('change', () => {
        this.render();
      });
    }

    // Refresh Button
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.fetchData({ bypassCache: true });
      });
    }

    // View Mode Toggle
    if (viewGridBtn && viewTableBtn) {
      viewGridBtn.addEventListener('click', () => {
        this.currentViewMode = 'grid';
        viewGridBtn.classList.add('active', 'btn-primary');
        viewGridBtn.classList.remove('btn-secondary');
        viewTableBtn.classList.remove('active', 'btn-primary');
        viewTableBtn.classList.add('btn-secondary');
        this.render();
      });

      viewTableBtn.addEventListener('click', () => {
        this.currentViewMode = 'table';
        viewTableBtn.classList.add('active', 'btn-primary');
        viewTableBtn.classList.remove('btn-secondary');
        viewGridBtn.classList.remove('active', 'btn-primary');
        viewGridBtn.classList.add('btn-secondary');
        this.render();
      });
    }

    // Simulation Controls (Q3 Testing & Demonstrations)
    if (simModeSelect) {
      simModeSelect.addEventListener('change', (e) => {
        apiService.setSimulationMode(e.target.value);
        toast.info(`API simulation mode set to: ${e.target.value}`);
      });
    }

    if (latencyInput) {
      latencyInput.addEventListener('change', (e) => {
        apiService.setSimulatedLatency(e.target.value);
        toast.info(`Simulated latency: ${e.target.value}ms`);
      });
    }

    // Retry Button in Error State
    const retryBtn = qs('#q3-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.fetchData({ bypassCache: true });
      });
    }

    // Explanation Drawer
    const infoBtn = qs('#q3-open-info-btn');
    const drawer = qs('#q3-info-drawer');
    const closeBtn = qs('#q3-close-info-btn');
    const backdrop = qs('#q3-info-backdrop');

    if (infoBtn && drawer) {
      infoBtn.addEventListener('click', () => {
        drawer.classList.add('open');
        if (backdrop) backdrop.classList.add('open');
      });

      const closeDrawer = () => {
        drawer.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
      };

      if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
      if (backdrop) backdrop.addEventListener('click', closeDrawer);
    }
  }

  async fetchData({ bypassCache = false } = {}) {
    this.isLoading = true;
    this.showLoadingState();

    const errorContainer = qs('#q3-error-container');
    if (errorContainer) errorContainer.style.display = 'none';

    try {
      const data = await apiService.fetchUsers({ bypassCache });
      this.rawUsers = data;
      this.populateCityDropdown(data);
      this.isLoading = false;
      this.render();
      toast.success(`Successfully loaded ${data.length} users from REST API.`);
    } catch (err) {
      this.isLoading = false;
      this.showErrorState(err.message);
      toast.error(`REST API Request Failed: ${err.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  populateCityDropdown(users) {
    const citySelect = qs('#q3-city-filter');
    if (!citySelect) return;

    const currentVal = citySelect.value;
    const cities = Array.from(new Set(users.map(u => u.address?.city).filter(Boolean))).sort();

    // Preserve 'All Cities' option
    citySelect.innerHTML = '<option value="all">All Locations / Cities</option>';

    cities.forEach(city => {
      const opt = createElement('option', {
        attributes: { value: city },
        text: city
      });
      citySelect.appendChild(opt);
    });

    if (cities.includes(currentVal)) {
      citySelect.value = currentVal;
    }
  }

  showLoadingState() {
    const container = qs('#q3-results-container');
    if (!container) return;

    clearElement(container);

    const skeletonCards = Array.from({ length: 6 }).map(() => {
      return createElement('div', {
        className: 'user-card',
        children: [
          createElement('div', {
            className: 'flex items-center gap-3',
            children: [
              createElement('div', { className: 'skeleton skeleton-avatar' }),
              createElement('div', {
                className: 'flex-col w-full gap-2',
                children: [
                  createElement('div', { className: 'skeleton skeleton-text', attributes: { style: 'width: 60%;' } }),
                  createElement('div', { className: 'skeleton skeleton-text', attributes: { style: 'width: 40%;' } })
                ]
              })
            ]
          }),
          createElement('div', {
            className: 'flex-col gap-2',
            children: [
              createElement('div', { className: 'skeleton skeleton-text' }),
              createElement('div', { className: 'skeleton skeleton-text', attributes: { style: 'width: 80%;' } })
            ]
          }),
          createElement('div', {
            className: 'skeleton skeleton-text',
            attributes: { style: 'width: 30%; height: 28px;' }
          })
        ]
      });
    });

    const grid = createElement('div', {
      className: 'api-users-grid',
      children: skeletonCards
    });

    container.appendChild(grid);
  }

  showErrorState(errorMessage) {
    const errorContainer = qs('#q3-error-container');
    const resultsContainer = qs('#q3-results-container');
    const errorMsgEl = qs('#q3-error-message');

    if (resultsContainer) clearElement(resultsContainer);
    if (errorContainer) {
      errorContainer.style.display = 'block';
      if (errorMsgEl) errorMsgEl.textContent = errorMessage;
    }
  }

  render() {
    const container = qs('#q3-results-container');
    if (!container || this.isLoading) return;

    clearElement(container);

    const query = qs('#q3-search-input')?.value || '';
    const city = qs('#q3-city-filter')?.value || 'all';

    const filtered = filterUsers(this.rawUsers, query, city);

    // Update count indicator
    const countEl = qs('#q3-user-count');
    if (countEl) countEl.textContent = `${filtered.length} of ${this.rawUsers.length} users`;

    if (filtered.length === 0) {
      this.renderNoResults(container);
      return;
    }

    if (this.currentViewMode === 'grid') {
      this.renderGridView(container, filtered);
    } else {
      this.renderTableView(container, filtered);
    }
  }

  renderGridView(container, users) {
    const grid = createElement('div', { className: 'api-users-grid' });
    batchRender(grid, users, (user) => this.createUserCard(user));
    container.appendChild(grid);
  }

  createUserCard(user) {
    const userName = user.name || 'Unknown User';
    const userUsername = user.username ? `@${user.username}` : '@anonymous';
    const userEmail = user.email || 'No email available';
    const userPhone = user.phone || 'No phone provided';
    const userCompany = user.company?.name || 'Independent / Unassigned';
    const userCity = user.address?.city || 'Unknown Location';
    const userWebsite = user.website || '';

    const avatar = createElement('div', {
      className: 'user-avatar',
      text: getInitials(userName)
    });

    const nameHeader = createElement('div', {
      children: [
        createElement('h4', { text: userName, className: 'text-sm font-bold' }),
        createElement('span', { className: 'text-xs text-muted font-mono', text: userUsername })
      ]
    });

    const cardHeader = createElement('div', {
      className: 'user-card-header',
      children: [avatar, nameHeader]
    });

    const body = createElement('div', {
      className: 'user-card-body',
      children: [
        createElement('div', {
          className: 'user-detail-row',
          children: [
            createElement('span', { className: 'text-muted text-xs', text: '✉' }),
            createElement('span', { text: userEmail })
          ]
        }),
        createElement('div', {
          className: 'user-detail-row',
          children: [
            createElement('span', { className: 'text-muted text-xs', text: '☎' }),
            createElement('span', { text: userPhone })
          ]
        }),
        createElement('div', {
          className: 'user-detail-row',
          children: [
            createElement('span', { className: 'text-muted text-xs', text: '🏢' }),
            createElement('span', { text: userCompany })
          ]
        }),
        createElement('div', {
          className: 'user-detail-row',
          children: [
            createElement('span', { className: 'text-muted text-xs', text: '📍' }),
            createElement('span', { text: userCity })
          ]
        })
      ]
    });

    const viewJsonBtn = createElement('button', {
      className: 'btn btn-outline btn-sm',
      text: '{ } Inspect JSON',
      events: {
        click: () => this.inspectJson(user)
      }
    });

    const footerChildren = [viewJsonBtn];
    if (userWebsite) {
      const websiteLink = createElement('a', {
        className: 'text-xs font-semibold',
        attributes: {
          href: userWebsite.startsWith('http') ? userWebsite : `https://${userWebsite}`,
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        text: `🌐 ${userWebsite}`
      });
      footerChildren.push(websiteLink);
    }

    const footer = createElement('div', {
      className: 'user-card-footer',
      children: footerChildren
    });

    return createElement('div', {
      className: 'user-card',
      children: [cardHeader, body, footer]
    });
  }

  renderTableView(container, users) {
    const tableWrapper = createElement('div', { className: 'table-responsive' });
    const table = createElement('table', { className: 'data-table' });

    // Table Header
    const thead = createElement('thead', {
      children: [
        createElement('tr', {
          children: [
            createElement('th', { text: 'User / Alias' }),
            createElement('th', { text: 'Email' }),
            createElement('th', { text: 'Phone' }),
            createElement('th', { text: 'Company' }),
            createElement('th', { text: 'Location' }),
            createElement('th', { text: 'Actions' })
          ]
        })
      ]
    });

    const tbody = createElement('tbody');
    batchRender(tbody, users, (user) => {
      const userName = user.name || 'Unknown User';
      const userUsername = user.username ? `@${user.username}` : '@anonymous';
      const userEmail = user.email || 'No email available';
      const userPhone = user.phone || 'N/A';
      const userCompany = user.company?.name || 'Independent';
      const userCity = user.address?.city || 'Unknown';

      return createElement('tr', {
        children: [
          createElement('td', {
            children: [
              createElement('div', {
                className: 'flex items-center gap-2',
                children: [
                  createElement('div', {
                    className: 'user-avatar',
                    attributes: { style: 'width: 28px; height: 28px; font-size: 0.75rem;' },
                    text: getInitials(userName)
                  }),
                  createElement('div', {
                    children: [
                      createElement('strong', { text: userName }),
                      createElement('div', { className: 'text-xs text-muted font-mono', text: userUsername })
                    ]
                  })
                ]
              })
            ]
          }),
          createElement('td', { text: userEmail }),
          createElement('td', { text: userPhone }),
          createElement('td', { text: userCompany }),
          createElement('td', { text: userCity }),
          createElement('td', {
            children: [
              createElement('button', {
                className: 'btn btn-outline btn-sm',
                text: '{ } JSON',
                events: { click: () => this.inspectJson(user) }
              })
            ]
          })
        ]
      });
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
  }

  renderNoResults(container) {
    const emptyBox = createElement('div', {
      className: 'empty-state-box',
      children: [
        createElement('div', { className: 'empty-state-icon', text: '🔍' }),
        createElement('h4', { text: 'No Matching Users Found' }),
        createElement('p', { className: 'text-sm text-muted', text: 'Try changing your search terms or selecting "All Locations".' })
      ]
    });
    container.appendChild(emptyBox);
  }

  inspectJson(user) {
    const modal = qs('#q3-json-modal');
    const codeBox = qs('#q3-modal-json-code');
    const backdrop = qs('#q3-modal-backdrop');

    if (modal && codeBox) {
      codeBox.textContent = JSON.stringify(user, null, 2);
      modal.classList.add('open');
      if (backdrop) backdrop.classList.add('open');

      const closeModal = () => {
        modal.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
      };

      const closeBtn = qs('#q3-modal-close-btn');
      if (closeBtn) closeBtn.onclick = closeModal;
      if (backdrop) backdrop.onclick = closeModal;
    }
  }
}

export const apiViewController = new ApiViewController();
