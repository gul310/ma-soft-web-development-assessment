/**
 * Q5 Security & Performance Lab
 * Interactive proof demonstrations, live sandboxes, performance benchmarks,
 * debouncing monitor, and performance timing metrics reader.
 */

import { qs, qsa, createElement, clearElement } from '../../utils/dom.js';
import { escapeHTML, cleanInputString } from '../../utils/sanitizers.js';
import { debounce } from '../../utils/debounce.js';
import { ValidationRules } from '../../utils/validators.js';
import { toast } from '../../core/toast.js';

export class SecurityLab {
  constructor() {
    this.isInitialized = false;
    this.rawKeystrokeCount = 0;
    this.debouncedExecutionCount = 0;
  }

  init() {
    if (this.isInitialized) return;

    this.setupXssSandbox();
    this.setupSecureFormDemo();
    this.setupDebounceTester();
    this.setupPerformanceBenchmark();
    this.setupPerformanceMetrics();

    this.isInitialized = true;
  }

  /**
   * 1. Interactive XSS Defense Sandbox
   */
  setupXssSandbox() {
    const input = qs('#q5-xss-input');
    const safeOutput = qs('#q5-xss-safe-output');
    const escapedOutput = qs('#q5-xss-escaped-output');
    const testPayloadSelect = qs('#q5-payload-preset');

    const updateSandbox = () => {
      const payload = input ? input.value : '';

      // Safe Rendering: Uses textContent & createElement exclusively
      if (safeOutput) {
        clearElement(safeOutput);
        const codeNode = createElement('code', {
          className: 'text-sm font-mono block p-2 bg-secondary rounded',
          text: payload || '(Empty payload)'
        });
        const badge = createElement('span', {
          className: 'badge badge-success mb-2',
          text: '✓ Safe DOM Rendering (textContent - No Execution)'
        });
        safeOutput.appendChild(badge);
        safeOutput.appendChild(codeNode);
      }

      // Escaped Representation for display
      if (escapedOutput) {
        escapedOutput.textContent = escapeHTML(payload);
      }
    };

    if (input) {
      input.addEventListener('input', updateSandbox);
    }

    if (testPayloadSelect) {
      testPayloadSelect.addEventListener('change', (e) => {
        if (input && e.target.value) {
          input.value = e.target.value;
          updateSandbox();
          toast.info('Loaded sample XSS attack payload into test sandbox.');
        }
      });
    }

    // Initial run
    updateSandbox();
  }

  /**
   * 2. Interactive Secure User-Input Form Demo
   */
  setupSecureFormDemo() {
    const form = qs('#q5-secure-form');
    const nameInput = qs('#q5-demo-name');
    const msgInput = qs('#q5-demo-message');
    const nameError = qs('#q5-name-error');
    const msgError = qs('#q5-message-error');
    const logContainer = qs('#q5-form-log');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const rawName = nameInput ? nameInput.value : '';
      const rawMsg = msgInput ? msgInput.value : '';

      const cleanName = cleanInputString(rawName);
      const cleanMsg = cleanInputString(rawMsg);

      let isValid = true;

      // Validate Name
      const nameCheck = ValidationRules.validateName(cleanName);
      if (!nameCheck.isValid) {
        if (nameError) nameError.textContent = nameCheck.message;
        if (nameInput) {
          nameInput.setAttribute('aria-invalid', 'true');
          nameInput.focus();
        }
        isValid = false;
      } else {
        if (nameError) nameError.textContent = '';
        if (nameInput) nameInput.removeAttribute('aria-invalid');
      }

      // Validate Message
      if (!cleanMsg) {
        if (msgError) msgError.textContent = 'Message is required (cannot be empty or whitespace).';
        if (msgInput) {
          msgInput.setAttribute('aria-invalid', 'true');
          if (isValid) msgInput.focus();
        }
        isValid = false;
      } else if (cleanMsg.length < 5) {
        if (msgError) msgError.textContent = 'Message must be at least 5 characters.';
        if (msgInput) {
          msgInput.setAttribute('aria-invalid', 'true');
          if (isValid) msgInput.focus();
        }
        isValid = false;
      } else if (cleanMsg.length > 500) {
        if (msgError) msgError.textContent = 'Message cannot exceed 500 characters.';
        if (msgInput) {
          msgInput.setAttribute('aria-invalid', 'true');
          if (isValid) msgInput.focus();
        }
        isValid = false;
      } else {
        if (msgError) msgError.textContent = '';
        if (msgInput) msgInput.removeAttribute('aria-invalid');
      }

      if (!isValid) {
        toast.error('Please resolve form validation errors.');
        return;
      }

      // Safe DOM Log Entry Creation (textContent only)
      if (logContainer) {
        const entry = createElement('div', {
          className: 'card p-3 mb-2 bg-secondary border-subtle',
          children: [
            createElement('div', {
              className: 'flex justify-between items-center mb-1',
              children: [
                createElement('strong', { text: cleanName }),
                createElement('span', { className: 'text-xs text-muted font-mono', text: new Date().toLocaleTimeString() })
              ]
            }),
            createElement('p', {
              className: 'text-sm text-secondary',
              text: cleanMsg
            })
          ]
        });

        // Remove placeholder if present
        const placeholder = logContainer.querySelector('.empty-log-placeholder');
        if (placeholder) placeholder.remove();

        logContainer.prepend(entry);
      }

      // Reset form
      form.reset();
      toast.success('Submitted sanitized and validated message safely.');
    });
  }

  /**
   * 3. Interactive Debounce & Rate Limiting Monitor
   */
  setupDebounceTester() {
    const input = qs('#q5-debounce-input');
    const rawCountEl = qs('#q5-raw-keystroke-count');
    const debouncedCountEl = qs('#q5-debounced-exec-count');
    const outputEl = qs('#q5-debounce-output');

    if (!input) return;

    const debouncedHandler = debounce((val) => {
      this.debouncedExecutionCount++;
      if (debouncedCountEl) debouncedCountEl.textContent = this.debouncedExecutionCount;
      if (outputEl) outputEl.textContent = `Debounced Handler Executed: "${val}"`;
    }, 300);

    input.addEventListener('input', (e) => {
      this.rawKeystrokeCount++;
      if (rawCountEl) rawCountEl.textContent = this.rawKeystrokeCount;
      debouncedHandler(e.target.value);
    });
  }

  /**
   * 4. Interactive DOM Reflow Benchmark Tool
   */
  setupPerformanceBenchmark() {
    const runBtn = qs('#q5-run-benchmark-btn');
    const naiveTimeEl = qs('#q5-naive-time');
    const fragTimeEl = qs('#q5-frag-time');
    const improvementEl = qs('#q5-improvement-pct');
    const benchmarkTarget = qs('#q5-benchmark-sandbox');

    if (!runBtn) return;

    runBtn.addEventListener('click', () => {
      runBtn.disabled = true;
      runBtn.textContent = 'Running Benchmark (1,000 Nodes)...';

      setTimeout(() => {
        const NODE_COUNT = 1000;

        // 1. Benchmark Naive Iterative Insertion (Forces multiple DOM reflows)
        clearElement(benchmarkTarget);
        const startNaive = performance.now();
        for (let i = 0; i < NODE_COUNT; i++) {
          const div = document.createElement('div');
          div.className = 'benchmark-node';
          div.textContent = `Node #${i}`;
          benchmarkTarget.appendChild(div);
        }
        const endNaive = performance.now();
        const naiveDuration = (endNaive - startNaive).toFixed(2);

        // 2. Benchmark DocumentFragment Batch Insertion (Single reflow)
        clearElement(benchmarkTarget);
        const startFrag = performance.now();
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < NODE_COUNT; i++) {
          const div = document.createElement('div');
          div.className = 'benchmark-node';
          div.textContent = `Node #${i}`;
          fragment.appendChild(div);
        }
        benchmarkTarget.appendChild(fragment);
        const endFrag = performance.now();
        const fragDuration = (endFrag - startFrag).toFixed(2);

        // Clean up sandbox
        clearElement(benchmarkTarget);

        // Render metrics
        if (naiveTimeEl) naiveTimeEl.textContent = `${naiveDuration} ms`;
        if (fragTimeEl) fragTimeEl.textContent = `${fragDuration} ms`;

        const naiveNum = parseFloat(naiveDuration) || 0.01;
        const fragNum = parseFloat(fragDuration) || 0.01;
        const speedup = Math.max(0, (((naiveNum - fragNum) / naiveNum) * 100)).toFixed(0);

        if (improvementEl) improvementEl.textContent = `${speedup}% Faster`;

        runBtn.disabled = false;
        runBtn.textContent = 'Run Benchmark Again';
        toast.success(`Benchmark complete: DocumentFragment batching avoided 1,000 reflows.`);
      }, 100);
    });
  }

  /**
   * 5. Live Navigation & Resource Timing Metrics Reader
   */
  setupPerformanceMetrics() {
    const dclEl = qs('#q5-metric-dcl');
    const loadEl = qs('#q5-metric-load');
    const resourcesEl = qs('#q5-metric-resources');
    const jsCountEl = qs('#q5-metric-js-count');

    const updateMetrics = () => {
      if (typeof window === 'undefined' || typeof performance === 'undefined') return;

      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        const nav = navEntries[0];
        const dcl = (nav.domContentLoadedEventEnd - nav.startTime).toFixed(0);
        const load = (nav.loadEventEnd - nav.startTime).toFixed(0);

        if (dclEl) dclEl.textContent = `${dcl} ms`;
        if (loadEl) loadEl.textContent = `${load > 0 ? load : dcl} ms`;
      } else if (performance.timing) {
        const timing = performance.timing;
        const dcl = timing.domContentLoadedEventEnd - timing.navigationStart;
        const load = timing.loadEventEnd - timing.navigationStart;

        if (dclEl) dclEl.textContent = `${Math.max(0, dcl)} ms`;
        if (loadEl) loadEl.textContent = `${Math.max(0, load)} ms`;
      }

      const resourceEntries = performance.getEntriesByType('resource');
      if (resourceEntries) {
        if (resourcesEl) resourcesEl.textContent = resourceEntries.length;
        const jsResources = resourceEntries.filter(r => r.name.endsWith('.js') || r.initiatorType === 'script');
        if (jsCountEl) jsCountEl.textContent = jsResources.length;
      }
    };

    if (document.readyState === 'complete') {
      updateMetrics();
    } else {
      window.addEventListener('load', () => setTimeout(updateMetrics, 200));
    }
  }
}

export const securityLab = new SecurityLab();
