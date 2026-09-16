/**
 * Q4 Student Model: Data layer for Student Information Management System (SIMS)
 */

import { APP_CONFIG, INITIAL_STUDENTS } from '../../config.js';
import { storageService } from '../../services/storageService.js';
import { eventBus } from '../../core/eventBus.js';

class StudentModel {
  constructor() {
    this.students = [];
    this.history = []; // For Undo Delete
    this.init();
  }

  init() {
    const saved = storageService.getItem(APP_CONFIG.storageKeys.q4Students);
    if (Array.isArray(saved) && saved.length > 0) {
      this.students = saved;
    } else {
      this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
      this.save();
    }
  }

  save() {
    storageService.setItem(APP_CONFIG.storageKeys.q4Students, this.students);
    eventBus.emit('q4:studentsChanged', this.getAll());
  }

  getAll() {
    return [...this.students];
  }

  getById(id) {
    return this.students.find(s => s.id === id) || null;
  }

  create(studentData) {
    // Generate unique student ID if not provided
    const id = studentData.id || `STU-${1000 + this.students.length + Math.floor(Math.random() * 900)}`;

    const newStudent = {
      id: id.trim(),
      name: studentData.name.trim(),
      email: studentData.email.trim(),
      phone: studentData.phone ? studentData.phone.trim() : '',
      major: studentData.major || 'Computer Science',
      gpa: parseFloat(studentData.gpa) || 3.0,
      status: studentData.status || 'Active',
      enrollDate: studentData.enrollDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    this.students.unshift(newStudent);
    this.save();
    return newStudent;
  }

  update(id, updates) {
    const idx = this.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.students[idx] = {
        ...this.students[idx],
        ...updates,
        gpa: updates.gpa !== undefined ? parseFloat(updates.gpa) : this.students[idx].gpa,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.students[idx];
    }
    return null;
  }

  delete(id) {
    const idx = this.students.findIndex(s => s.id === id);
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
    this.students.splice(Math.min(index, this.students.length), 0, student);
    this.save();
    return student;
  }

  resetToInitial() {
    this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    this.history = [];
    this.save();
  }

  getStats() {
    const total = this.students.length;
    if (total === 0) return { total: 0, avgGpa: '0.00', activeCount: 0 };

    const totalGpa = this.students.reduce((acc, s) => acc + (s.gpa || 0), 0);
    const avgGpa = (totalGpa / total).toFixed(2);
    const activeCount = this.students.filter(s => s.status === 'Active').length;

    return { total, avgGpa, activeCount };
  }
}

export const studentModel = new StudentModel();
