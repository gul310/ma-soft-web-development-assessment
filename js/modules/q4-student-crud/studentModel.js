/**
 * Q4 Student Model: Data layer for Student Information Management System (SIMS)
 * Features: Complete CRUD, persistent storage via localStorage, undo delete stack, and statistics calculation.
 */

import { APP_CONFIG, INITIAL_STUDENTS } from '../../config.js';
import { storageService } from '../../services/storageService.js';
import { eventBus } from '../../core/eventBus.js';

class StudentModel {
  constructor() {
    this.students = [];
    this.history = []; // Stack for Undo Delete
    this.init();
  }

  init() {
    try {
      const saved = storageService.getItem(APP_CONFIG.storageKeys.q4Students);
      if (Array.isArray(saved) && saved.length > 0) {
        this.students = saved.map(s => this.normalizeStudentRecord(s));
      } else {
        this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS)).map(s => this.normalizeStudentRecord(s));
        this.save();
      }
    } catch (e) {
      console.warn('[StudentModel] Storage corruption detected, falling back to seed data:', e);
      this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS)).map(s => this.normalizeStudentRecord(s));
      this.save();
    }
  }

  normalizeStudentRecord(s) {
    const prog = s.program || s.major || 'Software Engineering';
    return {
      id: String(s.id || '').trim().toUpperCase(),
      name: String(s.name || '').trim(),
      email: String(s.email || '').trim(),
      phone: String(s.phone || '').trim(),
      program: prog,
      major: prog, // Backwards compatibility
      semester: String(s.semester || '1').trim(),
      gpa: typeof s.gpa === 'number' ? s.gpa : (parseFloat(s.gpa) || 3.0),
      status: s.status === 'Inactive' || s.status === 'Probation' ? s.status : 'Active',
      enrollDate: s.enrollDate || new Date().toISOString().split('T')[0],
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: s.updatedAt || null
    };
  }

  save() {
    try {
      storageService.setItem(APP_CONFIG.storageKeys.q4Students, this.students);
    } catch (e) {
      console.error('[StudentModel] Failed to save students to localStorage:', e);
    }
    eventBus.emit('q4:studentsChanged', this.getAll());
  }

  getAll() {
    return this.students.map(s => ({ ...s }));
  }

  getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toUpperCase();
    const found = this.students.find(s => s.id.toUpperCase() === cleanId);
    return found ? { ...found } : null;
  }

  isIdUnique(id, currentId = null) {
    if (!id) return false;
    const cleanId = String(id).trim().toUpperCase();
    const cleanCurrent = currentId ? String(currentId).trim().toUpperCase() : null;
    return !this.students.some(s => s.id.toUpperCase() === cleanId && s.id.toUpperCase() !== cleanCurrent);
  }

  create(studentData) {
    const rawId = studentData.id || `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent = this.normalizeStudentRecord({
      ...studentData,
      id: rawId,
      createdAt: new Date().toISOString()
    });

    this.students.unshift(newStudent);
    this.save();
    return newStudent;
  }

  update(id, updates) {
    const cleanId = String(id).trim().toUpperCase();
    const idx = this.students.findIndex(s => s.id.toUpperCase() === cleanId);
    if (idx !== -1) {
      const existing = this.students[idx];
      const prog = updates.program || updates.major || existing.program;
      this.students[idx] = this.normalizeStudentRecord({
        ...existing,
        ...updates,
        id: existing.id, // Immutable ID on edit
        program: prog,
        major: prog,
        updatedAt: new Date().toISOString()
      });
      this.save();
      return { ...this.students[idx] };
    }
    return null;
  }

  delete(id) {
    const cleanId = String(id).trim().toUpperCase();
    const idx = this.students.findIndex(s => s.id.toUpperCase() === cleanId);
    if (idx !== -1) {
      const [deleted] = this.students.splice(idx, 1);
      this.history.push({ student: deleted, index: idx });
      this.save();
      return deleted;
    }
    return null;
  }

  undoDelete() {
    if (this.history.length === 0) return null;
    const { student, index } = this.history.pop();
    const insertIdx = Math.min(Math.max(0, index), this.students.length);
    this.students.splice(insertIdx, 0, student);
    this.save();
    return student;
  }

  resetToInitial() {
    this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS)).map(s => this.normalizeStudentRecord(s));
    this.history = [];
    this.save();
  }

  getStats() {
    const total = this.students.length;
    if (total === 0) {
      return { total: 0, avgGpa: '0.00', activeCount: 0, inactiveCount: 0, probationCount: 0 };
    }

    const totalGpa = this.students.reduce((acc, s) => acc + (s.gpa || 0), 0);
    const avgGpa = (totalGpa / total).toFixed(2);
    const activeCount = this.students.filter(s => s.status === 'Active').length;
    const inactiveCount = this.students.filter(s => s.status === 'Inactive').length;
    const probationCount = this.students.filter(s => s.status === 'Probation').length;

    return { total, avgGpa, activeCount, inactiveCount, probationCount };
  }
}

export const studentModel = new StudentModel();
