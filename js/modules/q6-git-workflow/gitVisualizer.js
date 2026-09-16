/**
 * Q6 Git Visualizer: Version Control Strategy & Command Hub
 */

import { qs, qsa } from '../../utils/dom.js';
import { toast } from '../../core/toast.js';

export class GitVisualizer {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.setupClipboardActions();
    this.isInitialized = true;
  }

  setupClipboardActions() {
    const copyButtons = qsa('.copy-cmd-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const textToCopy = btn.dataset.clipboard || btn.closest('.terminal-box')?.textContent || '';
        if (textToCopy && navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success('Git command copied to clipboard.');
          }).catch(() => {
            toast.info('Command selected.');
          });
        }
      });
    });
  }
}

export const gitVisualizer = new GitVisualizer();
