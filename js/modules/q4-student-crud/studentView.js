/**
 * Q4 Student View: Safe DOM rendering for Student Information Management System
 * Uses document.createElement and textContent exclusively to guarantee XSS prevention.
 */

import { qs, createElement, clearElement, batchRender } from '../../utils/dom.js';
import { getInitials } from '../../utils/formatters.js';

export class StudentView {
  constructor() {
    this.tableBody = qs('#q4-student-table-body');
  }

  renderTable(students, { totalCount = 0, onView, onEdit, onDelete, onClearSearch, onAddFirst }) {
    if (!this.tableBody) this.tableBody = qs('#q4-student-table-body');
    if (!this.tableBody) return;

    clearElement(this.tableBody);

    // 1. Total empty state (no records in storage at all)
    if (totalCount === 0) {
      const addBtn = createElement('button', {
        className: 'btn btn-primary btn-sm mt-3',
        text: '+ Add First Student',
        events: {
          click: () => onAddFirst && onAddFirst()
        }
      });

      const tr = createElement('tr', {
        children: [
          createElement('td', {
            attributes: { colspan: '8', style: 'text-align: center; padding: 3rem 1.5rem;' },
            children: [
              createElement('div', {
                style: 'font-size: 2.5rem; margin-bottom: 0.5rem;',
                text: '🎓'
              }),
              createElement('h4', {
                className: 'font-bold mb-1',
                text: 'No Students Found'
              }),
              createElement('p', {
                className: 'text-sm text-secondary mb-2',
                text: 'Your student database is currently empty. Click below to add a new record.'
              }),
              addBtn
            ]
          })
        ]
      });
      this.tableBody.appendChild(tr);
      return;
    }

    // 2. Filtered empty state (records exist, but none match active search/filter)
    if (students.length === 0) {
      const resetBtn = createElement('button', {
        className: 'btn btn-outline btn-sm mt-2',
        text: 'Clear Search Filters',
        events: {
          click: () => onClearSearch && onClearSearch()
        }
      });

      const tr = createElement('tr', {
        children: [
          createElement('td', {
            attributes: { colspan: '8', style: 'text-align: center; padding: 2.5rem 1.5rem;' },
            children: [
              createElement('div', {
                style: 'font-size: 2rem; margin-bottom: 0.5rem;',
                text: '🔍'
              }),
              createElement('h4', {
                className: 'font-bold mb-1',
                text: 'No Matching Students Found'
              }),
              createElement('p', {
                className: 'text-sm text-secondary',
                text: 'No student records match your current search query or filter selection.'
              }),
              resetBtn
            ]
          })
        ]
      });
      this.tableBody.appendChild(tr);
      return;
    }

    // 3. Batch render student rows using DocumentFragment
    batchRender(this.tableBody, students, (student) => {
      return this.createRow(student, { onView, onEdit, onDelete });
    });
  }

  createRow(student, { onView, onEdit, onDelete }) {
    // 1. Student Avatar & ID/Name Cell
    const avatar = createElement('span', {
      className: 'student-avatar-pill',
      text: getInitials(student.name)
    });

    const nameCell = createElement('td', {
      children: [
        createElement('div', {
          className: 'flex items-center gap-2',
          children: [
            avatar,
            createElement('div', {
              children: [
                createElement('strong', { className: 'student-name-text block', text: student.name }),
                createElement('span', { className: 'text-xs text-muted font-mono', text: student.id })
              ]
            })
          ]
        })
      ]
    });

    // 2. Email Cell
    const emailCell = createElement('td', {
      children: [
        createElement('span', { className: 'text-sm font-mono', text: student.email })
      ]
    });

    // 3. Phone Cell
    const phoneCell = createElement('td', {
      children: [
        createElement('span', { className: 'text-sm font-mono', text: student.phone || 'N/A' })
      ]
    });

    // 4. Program / Course Cell
    const programCell = createElement('td', {
      children: [
        createElement('span', { className: 'text-sm font-medium', text: student.program || student.major })
      ]
    });

    // 5. Semester Cell
    const semesterBadge = createElement('span', {
      className: 'badge badge-primary text-xs',
      text: `Sem ${student.semester || '1'}`
    });
    const semesterCell = createElement('td', { children: [semesterBadge] });

    // 6. Status Badge Cell
    let badgeClass = 'badge-success';
    if (student.status === 'Probation') badgeClass = 'badge-warning';
    else if (student.status === 'Inactive') badgeClass = 'badge-secondary';

    const statusBadge = createElement('span', {
      className: `badge ${badgeClass}`,
      text: student.status
    });
    const statusCell = createElement('td', { children: [statusBadge] });

    // 7. Action Buttons (View, Edit, Delete)
    const viewBtn = createElement('button', {
      className: 'btn-icon btn-sm action-btn-view',
      attributes: { title: `View Profile: ${student.name}`, 'aria-label': `View ${student.name} profile` },
      text: '👁',
      events: { click: () => onView(student) }
    });

    const editBtn = createElement('button', {
      className: 'btn-icon btn-sm action-btn-edit',
      attributes: { title: `Edit Student: ${student.name}`, 'aria-label': `Edit ${student.name}` },
      text: '✎',
      events: { click: () => onEdit(student) }
    });

    const deleteBtn = createElement('button', {
      className: 'btn-icon btn-sm text-danger action-btn-delete',
      attributes: { title: `Delete Student: ${student.name}`, 'aria-label': `Delete ${student.name}` },
      text: '🗑',
      events: { click: () => onDelete(student) }
    });

    const actionsCell = createElement('td', {
      children: [
        createElement('div', {
          className: 'flex items-center gap-1',
          children: [viewBtn, editBtn, deleteBtn]
        })
      ]
    });

    return createElement('tr', {
      attributes: { 'data-student-id': student.id },
      children: [nameCell, emailCell, phoneCell, programCell, semesterCell, statusCell, actionsCell]
    });
  }

  updateStats(stats) {
    const totalEl = qs('#q4-stat-total');
    const avgGpaEl = qs('#q4-stat-gpa');
    const activeEl = qs('#q4-stat-active');
    const inactiveEl = qs('#q4-stat-inactive');

    if (totalEl) totalEl.textContent = stats.total;
    if (avgGpaEl) avgGpaEl.textContent = stats.avgGpa;
    if (activeEl) activeEl.textContent = stats.activeCount;
    if (inactiveEl) inactiveEl.textContent = stats.inactiveCount;
  }
}
