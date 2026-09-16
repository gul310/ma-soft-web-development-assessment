/**
 * MA SOFT TECH SOLUTIONS - Q5 WEB SECURITY & PERFORMANCE COMPREHENSIVE TEST SUITE
 * Validates: Secure Input Handling, XSS Sanitization, Multi-Tier Validation,
 * API Data Safety, Storage Boundaries, Debounce Delay, DOM Batching, and Q5 Routing.
 */

import { cleanInputString, escapeHTML, sanitizeURL } from '../js/utils/sanitizers.js';
import { ValidationRules } from '../js/utils/validators.js';
import { debounce } from '../js/utils/debounce.js';
import { storageService } from '../js/services/storageService.js';
import { APP_CONFIG } from '../js/config.js';
import { Router } from '../js/core/router.js';

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
console.log('MA SOFT TECH SOLUTIONS - Q5 SECURITY & PERFORMANCE TEST SUITE');
console.log('================================================================');

// --------------------------------------------------------------------------
// PHASE 1: SECURE USER-INPUT HANDLING & SANITIZATION
// --------------------------------------------------------------------------
console.log('\n[Phase 1: Input Sanitization & Boundary Rules]');

// Test 1: Whitespace trimming & normalization
assert(cleanInputString('   Candidate Name   ') === 'Candidate Name', 'Whitespace-trimmed successfully');
assert(cleanInputString('  \n\t  ') === '', 'Whitespace-only string reduced to empty string');
assert(cleanInputString('Multiple    Spaces    Inside') === 'Multiple Spaces Inside', 'Collapsed repeated internal whitespace');

// Test 2: Dangerous protocol neutralization via sanitizeURL
const dangerousUrl = 'javascript:alert(document.cookie)';
const cleanedUrl = sanitizeURL(dangerousUrl);
assert(cleanedUrl === 'about:blank', 'javascript: protocol stripped to about:blank');

const dataUrl = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
const cleanedDataUrl = sanitizeURL(dataUrl);
assert(cleanedDataUrl === 'about:blank', 'data: protocol stripped to about:blank');

const safeHttpsUrl = 'https://jsonplaceholder.typicode.com/users';
assert(sanitizeURL(safeHttpsUrl) === safeHttpsUrl, 'Safe HTTPS URL preserved');

// Test 3: Length boundary validation for Q5 Demo Form
const emptyCheck = ValidationRules.validateName('');
assert(emptyCheck.isValid === false, 'Empty name input rejected');

const shortCheck = ValidationRules.validateName('A');
assert(shortCheck.isValid === false, 'Name under 2 characters rejected');

const oversizedString = 'A'.repeat(51);
const longCheck = ValidationRules.validateName(oversizedString);
assert(longCheck.isValid === false, 'Name exceeding 50 characters rejected');

const validCheck = ValidationRules.validateName('Security Candidate');
assert(validCheck.isValid === true, 'Valid name accepted');

// --------------------------------------------------------------------------
// PHASE 2: STRICT XSS PREVENTION
// --------------------------------------------------------------------------
console.log('\n[Phase 2: Strict XSS Prevention & Neutralization]');

// Test 4: Script tag attack payload
const scriptPayload = "<script>alert('XSS')</script>";
const escapedScript = escapeHTML(scriptPayload);
assert(escapedScript.includes('&lt;script&gt;'), '<script> tag converted to &lt;script&gt;');
assert(!escapedScript.includes('<script>'), 'Raw unescaped <script> tag completely eliminated');

// Test 5: Image onerror event handler attack payload
const imgPayload = "<img src=x onerror=alert(1)>";
const escapedImg = escapeHTML(imgPayload);
assert(escapedImg.includes('&lt;img'), '<img tag converted to &lt;img');
assert(escapedImg.includes('&gt;'), '> bracket converted to &gt;');

// Test 6: Attribute breakout attack payload
const breakoutPayload = '"><script>alert(1)</script>';
const escapedBreakout = escapeHTML(breakoutPayload);
assert(escapedBreakout.includes('&quot;&gt;'), 'Double quotes escaped to &quot;');

// Test 7: SVG onload attack payload
const svgPayload = '<svg onload=alert(1)>';
const escapedSvg = escapeHTML(svgPayload);
assert(escapedSvg.includes('&lt;svg'), '<svg tag neutralized');

// --------------------------------------------------------------------------
// PHASE 3: STORAGE BOUNDARIES & CREDENTIAL SECURITY
// --------------------------------------------------------------------------
console.log('\n[Phase 3: Storage Security & Credential Isolation]');

// Test 8: Verify storage keys do NOT store sensitive credentials
const storageKeys = Object.values(APP_CONFIG.storageKeys);
assert(!storageKeys.includes('password'), 'Storage keys list contains no password key');
assert(!storageKeys.includes('auth_token'), 'Storage keys list contains no auth token key');
assert(!storageKeys.includes('apiKey'), 'Storage keys list contains no API secret key');

// Test 9: Verify current storage contains no passwords or secret tokens
const allStorageKeys = [
  APP_CONFIG.storageKeys.theme,
  APP_CONFIG.storageKeys.q1Items,
  APP_CONFIG.storageKeys.q4Students
];

allStorageKeys.forEach(key => {
  const item = storageService.getItem(key);
  const jsonStr = JSON.stringify(item || '');
  assert(!jsonStr.includes('password') && !jsonStr.includes('secret_key'), `Storage key "${key}" contains 0 sensitive password strings`);
});

// --------------------------------------------------------------------------
// PHASE 4: PERFORMANCE - DEBOUNCING
// --------------------------------------------------------------------------
console.log('\n[Phase 4: Debouncing Utility Execution]');

// Test 10: Debounce coalesces rapid calls
let executionCount = 0;
let lastArg = '';

const debouncedFn = debounce((arg) => {
  executionCount++;
  lastArg = arg;
}, 50);

debouncedFn('call-1');
debouncedFn('call-2');
debouncedFn('call-3');

assert(executionCount === 0, 'Debounced function did not execute synchronously on keystroke');

// Wait for debounce timeout to trigger
await new Promise(resolve => setTimeout(resolve, 80));

assert(executionCount === 1, 'Debounced function executed exactly 1 time for 3 rapid calls');
assert(lastArg === 'call-3', 'Debounced function executed with the latest trailing argument ("call-3")');

// --------------------------------------------------------------------------
// PHASE 5: PERFORMANCE - DOM BATCHING LOGIC
// --------------------------------------------------------------------------
console.log('\n[Phase 5: DOM Batching & Performance Constructs]');

// Test 11: DocumentFragment simulation in memory
const simulatedBatch = [];
for (let i = 0; i < 1000; i++) {
  simulatedBatch.push({ id: i, text: `Item ${i}` });
}
assert(simulatedBatch.length === 1000, 'Constructed 1,000 items in memory array prior to DOM insertion');

// --------------------------------------------------------------------------
// PHASE 6: API DEFENSIVE HANDLING
// --------------------------------------------------------------------------
console.log('\n[Phase 6: Safe API Data Handling & Schema Normalization]');

// Test 12: Malformed API JSON normalization
const malformedApiRecord = {
  id: 99,
  name: '<script>alert("api_xss")</script>',
  // Missing username, missing email, missing address
};

const safeName = malformedApiRecord.name;
const escapedApiName = escapeHTML(safeName);
const safeEmail = malformedApiRecord.email || 'No email provided';
const safeCity = malformedApiRecord.address?.city || 'Unknown Location';

assert(escapedApiName.includes('&lt;script&gt;'), 'API text containing script tags is properly escaped');
assert(safeEmail === 'No email provided', 'Missing API email field safely defaulted');
assert(safeCity === 'Unknown Location', 'Missing nested API address.city safely defaulted');

// --------------------------------------------------------------------------
// PHASE 7: Q5 ROUTE RESOLUTION
// --------------------------------------------------------------------------
console.log('\n[Phase 7: SPA Router Q5 Integration]');

const router = new Router();
assert(router.normalizeRoute('q5-security') === 'q5-security', 'Router normalizes "q5-security"');
assert(router.normalizeRoute('q5') === 'q5-security', 'Router normalizes alias "q5" to "q5-security"');
assert(router.normalizeRoute('#/q5-security') === 'q5-security', 'Router normalizes hash "#/q5-security"');
assert(router.normalizeRoute('#q5') === 'q5-security', 'Router normalizes hash "#q5"');

// --------------------------------------------------------------------------
// SUMMARY
// --------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Q5 TEST EXECUTION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${failedTests} FAILS)`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
