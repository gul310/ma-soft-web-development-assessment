/**
 * Q4 Student Controller: Student Management Module (Full CRUD + Search + Sort + Filters + Export)
 * Orchestrates Model and View layers with validation, accessibility, and local persistence.
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
    this.programFilter = 'all';
    this.statusFilter = 'all';
    this.semesterFilter = 'all';
    this.sortBy = 'name-asc';
    this.isInitialized = false;
  }

  init() {
    if (!this.view) {
      this.view = new StudentView();
    }

    if (!this.isInitialized) {
      this.setupEventListeners();
      this.isInitialized = true;
    }

    this.render();

    eventBus.on('q4:studentsChanged', () => {
      this.render();
    });
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
    const programSelect = qs('#q4-filter-major') || qs('#q4-filter-program');
    if (programSelect) {
      programSelect.addEventListener('change', (e) => {
        this.programFilter = e.target.value;
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

    const semesterSelect = qs('#q4-filter-semester');
    if (semesterSelect) {
      semesterSelect.addEventListener('change', (e) => {
        this.semesterFilter = e.target.value;
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

    // 4. Add Student Modal Open Trigger
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

    // 6. Modal Close / Cancel Buttons
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
            toast.success(`Deleted student: ${deleted.name} (${deleted.id})`, {
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
        toast.info('Student database reset to assessment seed dataset.');
      });
    }
  }

  getFilteredStudents() {
    let students = studentModel.getAll();

    // 1. Text Search across multiple fields
    if (this.searchQuery) {
      students = students.filter(s =>
        s.name.toLowerCase().includes(this.searchQuery) ||
        s.id.toLowerCase().includes(this.searchQuery) ||
        s.email.toLowerCase().includes(this.searchQuery) ||
        (s.phone && s.phone.toLowerCase().includes(this.searchQuery)) ||
        (s.program && s.program.toLowerCase().includes(this.searchQuery)) ||
        (s.major && s.major.toLowerCase().includes(this.searchQuery)) ||
        String(s.semester).includes(this.searchQuery) ||
        s.status.toLowerCase().includes(this.searchQuery)
      );
    }

    // 2. Program / Major Filter
    if (this.programFilter !== 'all') {
      students = students.filter(s => (s.program === this.programFilter || s.major === this.programFilter));
    }

    // 3. Status Filter
    if (this.statusFilter !== 'all') {
      students = students.filter(s => s.status === this.statusFilter);
    }

    // 4. Semester Filter
    if (this.semesterFilter !== 'all') {
      students = students.filter(s => String(s.semester) === String(this.semesterFilter));
    }

    // 5. Multi-criteria Sorting
    students.sort((a, b) => {
      switch (this.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'id-asc':
          return a.id.localeCompare(b.id);
        case 'gpa-desc':
          return (b.gpa || 0) - (a.gpa || 0);
        case 'gpa-asc':
          return (a.gpa || 0) - (b.gpa || 0);
        case 'sem-asc':
          return parseInt(a.semester || '1', 10) - parseInt(b.semester || '1', 10);
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
    const allStudents = studentModel.getAll();

    this.view.renderTable(students, {
      totalCount: allStudents.length,
      onView: (student) => this.openDetailDrawer(student),
      onEdit: (student) => this.openEditModal(student),
      onDelete: (student) => this.openDeleteModal(student),
      onClearSearch: () => this.clearSearchFilters(),
      onAddFirst: () => this.openAddModal()
    });

    const stats = studentModel.getStats();
    this.view.updateStats(stats);
    appStore.setState({ q4Stats: { totalStudents: stats.total, avgGpa: stats.avgGpa } });
  }

  clearSearchFilters() {
    this.searchQuery = '';
    this.programFilter = 'all';
    this.statusFilter = 'all';
    this.semesterFilter = 'all';

    const searchInput = qs('#q4-search-input');
    const programSelect = qs('#q4-filter-major') || qs('#q4-filter-program');
    const statusSelect = qs('#q4-filter-status');
    const semesterSelect = qs('#q4-filter-semester');

    if (searchInput) searchInput.value = '';
    if (programSelect) programSelect.value = 'all';
    if (statusSelect) statusSelect.value = 'all';
    if (semesterSelect) semesterSelect.value = 'all';

    this.render();
  }

  openAddModal() {
    this.currentEditingId = null;
    const form = qs('#q4-student-form');
    const modalTitle = qs('#q4-modal-title');
    const idInput = qs('#stu-id');
    const saveBtn = qs('#q4-modal-save-btn');

    if (form) form.reset();
    if (modalTitle) modalTitle.textContent = 'Add New Student Record';
    if (saveBtn) saveBtn.textContent = 'Save Student Record';

    if (idInput) {
      // Auto-generate next candidate ID, editable by user if desired
      const nextNum = 1000 + studentModel.getAll().length + 1;
      idInput.value = `STU-${nextNum}`;
      idInput.readOnly = false;
      idInput.removeAttribute('aria-invalid');
    }

    this.clearFormValidationStates();

    const modal = qs('#q4-student-modal');
    const backdrop = qs('#q4-modal-backdrop');
    if (modal) modal.classList.add('open');
    if (backdrop) backdrop.classList.add('open');

    setTimeout(() => {
      qs('#stu-name')?.focus();
    }, 100);
  }

  openEditModal(student) {
    this.currentEditingId = student.id;
    const modalTitle = qs('#q4-modal-title');
    const saveBtn = qs('#q4-modal-save-btn');
    const idInput = qs('#stu-id');

    if (modalTitle) modalTitle.textContent = `Edit Student: ${student.name}`;
    if (saveBtn) saveBtn.textContent = 'Update Student Record';

    if (idInput) {
      idInput.value = student.id;
      idInput.readOnly = true; // Protect unique primary key
    }

    if (qs('#stu-name')) qs('#stu-name').value = student.name;
    if (qs('#stu-email')) qs('#stu-email').value = student.email;
    if (qs('#stu-phone')) qs('#stu-phone').value = student.phone || '';
    
    const progEl = qs('#stu-program') || qs('#stu-major');
    if (progEl) progEl.value = student.program || student.major || 'Software Engineering';

    if (qs('#stu-semester')) qs('#stu-semester').value = student.semester || '1';
    if (qs('#stu-gpa')) qs('#stu-gpa').value = student.gpa || 3.0;
    if (qs('#stu-status')) qs('#stu-status').value = student.status || 'Active';
    if (qs('#stu-date')) qs('#stu-date').value = student.enrollDate || '';

    this.clearFormValidationStates();

    const modal = qs('#q4-student-modal');
    const backdrop = qs('#q4-modal-backdrop');
    if (modal) modal.classList.add('open');
    if (backdrop) backdrop.classList.add('open');

    setTimeout(() => {
      qs('#stu-name')?.focus();
    }, 100);
  }

  closeModal() {
    const modal = qs('#q4-student-modal');
    const backdrop = qs('#q4-modal-backdrop');
    if (modal) modal.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    this.currentEditingId = null;
    this.clearFormValidationStates();
  }

  clearFormValidationStates() {
    qsa('#q4-student-form [aria-invalid]').forEach(el => {
      el.removeAttribute('aria-invalid');
    });
  }

  handleFormSubmit() {
    const rawId = qs('#stu-id') ? qs('#stu-id').value : '';
    const name = cleanInputString(qs('#stu-name')?.value || '');
    const email = cleanInputString(qs('#stu-email')?.value || '');
    const phone = cleanInputString(qs('#stu-phone')?.value || '');
    const progEl = qs('#stu-program') || qs('#stu-major');
    const program = progEl ? progEl.value : 'Software Engineering';
    const semester = qs('#stu-semester') ? qs('#stu-semester').value : '1';
    const gpaRaw = qs('#stu-gpa') ? qs('#stu-gpa').value : '3.0';
    const status = qs('#stu-status') ? qs('#stu-status').value : 'Active';
    const enrollDate = qs('#stu-date') ? qs('#stu-date').value : '';

    const allStudents = studentModel.getAll();

    // 1. Student ID Validation
    const idCheck = ValidationRules.validateStudentID(rawId, allStudents, this.currentEditingId);
    if (!idCheck.isValid) {
      toast.error(idCheck.message);
      const el = qs('#stu-id');
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      return;
    }

    // 2. Full Name Validation
    const nameCheck = ValidationRules.validateName(name);
    if (!nameCheck.isValid) {
      toast.error(nameCheck.message);
      const el = qs('#stu-name');
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      return;
    }

    // 3. Email Address Validation
    const emailCheck = ValidationRules.validateEmail(email);
    if (!emailCheck.isValid) {
      toast.error(emailCheck.message);
      const el = qs('#stu-email');
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      return;
    }

    // 4. Phone Number Validation
    const phoneCheck = ValidationRules.validatePhone(phone);
    if (!phoneCheck.isValid) {
      toast.error(phoneCheck.message);
      const el = qs('#stu-phone');
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      return;
    }

    // 5. Program Validation
    const progCheck = ValidationRules.validateProgram(program);
    if (!progCheck.isValid) {
      toast.error(progCheck.message);
      if (progEl) { progEl.setAttribute('aria-invalid', 'true'); progEl.focus(); }
      return;
    }

    // 6. Semester Validation
    const semCheck = ValidationRules.validateSemester(semester);
    if (!semCheck.isValid) {
      toast.error(semCheck.message);
      const el = qs('#stu-semester');
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      return;
    }

    // 7. Status Validation
    const statusCheck = ValidationRules.validateStatus(status);
    if (!statusCheck.isValid) {
      toast.error(statusCheck.message);
      const el = qs('#stu-status');
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      return;
    }

    const payload = {
      id: idCheck.normalizedId,
      name,
      email,
      phone,
      program,
      major: program,
      semester,
      gpa: parseFloat(gpaRaw) || 3.0,
      status,
      enrollDate: enrollDate || new Date().toISOString().split('T')[0]
    };

    if (this.currentEditingId) {
      studentModel.update(this.currentEditingId, payload);
      toast.success(`Updated student record: ${name} (${payload.id})`);
    } else {
      studentModel.create(payload);
      toast.success(`Added student record: ${name} (${payload.id})`);
    }

    this.closeModal();
  }

  openDetailDrawer(student) {
    const drawer = qs('#q4-detail-drawer');
    const backdrop = qs('#q4-detail-backdrop');

    if (qs('#drawer-stu-name')) qs('#drawer-stu-name').textContent = student.name;
    if (qs('#drawer-stu-id')) qs('#drawer-stu-id').textContent = student.id;
    if (qs('#drawer-stu-email')) qs('#drawer-stu-email').textContent = student.email;
    if (qs('#drawer-stu-phone')) qs('#drawer-stu-phone').textContent = student.phone || 'Not provided';
    if (qs('#drawer-stu-program') || qs('#drawer-stu-major')) {
      const el = qs('#drawer-stu-program') || qs('#drawer-stu-major');
      el.textContent = student.program || student.major || 'Software Engineering';
    }
    if (qs('#drawer-stu-semester')) qs('#drawer-stu-semester').textContent = `Semester ${student.semester || '1'}`;
    if (qs('#drawer-stu-gpa')) qs('#drawer-stu-gpa').textContent = (student.gpa || 3.0).toFixed(2);
    if (qs('#drawer-stu-status')) qs('#drawer-stu-status').textContent = student.status;
    if (qs('#drawer-stu-date')) qs('#drawer-stu-date').textContent = student.enrollDate || 'N/A';

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

    const headers = ['Student ID', 'Full Name', 'Email', 'Phone', 'Program', 'Semester', 'GPA', 'Status', 'Enroll Date'];
    const rows = students.map(s => [
      `"${s.id}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.program || s.major}"`,
      `"Semester ${s.semester || '1'}"`,
      (s.gpa || 3.0).toFixed(2),
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
