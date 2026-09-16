/**
 * MA SOFT TECH SOLUTIONS - WEB DEVELOPMENT ASSESSMENT
 * Automated Test Suite: Question 6 - Git & GitHub Workflow / Version Control
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from '../js/core/router.js';
import { REPOSITORY_COMMITS } from '../js/modules/q6-git-workflow/gitVisualizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('================================================================');
console.log('MA SOFT TECH SOLUTIONS - Q6 GIT & GITHUB WORKFLOW TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Phase 1: SPA Router & Q6 Route Registry
// -----------------------------------------------------------------------------
console.log('[Phase 1: SPA Router & Q6 Route Registry]');

const router = new Router({
  'q6-git': () => {}
});

assert(router.normalizeRoute('q6-git') === 'q6-git', 'Router normalizes direct route "q6-git"');
assert(router.normalizeRoute('q6') === 'q6-git', 'Router normalizes alias "q6" -> "q6-git"');
assert(router.normalizeRoute('#/q6-git') === 'q6-git', 'Router normalizes full hash "#/q6-git"');
assert(router.normalizeRoute('#q6') === 'q6-git', 'Router normalizes hash alias "#q6"');

// -----------------------------------------------------------------------------
// Phase 2: Q6 DOM Structure & Accessibility Landmarks
// -----------------------------------------------------------------------------
console.log('\n[Phase 2: Q6 DOM Structure & Accessibility Landmarks]');

assert(htmlContent.includes('id="view-q6-git"'), 'Q6 view panel #view-q6-git exists in DOM');
assert(htmlContent.includes('role="tabpanel"') && htmlContent.includes('aria-labelledby="tab-q6-git"'), 'Q6 view panel has role="tabpanel" and aria-labelledby');
assert(htmlContent.includes('data-route="q6-git"'), 'Sidebar navigation contains Q6 button with data-route="q6-git"');
assert(htmlContent.includes('data-target-route="q6-git"'), 'Dashboard overview contains Q6 module card with data-target-route="q6-git"');

// -----------------------------------------------------------------------------
// Phase 3: Repository Branch Strategy Verification
// -----------------------------------------------------------------------------
console.log('\n[Phase 3: Repository Branch Strategy Verification]');

const expectedBranches = [
  'main',
  'feature/q1-dom-manipulation',
  'feature/q2-form-validation',
  'feature/q3-rest-api',
  'feature/q4-student-crud',
  'feature/q5-security-performance',
  'feature/q6-git-workflow',
  'fix/q1-q3-functional-integration',
  'fix/q1-q3-navigation',
  'fix/q1-q3-ui-interaction',
  'fix/external-browser-run'
];

expectedBranches.forEach(branch => {
  assert(htmlContent.includes(branch), `Branch strategy documents real branch: "${branch}"`);
});

// -----------------------------------------------------------------------------
// Phase 4: Commit History Verification Against Real Git History
// -----------------------------------------------------------------------------
console.log('\n[Phase 4: Commit History Verification Against Real Git History]');

assert(REPOSITORY_COMMITS.length >= 20, `Repository commits list contains at least 20 historical commits (Found: ${REPOSITORY_COMMITS.length})`);

const criticalHashes = [
  { hash: 'f5a4439', desc: 'Root initial commit' },
  { hash: '9e9541c', desc: 'Q1 feature commit' },
  { hash: '873a6c6', desc: 'Q1 merge commit' },
  { hash: '024a6b2', desc: 'Q2 feature commit' },
  { hash: 'd616fef', desc: 'Q2 merge commit' },
  { hash: '0b03884', desc: 'Q3 feature commit' },
  { hash: '899b0ed', desc: 'Q4 merge commit' },
  { hash: '08b92b5', desc: 'Q4 feature commit' },
  { hash: '5384e74', desc: 'Q5 feature commit' },
  { hash: 'd53569d', desc: 'Q5 test commit' },
  { hash: 'b01d3d0', desc: 'Q5 merge commit / current main' }
];

criticalHashes.forEach(({ hash, desc }) => {
  const existsInArray = REPOSITORY_COMMITS.some(c => c.hash === hash);
  const existsInHtml = htmlContent.includes(hash);
  assert(existsInArray && existsInHtml, `Critical commit hash ${hash} (${desc}) exists in visualizer dataset and DOM`);
});

// -----------------------------------------------------------------------------
// Phase 5: Version Control Loss-Prevention & Overwriting Explanations
// -----------------------------------------------------------------------------
console.log('\n[Phase 5: Version Control Loss-Prevention & Overwriting Explanations]');

assert(htmlContent.toLowerCase().includes('reflog') && htmlContent.includes('Immutable'), 'Explains immutable cryptographic history & reflog recovery');
assert(htmlContent.includes('Isolation') || htmlContent.includes('Branch Sandboxing'), 'Explains feature branch isolation & sandboxing');
assert(htmlContent.includes('Pull Request') || htmlContent.includes('Code Review'), 'Explains code review & pull request quality gating');
assert(htmlContent.includes('revert') || htmlContent.includes('Rollback'), 'Explains non-destructive rollback via git revert');

// -----------------------------------------------------------------------------
// Phase 6: Merge Conflict Protocol Validation
// -----------------------------------------------------------------------------
console.log('\n[Phase 6: Merge Conflict Protocol Validation]');

assert(htmlContent.includes('Merge Conflict') || htmlContent.includes('Conflict Resolution'), 'Explains merge conflict resolution procedure');
assert(htmlContent.includes('&lt;&lt;&lt;&lt;&lt;&lt;&lt;') || htmlContent.includes('<<<<<<<'), 'Displays Git conflict marker syntax');

// -----------------------------------------------------------------------------
// Phase 7: Interactive Git Visualizer Elements
// -----------------------------------------------------------------------------
console.log('\n[Phase 7: Interactive Git Visualizer Elements]');

assert(htmlContent.includes('id="q6-commit-search"'), 'Commit search input #q6-commit-search exists in DOM');
assert(htmlContent.includes('id="q6-commit-filter"'), 'Commit filter select #q6-commit-filter exists in DOM');
assert(htmlContent.includes('copy-cmd-btn') && htmlContent.includes('data-clipboard='), 'Interactive copy command buttons configured with data-clipboard attributes');

console.log('\n================================================================');
console.log(`Q6 TEST EXECUTION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${failedTests} FAILS)`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
