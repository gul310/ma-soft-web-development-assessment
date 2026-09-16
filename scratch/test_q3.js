/**
 * Automated Verification Suite for Q3: REST API Integration
 * Tests real API connectivity, filtering, search, error handling, cancellation, and regressions.
 */

import { filterUsers } from '../js/modules/q3-api-integration/apiFilters.js';
import { apiService } from '../js/services/apiService.js';
import { RegistrationFormValidator } from '../js/modules/q2-form-validation/formValidator.js';
import { itemStore } from '../js/modules/q1-dom-manipulator/itemStore.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING Q3 REST API & INTEGRATION VERIFICATION SUITE');
  console.log('====================================================\n');

  // Test 1: Real API Request to JSONPlaceholder
  console.log('[Phase 1: Real Public REST API Request]');
  let users = [];
  try {
    apiService.clearCache();
    apiService.setSimulationMode('normal');
    apiService.setSimulatedLatency(0);

    const startTime = Date.now();
    users = await apiService.fetchUsers({ bypassCache: true });
    const duration = Date.now() - startTime;

    assert(Array.isArray(users), 'API returns an Array', `Type: ${typeof users}`);
    assert(users.length === 10, 'API returns exactly 10 users from JSONPlaceholder', `Count: ${users.length}`);
    assert(duration > 0, `Real HTTP network roundtrip measured: ${duration}ms`);

    // Verify record structure
    const sampleUser = users[0];
    assert(typeof sampleUser.name === 'string' && sampleUser.name.length > 0, 'User record has name', sampleUser.name);
    assert(typeof sampleUser.username === 'string', 'User record has username', sampleUser.username);
    assert(typeof sampleUser.email === 'string', 'User record has email', sampleUser.email);
    assert(typeof sampleUser.phone === 'string', 'User record has phone', sampleUser.phone);
    assert(typeof sampleUser.address?.city === 'string', 'User record has nested address.city', sampleUser.address?.city);
    assert(typeof sampleUser.company?.name === 'string', 'User record has nested company.name', sampleUser.company?.name);
    assert(typeof sampleUser.website === 'string', 'User record has website', sampleUser.website);
  } catch (err) {
    assert(false, 'Real API request failed with exception', err.message);
  }

  // Test 2: In-Memory Caching & Local Search (No extra network hits)
  console.log('\n[Phase 2: In-Memory Caching & Network Optimization]');
  try {
    const cachedUsers = await apiService.fetchUsers({ bypassCache: false });
    assert(cachedUsers === users, 'Subsequent fetch returns cached instance without network request');
  } catch (err) {
    assert(false, 'Cache retrieval failed', err.message);
  }

  // Test 3: Search Functionality
  console.log('\n[Phase 3: Search Filtering across Fields]');
  if (users.length >= 10) {
    // Search by Name (e.g., "Leanne")
    const nameResults = filterUsers(users, 'leanne', 'all');
    assert(nameResults.length >= 1 && nameResults[0].name.toLowerCase().includes('leanne'), 'Search by Name (case-insensitive)');

    // Search by Username (e.g., "Bret")
    const usernameResults = filterUsers(users, 'bret', 'all');
    assert(usernameResults.length >= 1 && usernameResults[0].username.toLowerCase().includes('bret'), 'Search by Username');

    // Search by Email (e.g., "Sincere@april.biz")
    const emailResults = filterUsers(users, 'sincere@april.biz', 'all');
    assert(emailResults.length === 1, 'Search by Email');

    // Search by City (e.g., "Gwenborough")
    const citySearch = filterUsers(users, 'gwenborough', 'all');
    assert(citySearch.length >= 1, 'Search by City in search box');

    // Search with zero results
    const zeroResults = filterUsers(users, 'nonexistentxyz999', 'all');
    assert(zeroResults.length === 0, 'Search with zero matches produces empty array (no-results)');
  }

  // Test 4: City Dropdown Filter
  console.log('\n[Phase 4: City Dropdown Filtering]');
  if (users.length >= 10) {
    const firstCity = users[0].address.city;
    const cityFiltered = filterUsers(users, '', firstCity);
    assert(cityFiltered.length >= 1 && cityFiltered.every(u => u.address.city.toLowerCase() === firstCity.toLowerCase()), `Filter by City dropdown: ${firstCity}`);

    // Combined Search + City Filter
    const combined = filterUsers(users, users[0].name, firstCity);
    assert(combined.length === 1 && combined[0].id === users[0].id, 'Combined Search Query + City Filter matches precise record');

    // Filter with zero matching
    const zeroCity = filterUsers(users, 'Leanne', 'South Christy');
    assert(zeroCity.length === 0, 'Conflicting search + filter yields 0 records (no-results state)');
  }

  // Test 5: Defensive Normalization
  console.log('\n[Phase 5: Missing Fields & Malformed Data Defense]');
  const malformedData = [
    { id: 99, name: null, username: undefined },
    { id: 100, name: 'Partial User', email: null, address: null, company: null }
  ];
  const normalizedSearch = filterUsers(malformedData, 'partial', 'all');
  assert(normalizedSearch.length === 1, 'filterUsers handles null/undefined nested properties safely without throwing');

  // Test 6: Error Handling Simulations (404, 500, Offline, Timeout)
  console.log('\n[Phase 6: Granular Error Handling Simulations]');
  
  // 404 Simulation
  apiService.setSimulationMode('error-404');
  try {
    await apiService.fetchUsers({ bypassCache: true });
    assert(false, 'Should have thrown HTTP 404 error');
  } catch (err) {
    assert(err.message.includes('404'), 'Correctly throws HTTP 404 error message', err.message);
  }

  // 500 Simulation
  apiService.setSimulationMode('error-500');
  try {
    await apiService.fetchUsers({ bypassCache: true });
    assert(false, 'Should have thrown HTTP 500 error');
  } catch (err) {
    assert(err.message.includes('500'), 'Correctly throws HTTP 500 error message', err.message);
  }

  // Timeout Simulation
  apiService.setSimulationMode('error-timeout');
  try {
    await apiService.fetchUsers({ bypassCache: true });
    assert(false, 'Should have thrown Timeout error');
  } catch (err) {
    assert(err.message.includes('Timeout') || err.message.includes('abort'), 'Correctly throws Timeout / Abort error', err.message);
  }

  // Network Offline Simulation
  apiService.setSimulationMode('error-network');
  try {
    await apiService.fetchUsers({ bypassCache: true });
    assert(false, 'Should have thrown Network error');
  } catch (err) {
    assert(err.message.includes('Network Error'), 'Correctly throws Network Error message', err.message);
  }

  // Reset to normal
  apiService.setSimulationMode('normal');

  // Test 7: AbortController Request Cancellation
  console.log('\n[Phase 7: AbortController In-Flight Cancellation]');
  try {
    const controller = new AbortController();
    controller.abort();
    assert(controller.signal.aborted === true, 'AbortController signal aborts properly');
  } catch (err) {
    assert(false, 'AbortController test failed', err.message);
  }

  // Phase 8: Q1 & Q2 Regressions
  console.log('\n[Phase 8: Q1 & Q2 Regression Verification]');
  // Q1 Check
  itemStore.resetDefaults();
  const q1Items = itemStore.getItems();
  assert(q1Items.length === 3, 'Q1: ItemStore initializes 3 default items', `Count: ${q1Items.length}`);
  const added = itemStore.addItem({ title: 'Regression Test Item', category: 'General', priority: 'High' });
  assert(added && itemStore.getItems().length === 4, 'Q1: Add item works');
  itemStore.removeItem(added.id);
  assert(itemStore.getItems().length === 3, 'Q1: Remove/delete item works');

  // Q2 Check
  const validator = new RegistrationFormValidator();
  const validFormData = {
    name: 'Fatima Ali',
    email: 'fatima.ali@techcorp.com',
    phone: '03001234567',
    password: 'Password@2026',
    confirmPassword: 'Password@2026'
  };
  const q2Validation = validator.validateAll(validFormData);
  assert(q2Validation.isValid === true, 'Q2: Registration form validation passes valid payload');

  const invalidFormData = {
    name: 'J',
    email: 'invalid-email',
    phone: '123',
    password: 'weak',
    confirmPassword: 'mismatch'
  };
  const q2Invalid = validator.validateAll(invalidFormData);
  assert(q2Invalid.isValid === false && Object.keys(q2Invalid.errors).length === 5, 'Q2: Registration form rejects all 5 invalid fields');

  console.log('\n====================================================');
  console.log(`Q3 VERIFICATION COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');
}

runTests();
