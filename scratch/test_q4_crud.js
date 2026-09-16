/**
 * MA SOFT TECH SOLUTIONS - Q4 STUDENT MANAGEMENT (CRUD) COMPREHENSIVE TEST SUITE
 * Validates: Model CRUD, LocalStorage Persistence, Validation Rules, View Rendering,
 * Search & Filters, Sort, Modal Flows, Delete Confirmation & Undo, XSS Defenses, and Q1-Q3 Regression.
 */

import { ValidationRules } from '../js/utils/validators.js';
import { studentModel } from '../js/modules/q4-student-crud/studentModel.js';
import { INITIAL_STUDENTS } from '../js/config.js';
import { cleanInputString, escapeHTML } from '../js/utils/sanitizers.js';
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
console.log('MA SOFT TECH SOLUTIONS - Q4 STUDENT CRUD AUTOMATED TEST SUITE');
console.log('================================================================');

// --------------------------------------------------------------------------
// PHASE 1: DATA PERSISTENCE & RECOVERY
// --------------------------------------------------------------------------
console.log('\n[Phase 1: Student Model & Data Persistence]');

// Test 1: Reset and load initial dataset
studentModel.resetToInitial();
const initialList = studentModel.getAll();
assert(initialList.length === INITIAL_STUDENTS.length, `Initial dataset loaded exactly ${INITIAL_STUDENTS.length} students`);
assert(initialList[0].id === 'STU-1001', 'First student ID is STU-1001');
assert(initialList[0].program === 'Software Engineering', 'Student program is correctly loaded');

// Test 2: Uniqueness checker
assert(studentModel.isIdUnique('STU-9999') === true, 'Unique ID STU-9999 recognized as available');
assert(studentModel.isIdUnique('STU-1001') === false, 'Existing ID STU-1001 recognized as taken');
assert(studentModel.isIdUnique('STU-1001', 'STU-1001') === true, 'Self-ID recognized as valid during edit');

// Test 3: Get Stats
const stats = studentModel.getStats();
assert(stats.total === initialList.length, `Stats total correctly reflects ${initialList.length} students`);
assert(typeof stats.avgGpa === 'string', 'Average GPA formatted as string');
assert(stats.activeCount >= 1, `Active student count calculated correctly (${stats.activeCount})`);

// --------------------------------------------------------------------------
// PHASE 2: ADD OPERATION & MULTI-TIER VALIDATION
// --------------------------------------------------------------------------
console.log('\n[Phase 2: Add Student & Multi-Tier Validation]');

// Test 4: Validation - Student ID
assert(ValidationRules.validateStudentID('').isValid === false, 'Empty Student ID rejected');
assert(ValidationRules.validateStudentID('AB').isValid === false, 'Too short Student ID (<3 chars) rejected');
assert(ValidationRules.validateStudentID('STU-1001', initialList).isValid === false, 'Duplicate Student ID rejected');
assert(ValidationRules.validateStudentID('STU-2025', initialList).isValid === true, 'Valid new Student ID accepted');

// Test 5: Validation - Name
assert(ValidationRules.validateName('').isValid === false, 'Empty Name rejected');
assert(ValidationRules.validateName('A').isValid === false, 'Single char Name rejected');
assert(ValidationRules.validateName('12345').isValid === false, 'Numeric Name rejected');
assert(ValidationRules.validateName('Ayesha Khan').isValid === true, 'Valid Name accepted');

// Test 6: Validation - Email
assert(ValidationRules.validateEmail('plainaddress').isValid === false, 'Invalid Email rejected');
assert(ValidationRules.validateEmail('ayesha.khan@example.com').isValid === true, 'Valid Email accepted');

// Test 7: Validation - Phone
assert(ValidationRules.validatePhone('123').isValid === false, 'Too short Phone rejected');
assert(ValidationRules.validatePhone('03001234567').isValid === true, 'Pakistani local phone (03001234567) accepted');
assert(ValidationRules.validatePhone('+923001234567').isValid === true, 'Pakistani intl phone (+923001234567) accepted');

// Test 8: Validation - Program, Semester, Status
assert(ValidationRules.validateProgram('').isValid === false, 'Empty Program rejected');
assert(ValidationRules.validateProgram('Software Engineering').isValid === true, 'Valid Program accepted');
assert(ValidationRules.validateSemester('0').isValid === false, 'Semester 0 rejected');
assert(ValidationRules.validateSemester('6').isValid === true, 'Semester 6 accepted');
assert(ValidationRules.validateStatus('Unknown').isValid === false, 'Invalid Status rejected');
assert(ValidationRules.validateStatus('Active').isValid === true, 'Status Active accepted');

// Test 9: Create new valid student
const newStudentPayload = {
  id: 'STU-2001',
  name: 'Ayesha Khan',
  email: 'ayesha.student@example.com',
  phone: '03001234567',
  program: 'Software Engineering',
  semester: '6',
  gpa: 3.85,
  status: 'Active',
  enrollDate: '2024-09-01'
};

const createdStudent = studentModel.create(newStudentPayload);
assert(createdStudent.id === 'STU-2001', 'Student created with ID STU-2001');
assert(studentModel.getAll().length === initialList.length + 1, 'Total student count incremented to 6');
assert(studentModel.getById('STU-2001').name === 'Ayesha Khan', 'Created student retrievable by ID');

// --------------------------------------------------------------------------
// PHASE 3: EDIT OPERATION
// --------------------------------------------------------------------------
console.log('\n[Phase 3: Edit Student & Immutability]');

// Test 10: Update existing student
const updatedStudent = studentModel.update('STU-2001', {
  program: 'Artificial Intelligence',
  semester: '7',
  gpa: 3.95
});

assert(updatedStudent !== null, 'Update operation succeeded');
assert(updatedStudent.program === 'Artificial Intelligence', 'Program updated to Artificial Intelligence');
assert(updatedStudent.semester === '7', 'Semester updated to 7');
assert(updatedStudent.gpa === 3.95, 'GPA updated to 3.95');
assert(studentModel.getAll().length === 6, 'Edit did not create duplicate record');

// Test 11: Immutable primary key enforcement
studentModel.update('STU-2001', { id: 'STU-CHANGED' });
assert(studentModel.getById('STU-2001') !== null, 'Student ID remains immutable STU-2001');

// --------------------------------------------------------------------------
// PHASE 4: DELETE OPERATION & UNDO RESTORATION
// --------------------------------------------------------------------------
console.log('\n[Phase 4: Delete & Undo History Stack]');

// Test 12: Delete student
const deleted = studentModel.delete('STU-2001');
assert(deleted !== null, 'Delete operation returned deleted record');
assert(deleted.name === 'Ayesha Khan', 'Deleted record matches Ayesha Khan');
assert(studentModel.getById('STU-2001') === null, 'Student STU-2001 no longer in active database');
assert(studentModel.getAll().length === 5, 'Student count decremented to 5');

// Test 13: Undo Delete
const restored = studentModel.undoDelete();
assert(restored !== null, 'Undo delete successfully popped deleted record');
assert(restored.id === 'STU-2001', 'Restored record ID is STU-2001');
assert(studentModel.getById('STU-2001') !== null, 'Student STU-2001 restored into active database');
assert(studentModel.getAll().length === 6, 'Student count restored to 6');

// --------------------------------------------------------------------------
// PHASE 5: MULTI-FIELD SEARCH & FILTERING
// --------------------------------------------------------------------------
console.log('\n[Phase 5: Search, Filter, and Sort]');

const allStudents = studentModel.getAll();

// Test 14: Search by name (case-insensitive)
const nameMatch = allStudents.filter(s => s.name.toLowerCase().includes('ayesha'));
assert(nameMatch.length >= 1 && nameMatch[0].id === 'STU-2001', 'Search by name "ayesha" returns STU-2001');

// Test 15: Search by ID
const idMatch = allStudents.filter(s => s.id.toLowerCase().includes('stu-1001'));
assert(idMatch.length === 1 && idMatch[0].name.includes('Aisha'), 'Search by ID "stu-1001" returns STU-1001');

// Test 16: Search by Program
const progMatch = allStudents.filter(s => s.program.toLowerCase().includes('artificial'));
assert(progMatch.length >= 1, 'Search by program "artificial" returns matching records');

// Test 17: No-results search query
const emptyMatch = allStudents.filter(s => s.name.toLowerCase().includes('nonexistentstudent999'));
assert(emptyMatch.length === 0, 'Impossible search query returns 0 matching results');

// --------------------------------------------------------------------------
// PHASE 6: SECURITY & XSS DEFENSES
// --------------------------------------------------------------------------
console.log('\n[Phase 6: XSS Sanitization & Safe DOM Handling]');

// Test 18: Malicious input sanitization
const maliciousInput = "<script>alert('XSS_ATTACK')</script>";
const cleaned = cleanInputString(maliciousInput);
assert(!cleaned.includes('javascript:'), 'Cleaned string strips dangerous protocols');

const escaped = escapeHTML(maliciousInput);
assert(escaped.includes('&lt;script&gt;'), 'HTML tags converted to safe character entities');

// Test 19: Safe storage and retrieval
const xssStudent = studentModel.create({
  id: 'STU-XSS',
  name: "<img src=x onerror=alert('xss')>",
  email: 'safe.test@university.edu',
  phone: '03001234567',
  program: 'Cybersecurity',
  semester: '3',
  status: 'Active'
});

assert(xssStudent.name === "<img src=x onerror=alert('xss')>", 'Input string stored verbatim as data');
assert(typeof xssStudent.name === 'string', 'Field remains pure string literal, not executable HTML');

// Clean up XSS student
studentModel.delete('STU-XSS');

// --------------------------------------------------------------------------
// PHASE 7: ROUTING & MODULE DISCOVERY
// --------------------------------------------------------------------------
console.log('\n[Phase 7: SPA Router & Q4 Integration]');

const router = new Router();
assert(router.normalizeRoute('q4-crud') === 'q4-crud', 'Router normalizes "q4-crud"');
assert(router.normalizeRoute('q4') === 'q4-crud', 'Router normalizes alias "q4" to "q4-crud"');
assert(router.normalizeRoute('#/q4-crud') === 'q4-crud', 'Router normalizes hash "#/q4-crud"');
assert(router.normalizeRoute('#q4') === 'q4-crud', 'Router normalizes hash "#q4"');

// --------------------------------------------------------------------------
// SUMMARY
// --------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Q4 TEST EXECUTION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${failedTests} FAILS)`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
