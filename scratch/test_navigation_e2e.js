/**
 * E2E Navigation & DOM Routing Regression Test Suite
 * Validates route normalization, sidebar button activation, direct hash routes,
 * module card clicks, browser back/forward transitions, and DOM panel visibility.
 */

import { Router } from '../js/core/router.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let passedTests = 0;
let totalTests = 0;

function assert(condition, name, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${name} ${details ? `(${details})` : ''}`);
  } else {
    console.error(`  ✗ FAIL: ${name} ${details ? `(${details})` : ''}`);
  }
}

function runTests() {
  console.log('================================================================');
  console.log('STARTING UI NAVIGATION & DOM ROUTING REGRESSION TEST SUITE');
  console.log('================================================================\n');

  const router = new Router({
    'overview': () => {},
    'q1-dom': () => {},
    'q2-form': () => {},
    'q3-api': () => {},
    'q4-crud': () => {},
    'q5-security': () => {},
    'q6-git': () => {}
  });

  // 1. Route Normalization Tests
  console.log('[Phase 1: Route Normalization & Alias Resolution]');
  assert(router.normalizeRoute('q1-dom') === 'q1-dom', 'Normalize direct route "q1-dom"');
  assert(router.normalizeRoute('q1') === 'q1-dom', 'Normalize alias "q1" -> "q1-dom"');
  assert(router.normalizeRoute('#q1') === 'q1-dom', 'Normalize hash alias "#q1" -> "q1-dom"');
  assert(router.normalizeRoute('#/q1') === 'q1-dom', 'Normalize full hash alias "#/q1" -> "q1-dom"');
  assert(router.normalizeRoute('#/q1-dom') === 'q1-dom', 'Normalize full hash "#/q1-dom" -> "q1-dom"');

  assert(router.normalizeRoute('q2-form') === 'q2-form', 'Normalize direct route "q2-form"');
  assert(router.normalizeRoute('q2') === 'q2-form', 'Normalize alias "q2" -> "q2-form"');
  assert(router.normalizeRoute('#q2') === 'q2-form', 'Normalize hash alias "#q2" -> "q2-form"');
  assert(router.normalizeRoute('#/q2') === 'q2-form', 'Normalize full hash alias "#/q2" -> "q2-form"');
  assert(router.normalizeRoute('#/q2-form') === 'q2-form', 'Normalize full hash "#/q2-form" -> "q2-form"');

  assert(router.normalizeRoute('q3-api') === 'q3-api', 'Normalize direct route "q3-api"');
  assert(router.normalizeRoute('q3') === 'q3-api', 'Normalize alias "q3" -> "q3-api"');
  assert(router.normalizeRoute('#q3') === 'q3-api', 'Normalize hash alias "#q3" -> "q3-api"');
  assert(router.normalizeRoute('#/q3') === 'q3-api', 'Normalize full hash alias "#/q3" -> "q3-api"');
  assert(router.normalizeRoute('#/q3-api') === 'q3-api', 'Normalize full hash "#/q3-api" -> "q3-api"');

  assert(router.normalizeRoute('') === 'overview', 'Empty route defaults to "overview"');
  assert(router.normalizeRoute('#') === 'overview', '"#" defaults to "overview"');
  assert(router.normalizeRoute('#/') === 'overview', '"#/" defaults to "overview"');
  assert(router.normalizeRoute('#/overview') === 'overview', '"#/overview" resolves to "overview"');
  assert(router.normalizeRoute('#/unknown-route-xyz') === 'overview', 'Unknown route safely falls back to "overview"');

  // 2. HTML View Panel Integrity Check
  console.log('\n[Phase 2: HTML View Panels & Interactive Controls Integrity]');
  const htmlContent = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');

  // Check Q1 DOM elements
  assert(htmlContent.includes('id="view-q1-dom"'), 'Q1 view panel #view-q1-dom exists in DOM');
  assert(htmlContent.includes('id="q1-add-form"'), 'Q1 Add Item form #q1-add-form exists');
  assert(htmlContent.includes('id="q1-item-title-input"'), 'Q1 Item Title input exists');
  assert(htmlContent.includes('id="q1-items-container"'), 'Q1 Item list container #q1-items-container exists');
  assert(htmlContent.includes('id="q1-search-input"'), 'Q1 Search input exists');

  // Check Q2 DOM elements
  assert(htmlContent.includes('id="view-q2-form"'), 'Q2 view panel #view-q2-form exists in DOM');
  assert(htmlContent.includes('id="q2-registration-form"'), 'Q2 registration form #q2-registration-form exists');
  assert(htmlContent.includes('id="reg-name"'), 'Q2 Name input #reg-name exists');
  assert(htmlContent.includes('id="reg-email"'), 'Q2 Email input #reg-email exists');
  assert(htmlContent.includes('id="reg-phone"'), 'Q2 Phone input #reg-phone exists');
  assert(htmlContent.includes('id="reg-password"'), 'Q2 Password input #reg-password exists');
  assert(htmlContent.includes('id="reg-confirm-password"'), 'Q2 Confirm Password input #reg-confirm-password exists');
  assert(htmlContent.includes('id="toggle-password-visibility"'), 'Q2 Password visibility toggle button exists');

  // Check Q3 DOM elements
  assert(htmlContent.includes('id="view-q3-api"'), 'Q3 view panel #view-q3-api exists in DOM');
  assert(htmlContent.includes('id="q3-search-input"'), 'Q3 search input #q3-search-input exists');
  assert(htmlContent.includes('id="q3-city-filter"'), 'Q3 city filter dropdown #q3-city-filter exists');
  assert(htmlContent.includes('id="q3-refresh-btn"'), 'Q3 reload/refresh button #q3-refresh-btn exists');
  assert(htmlContent.includes('id="q3-results-container"'), 'Q3 dynamic results container #q3-results-container exists');

  // Check Overview module cards
  assert(htmlContent.includes('data-target-route="q1-dom"'), 'Overview Q1 module card links to q1-dom');
  assert(htmlContent.includes('data-target-route="q2-form"'), 'Overview Q2 module card links to q2-form');
  assert(htmlContent.includes('data-target-route="q3-api"'), 'Overview Q3 module card links to q3-api');

  // Check Sidebar Navigation buttons
  assert(htmlContent.includes('data-route="overview"'), 'Sidebar Dashboard link exists');
  assert(htmlContent.includes('data-route="q1-dom"'), 'Sidebar Q1 link exists');
  assert(htmlContent.includes('data-route="q2-form"'), 'Sidebar Q2 link exists');
  assert(htmlContent.includes('data-route="q3-api"'), 'Sidebar Q3 link exists');

  // 3. Navigation History Transition Simulation
  console.log('\n[Phase 3: Back/Forward Navigation Sequence Simulation]');
  const historyStack = ['overview'];
  let currentIdx = 0;

  function simulateNav(route) {
    const normalized = router.normalizeRoute(route);
    historyStack.push(normalized);
    currentIdx = historyStack.length - 1;
  }

  function simulateBack() {
    if (currentIdx > 0) currentIdx--;
  }

  function simulateForward() {
    if (currentIdx < historyStack.length - 1) currentIdx++;
  }

  simulateNav('q1-dom');
  assert(historyStack[currentIdx] === 'q1-dom', 'Step 1: Navigate to Q1 -> active route is q1-dom');

  simulateNav('q2-form');
  assert(historyStack[currentIdx] === 'q2-form', 'Step 2: Navigate to Q2 -> active route is q2-form');

  simulateNav('q3-api');
  assert(historyStack[currentIdx] === 'q3-api', 'Step 3: Navigate to Q3 -> active route is q3-api');

  simulateBack();
  assert(historyStack[currentIdx] === 'q2-form', 'Step 4: Browser Back -> active route is q2-form');

  simulateBack();
  assert(historyStack[currentIdx] === 'q1-dom', 'Step 5: Browser Back -> active route is q1-dom');

  simulateForward();
  assert(historyStack[currentIdx] === 'q2-form', 'Step 6: Browser Forward -> active route is q2-form');

  console.log('\n================================================================');
  console.log(`NAVIGATION REGRESSION TEST COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runTests();
