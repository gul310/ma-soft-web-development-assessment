/**
 * Q4 Student Controller: Student Management Module (Full CRUD + Search + Sort + Export)
 */

import { qs, qsa, createElement } from '../../utils/dom.js';
import { debounce } from '../../utils/debounce.js';
import { cleanInputString } from '../../utils/sanitizers.js';
import { ValidationRules } from '../../utils/validators.js';
import { toast } from '../../core/toast.js';
import { eventBus } from '../../core/eventBus.js';
import { appStore } from '../../core/store.js';
import { studentModel } from './studentModel.js';
import { StudentView } from './studentView.js';

export class StudentController {
  constructor() {
    this.view = null;
    this.currentEditingId = null;
    this.studentToDelete = null;
    this.searchQuery = '';
    this.majorFilter = 'all';
    this.statusFilter = 'all';
    this.sortBy = 'name-asc';
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.view = new StudentView();
    this.setupEventListeners();
    this.render();

    eventBus.on('q4:studentsChanged', () => {
      this.render();
    });

    this.isInitialized = true;
  }

  setupEventListeners() {
    // 1. Search Bar (Debounced)
    const searchInput = qs('#q4-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      }, 250));
    }

    // 2. Filter Selects
    const majorSelect = qs('#q4-filter-major');
    if (majorSelect) {
      majorSelect.addEventListener('change', (e) => {
        this.majorFilter = e.target.value;
        this.render();
      });
    }

    const statusSelect = qs('#q4-filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.render();
      });
    }

    // 3. Sort Select
    const sortSelect = qs('#q4-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    // 4. Add Student Modal Open
    const addBtn = qs('#q4-add-student-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openAddModal();
      });
    }

    // 5. Student Modal Form Submit
    const studentForm = qs('#q4-student-form');
    if (studentForm) {
      studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // 6. Modal Close Buttons
    const modalCloseBtn = qs('#q4-modal-close-btn');
    const modalCancelBtn = qs('#q4-modal-cancel-btn');
    const modalBackdrop = qs('#q4-modal-backdrop');

    [modalCloseBtn, modalCancelBtn, modalBackdrop].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          if (e.target === modalBackdrop || btn !== modalBackdrop) {
            this.closeModal();
          }
        });
      }
    });

    // 7. Delete Confirmation Modal
    const confirmDeleteBtn = qs('#q4-confirm-delete-btn');
    const cancelDeleteBtn = qs('#q4-cancel-delete-btn');
    const deleteBackdrop = qs('#q4-delete-backdrop');

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        if (this.studentToDelete) {
          const deleted = studentModel.delete(this.studentToDelete.id);
          this.closeDeleteModal();
          if (deleted) {
            toast.success(`Deleted student: ${deleted.name}`, {
              label: 'Undo',
              onClick: () => {
                const restored = studentModel.undoDelete();
                if (restored) toast.info(`Restored student: ${restored.name}`);
              }
            });
          }
        }
      });
    }

    [cancelDeleteBtn, deleteBackdrop].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => this.closeDeleteModal());
      }
    });

    // 8. Detail Drawer Close
    const detailCloseBtn = qs('#q4-detail-close-btn');
    const detailBackdrop = qs('#q4-detail-backdrop');
    [detailCloseBtn, detailBackdrop].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => this.closeDetailDrawer());
      }
    });

    // 9. Export CSV Button
    const exportBtn = qs('#q4-export-csv-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToCSV());
    }

    // 10. Reset Seed Data Button
    const resetBtn = qs('#q4-reset-seed-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        studentModel.resetToInitial();
        toast.info('Student records reset to demo dataset.');
      });
    }
  }

  getFilteredStudents() {
    let students = studentModel.getAll();

    // Text Search
    if (this.searchQuery) {
      students = students.filter(s =>
        s.name.toLowerCase().includes(this.searchQuery) ||
        s.email.toLowerCase().includes(this.searchQuery) ||
        s.id.toLowerCase().includes(this.searchQuery) ||
        s.major.toLowerCase().includes(this.searchQuery)
      );
    }

    // Major Filter
    if (this.majorFilter !== 'all') {
      students = students.filter(s => s.major === this.majorFilter);
    }

    // Status Filter
    if (this.statusFilter !== 'all') {
      students = students.filter(s => s.status === this.statusFilter);
    }

    // Sorting
    students.sort((a, b) => {
      switch (this.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'gpa-desc':
          return b.gpa - a.gpa;
        case 'gpa-asc':
          return a.gpa - b.gpa;
        case 'date-desc':
          return (b.enrollDate || '').localeCompare(a.enrollDate || '');
        default:
          return 0;
      }
    });

    return students;
  }

  render() {
    const students = this.getFilteredStudents();
    this.view.renderTable(students, {
      onView: (student) => this.openDetailDrawer(student),
      onEdit: (student) => this.openEditModal(student),
      onDelete: (student) => this.openDeleteModal(student)
    });

    const stats = studentModel.getStats();
    this.view.updateStats(stats);
    appStore.setState({ q4Stats: { totalStudents: stats.total, avgGpa: stats.avgGpa } });
  }

  openAddModal() {
    this.currentEditingId = null;
    const form = qs('#q4-student-form');
    const modalTitle = qs('#q4-modal-title');
    const idInput = qs('#stu-id');

    if (form) form.reset();
    if (modalTitle) modalTitle.textContent = 'Add New Student Record';
    if (idInput) {
      idInput.value = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
      idInput.readOnly = true;
    }

    const modal = qs('#q4-student-modal');
    const backdrop = qs('#q4-modal-backdrop');
    if (modal) modal.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }

  openEditModal(student) {
    this.currentEditingId = student.id;
    const modalTitle = qs('#q4-modal-title');
    if (modalTitle) modalTitle.textContent = `Edit Student: ${student.name}`;

    qs('#stu-id').value = student.id;
    qs('#stu-id').readOnly = true;
    qs('#stu-name').value = student.name;
    qs('#stu-email').value = student.email;
    qs('#stu-phone').value = student.phone || '';
    qs('#stu-major').value = student.major;
    qs('#stu-gpa').value = student.gpa;
    qs('#stu-status').value = student.status;
    qs('#stu-date').value = student.enrollDate || '';

    const modal = qs('#q4-student-modal');
    const backdrop = qs('#q4-modal-backdrop');
    if (modal) modal.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }

  closeModal() {
    const modal = qs('#q4-student-modal');
    const backdrop = qs('#q4-modal-backdrop');
    if (modal) modal.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    this.currentEditingId = null;
  }

  handleFormSubmit() {
    const id = qs('#stu-id').value;
    const name = cleanInputString(qs('#stu-name').value);
    const email = cleanInputString(qs('#stu-email').value);
    const phone = cleanInputString(qs('#stu-phone').value);
    const major = qs('#stu-major').value;
    const gpa = parseFloat(qs('#stu-gpa').value);
    const status = qs('#stu-status').value;
    const enrollDate = qs('#stu-date').value;

    // Field Validations
    const nameCheck = ValidationRules.validateName(name);
    if (!nameCheck.isValid) {
      toast.error(nameCheck.message);
      qs('#stu-name').focus();
      return;
    }

    const emailCheck = ValidationRules.validateEmail(email);
    if (!emailCheck.isValid) {
      toast.error(emailCheck.message);
      qs('#stu-email').focus();
      return;
    }

    const gpaCheck = ValidationRules.validateGPA(gpa);
    if (!gpaCheck.isValid) {
      toast.error(gpaCheck.message);
      qs('#stu-gpa').focus();
      return;
    }

    const payload = { id, name, email, phone, major, gpa, status, enrollDate };

    if (this.currentEditingId) {
      studentModel.update(this.currentEditingId, payload);
      toast.success(`Student record updated for ${name}`);
    } else {
      studentModel.create(payload);
      toast.success(`Created student record: ${name}`);
    }

    this.closeModal();
  }

  openDetailDrawer(student) {
    const drawer = qs('#q4-detail-drawer');
    const backdrop = qs('#q4-detail-backdrop');

    qs('#drawer-stu-name').textContent = student.name;
    qs('#drawer-stu-id').textContent = student.id;
    qs('#drawer-stu-email').textContent = student.email;
    qs('#drawer-stu-phone').textContent = student.phone || 'Not provided';
    qs('#drawer-stu-major').textContent = student.major;
    qs('#drawer-stu-gpa').textContent = student.gpa.toFixed(2);
    qs('#drawer-stu-status').textContent = student.status;
    qs('#drawer-stu-date').textContent = student.enrollDate || 'N/A';

    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }

  closeDetailDrawer() {
    const drawer = qs('#q4-detail-drawer');
    const backdrop = qs('#q4-detail-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  openDeleteModal(student) {
    this.studentToDelete = student;
    const msgEl = qs('#q4-delete-modal-msg');
    if (msgEl) {
      msgEl.textContent = `Are you sure you want to delete student "${student.name}" (${student.id})? This action can be undone immediately via toast notification.`;
    }

    const modal = qs('#q4-delete-modal');
    const backdrop = qs('#q4-delete-backdrop');
    if (modal) modal.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }

  closeDeleteModal() {
    const modal = qs('#q4-delete-modal');
    const backdrop = qs('#q4-delete-backdrop');
    if (modal) modal.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    this.studentToDelete = null;
  }

  exportToCSV() {
    const students = this.getFilteredStudents();
    if (students.length === 0) {
      toast.warning('No student records to export.');
      return;
    }

    const headers = ['Student ID', 'Full Name', 'Email', 'Phone', 'Major', 'GPA', 'Status', 'Enroll Date'];
    const rows = students.map(s => [
      `"${s.id}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.major}"`,
      s.gpa.toFixed(2),
      `"${s.status}"`,
      `"${s.enrollDate || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${students.length} student records to CSV.`);
  }
}

export const studentController = new StudentController();
