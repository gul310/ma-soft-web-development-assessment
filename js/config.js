/**
 * MA SOFT TECH SOLUTIONS - WEB DEVELOPMENT ASSESSMENT
 * Application Configuration & Constants
 */

export const APP_CONFIG = {
  appName: 'MA Soft Tech Solutions Assessment Hub',
  version: '2.0.0',
  author: 'Frontend Engineering Candidate',
  defaultTheme: 'dark',
  storageKeys: {
    theme: 'masoft_theme_pref',
    q1Items: 'masoft_q1_items_v1',
    q4Students: 'masoft_q4_students_v1',
    gitHistory: 'masoft_q6_git_history'
  },
  apiEndpoints: {
    users: 'https://jsonplaceholder.typicode.com/users',
    posts: 'https://jsonplaceholder.typicode.com/posts',
    fallbackUsers: 'https://dummyjson.com/users'
  },
  debounceDelayMs: 300,
  toastDurationMs: 4000
};

export const INITIAL_STUDENTS = [
  {
    id: 'STU-1001',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@university.edu',
    phone: '+1 (555) 234-5678',
    major: 'Computer Science',
    gpa: 3.92,
    status: 'Active',
    enrollDate: '2023-09-01'
  },
  {
    id: 'STU-1002',
    name: 'Marcus Vance',
    email: 'marcus.v@university.edu',
    phone: '+1 (555) 345-6789',
    major: 'Information Systems',
    gpa: 3.45,
    status: 'Active',
    enrollDate: '2023-09-01'
  },
  {
    id: 'STU-1003',
    name: 'Elena Rostova',
    email: 'elena.r@university.edu',
    phone: '+1 (555) 456-7890',
    major: 'Software Engineering',
    gpa: 3.88,
    status: 'Active',
    enrollDate: '2024-01-15'
  },
  {
    id: 'STU-1004',
    name: 'Devon Patel',
    email: 'devon.p@university.edu',
    phone: '+1 (555) 567-8901',
    major: 'Data Science',
    gpa: 3.15,
    status: 'Probation',
    enrollDate: '2022-09-01'
  },
  {
    id: 'STU-1005',
    name: 'Sophia Chen',
    email: 'sophia.c@university.edu',
    phone: '+1 (555) 678-9012',
    major: 'Computer Science',
    gpa: 4.00,
    status: 'Active',
    enrollDate: '2024-01-15'
  }
];

export const INITIAL_Q1_ITEMS = [
  {
    id: 'item-1',
    title: 'Review Reactivity & DOM Batching Architecture',
    category: 'Architecture',
    priority: 'High',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'item-2',
    title: 'Audit Input Sanitization & XSS Defenses',
    category: 'Security',
    priority: 'Critical',
    completed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'item-3',
    title: 'Optimize CSS Paint Containment & Reflows',
    category: 'Performance',
    priority: 'Medium',
    completed: false,
    createdAt: new Date().toISOString()
  }
];
