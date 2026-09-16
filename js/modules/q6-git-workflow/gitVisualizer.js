/**
 * MA SOFT TECH SOLUTIONS - ASSESSMENT HUB
 * Q6: Git & GitHub Workflow Visualizer & Interactive Repository Explorer
 */

import { qs, qsa } from '../../utils/dom.js';
import { toast } from '../../core/toast.js';
import { debounce } from '../../utils/debounce.js';

export const REPOSITORY_COMMITS = [
  {
    hash: 'b01d3d0',
    type: 'merge',
    branch: 'main',
    badgeClass: 'badge-success',
    title: 'merge: integrate Q5 security and performance feature',
    scope: 'Merge commit',
    description: 'Integrated live XSS sandbox, DOM reflow benchmark, 33/33 tests passing, total updated to 204/204'
  },
  {
    hash: 'd53569d',
    type: 'test',
    branch: 'feature/q5-security-performance',
    badgeClass: 'badge-neutral',
    title: 'test(q5): add security and performance regression tests',
    scope: 'Automated Suite',
    description: 'Added 33 automated test assertions for XSS, storage safety, debouncing, and DOM fragments'
  },
  {
    hash: '5384e74',
    type: 'feat',
    branch: 'feature/q5-security-performance',
    badgeClass: 'badge-neutral',
    title: 'feat(q5): implement security and performance improvements',
    scope: 'Feature',
    description: 'Built live XSS sandbox, DOM reflow benchmark, input validation engine, and technical audit'
  },
  {
    hash: '899b0ed',
    type: 'merge',
    branch: 'main',
    badgeClass: 'badge-success',
    title: 'merge: integrate Q4 student CRUD feature',
    scope: 'Merge commit',
    description: 'Integrated full Student Management System with 57/57 passing regression tests'
  },
  {
    hash: '14aa9eb',
    type: 'test',
    branch: 'feature/q4-student-crud',
    badgeClass: 'badge-neutral',
    title: 'test(q4): add student CRUD regression coverage',
    scope: 'Automated Suite',
    description: '57 unit & E2E assertions for model persistence, validation, immutability, undo, and search'
  },
  {
    hash: '08b92b5',
    type: 'feat',
    branch: 'feature/q4-student-crud',
    badgeClass: 'badge-neutral',
    title: 'feat(q4): implement student management CRUD',
    scope: 'Feature',
    description: 'MVC architecture: studentModel.js, studentView.js, studentController.js with full CRUD & search'
  },
  {
    hash: 'cd2fba1',
    type: 'test',
    branch: 'main',
    badgeClass: 'badge-primary',
    title: 'test: preserve Q1-Q3 automated regression test suites',
    scope: 'Test Infrastructure',
    description: 'Preserved 114 automated tests in scratch/ directory for continuous regression safety'
  },
  {
    hash: '5c5416b',
    type: 'merge',
    branch: 'main',
    badgeClass: 'badge-success',
    title: 'merge: integrate external browser run configuration',
    scope: 'Merge commit',
    description: 'Configured VS Code tasks, package.json serve scripts for reliable HTTP localhost:8080 execution'
  },
  {
    hash: '336d08e',
    type: 'fix',
    branch: 'fix/external-browser-run',
    badgeClass: 'badge-warning',
    title: 'fix: make external browser run reliably',
    scope: 'Hotfix',
    description: 'Resolved launch.json browser auto-open and HTTP origin binding'
  },
  {
    hash: 'd18f32f',
    type: 'chore',
    branch: 'fix/external-browser-run',
    badgeClass: 'badge-neutral',
    title: 'chore: add package.json with standard dev and start scripts',
    scope: 'Configuration',
    description: 'Standardized dev server startup commands on port 8080'
  },
  {
    hash: '0c58287',
    type: 'fix',
    branch: 'fix/external-browser-run',
    badgeClass: 'badge-warning',
    title: 'fix: repair blocked UI interaction and scrolling',
    scope: 'Bugfix',
    description: 'Removed pointer-event and scroll blocking overlays'
  },
  {
    hash: 'dccfc6b',
    type: 'merge',
    branch: 'main',
    badgeClass: 'badge-success',
    title: 'merge: integrate Q1-Q3 navigation fix',
    scope: 'Merge commit',
    description: 'Unified hash routing aliases across all SPA views'
  },
  {
    hash: '948e7b1',
    type: 'fix',
    branch: 'fix/q1-q3-navigation',
    badgeClass: 'badge-warning',
    title: 'fix: repair Q1-Q3 UI navigation',
    scope: 'Bugfix',
    description: 'Fixed router hash parsing and active tab styling'
  },
  {
    hash: 'f84e534',
    type: 'merge',
    branch: 'main',
    badgeClass: 'badge-success',
    title: 'fix: integrate Q1-Q3 functional corrections',
    scope: 'Merge commit',
    description: 'Merged REST API explorer and end-to-end integration fixes into main'
  },
  {
    hash: 'ee89b33',
    type: 'fix',
    branch: 'fix/q1-q3-functional-integration',
    badgeClass: 'badge-warning',
    title: 'fix: restore Q1-Q3 end-to-end functionality',
    scope: 'Bugfix',
    description: 'Repaired API client retry logic and event listeners'
  },
  {
    hash: '0b03884',
    type: 'feat',
    branch: 'feature/q3-rest-api',
    badgeClass: 'badge-neutral',
    title: 'feat(q3): integrate REST API explorer',
    scope: 'Feature',
    description: 'Live JSONPlaceholder API consumer with search, filter, AbortController, and error simulators'
  },
  {
    hash: 'd616fef',
    type: 'merge',
    branch: 'main',
    badgeClass: 'badge-success',
    title: 'merge: integrate Q2 registration form validation',
    scope: 'Merge commit',
    description: 'Integrated 5-field registration form with password strength engine into main'
  },
  {
    hash: '024a6b2',
    type: 'feat',
    branch: 'feature/q2-form-validation',
    badgeClass: 'badge-neutral',
    title: 'feat(q2): implement registration form validation',
    scope: 'Feature',
    description: 'RFC email regex, Pakistani phone auto-formatter, and 5-point password strength evaluation'
  },
  {
    hash: '873a6c6',
    type: 'merge',
    branch: 'main',
    badgeClass: 'badge-success',
    title: 'merge: integrate Q1 DOM manipulation feature into main',
    scope: 'Merge commit',
    description: 'First feature branch integrated into main with clean test baseline'
  },
  {
    hash: '9e9541c',
    type: 'feat',
    branch: 'feature/q1-dom-manipulation',
    badgeClass: 'badge-neutral',
    title: 'feat(q1): implement advanced DOM item manager',
    scope: 'Feature',
    description: 'Dynamic item manager with inline edit, undo toasts, filters, and batch DOM rendering'
  },
  {
    hash: 'f5a4439',
    type: 'chore',
    branch: 'main',
    badgeClass: 'badge-neutral',
    title: 'chore: initialize assessment project',
    scope: 'Root Commit',
    description: 'Initial repository setup with CSS tokens, layout architecture, and vanilla JS structure'
  }
];

export class GitVisualizer {
  constructor() {
    this.isInitialized = false;
    this.commits = REPOSITORY_COMMITS;
  }

  init() {
    this.setupClipboardActions();
    this.setupSearchAndFilter();
    this.updateCommitCountBadge(this.commits.length, this.commits.length);
    this.isInitialized = true;
  }

  setupClipboardActions() {
    const copyButtons = qsa('.copy-cmd-btn');
    copyButtons.forEach(btn => {
      // Remove any previously attached click listeners by cloning or checking
      btn.onclick = () => {
        const textToCopy = btn.dataset.clipboard || btn.closest('.terminal-box')?.textContent || '';
        if (textToCopy && navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success('Copied to clipboard!');
          }).catch(() => {
            toast.info('Command selected.');
          });
        }
      };
    });
  }

  setupSearchAndFilter() {
    const searchInput = qs('#q6-commit-search');
    const filterSelect = qs('#q6-commit-filter');

    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        this.filterCommits();
      }, 200));
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        this.filterCommits();
      });
    }
  }

  filterCommits() {
    const searchInput = qs('#q6-commit-search');
    const filterSelect = qs('#q6-commit-filter');
    const query = (searchInput?.value || '').trim().toLowerCase();
    const filterType = filterSelect?.value || 'all';

    const commitNodes = qsa('.git-commit-node', qs('#q6-git-tree-container'));
    let visibleCount = 0;

    commitNodes.forEach(node => {
      const type = node.dataset.type || '';
      const hash = (node.dataset.hash || '').toLowerCase();
      const text = node.textContent.toLowerCase();

      const matchesType = (filterType === 'all') || (type === filterType);
      const matchesQuery = !query || hash.includes(query) || text.includes(query);

      if (matchesType && matchesQuery) {
        node.style.display = 'flex';
        visibleCount++;
      } else {
        node.style.display = 'none';
      }
    });

    this.updateCommitCountBadge(visibleCount, commitNodes.length);
  }

  updateCommitCountBadge(visible, total) {
    const badge = qs('#q6-commit-count-badge');
    if (badge) {
      badge.textContent = `Showing ${visible} of ${total} Commits`;
    }
  }
}

export const gitVisualizer = new GitVisualizer();
