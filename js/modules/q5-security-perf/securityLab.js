/**
 * Q5 Security & Performance Lab
 * Interactive proof demonstrations and deep-dive technical explanations for 6 best practices.
 */

import { qs, createElement, clearElement } from '../../utils/dom.js';
import { escapeHTML } from '../../utils/sanitizers.js';
import { toast } from '../../core/toast.js';

export class SecurityLab {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.setupXssSandbox();
    this.setupPerformanceBenchmark();
    this.isInitialized = true;
  }

  setupXssSandbox() {
    const input = qs('#q5-xss-input');
    const safeOutput = qs('#q5-xss-safe-output');
    const unsafeOutput = qs('#q5-xss-unsafe-output');
    const testPayloadSelect = qs('#q5-payload-preset');

    const updateSandbox = () => {
      const payload = input ? input.value : '';

      // Safe Rendering: Uses textContent and safe DOM construction
      if (safeOutput) {
        clearElement(safeOutput);
        const codeNode = createElement('code', {
          className: 'text-sm font-mono',
          text: payload
        });
        const badge = createElement('span', {
          className: 'badge badge-success mb-2',
          text: '✓ Neutralized via textContent & Escaping'
        });
        safeOutput.appendChild(badge);
        safeOutput.appendChild(createElement('div', { children: [codeNode] }));
      }

      // Escaped Representation for display
      if (unsafeOutput) {
        unsafeOutput.textContent = escapeHTML(payload);
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
        toast.success(`Benchmark complete: DocumentFragment saved reflow overhead.`);
      }, 100);
    });
  }
}

export const securityLab = new SecurityLab();
