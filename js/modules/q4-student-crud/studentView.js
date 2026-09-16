/**
 * Q4 Student View: DOM rendering for Student Information Management System
 */

import { qs, createElement, clearElement, batchRender } from '../../utils/dom.js';
import { getInitials } from '../../utils/formatters.js';

export class StudentView {
  constructor() {
    this.tableBody = qs('#q4-student-table-body');
  }

  renderTable(students, { onView, onEdit, onDelete }) {
    if (!this.tableBody) this.tableBody = qs('#q4-student-table-body');
    if (!this.tableBody) return;

    if (students.length === 0) {
      clearElement(this.tableBody);
      const tr = createElement('tr', {
        children: [
          createElement('td', {
            attributes: { colspan: '7', style: 'text-align: center; padding: 2.5rem;' },
            children: [
              createElement('div', { className: 'text-muted font-bold', text: 'No students found matching current filters.' })
            ]
          })
        ]
      });
      this.tableBody.appendChild(tr);
      return;
    }

    batchRender(this.tableBody, students, (student) => {
      return this.createRow(student, { onView, onEdit, onDelete });
    });
  }

  createRow(student, { onView, onEdit, onDelete }) {
    const avatar = createElement('span', {
      className: 'student-avatar-pill',
      text: getInitials(student.name)
    });

    const nameCell = createElement('td', {
      children: [
        createElement('div', {
          className: 'flex items-center',
          children: [
            avatar,
            createElement('div', {
              children: [
                createElement('strong', { text: student.name }),
                createElement('div', { className: 'text-xs text-muted font-mono', text: student.id })
              ]
            })
          ]
        })
      ]
    });

    const emailCell = createElement('td', { text: student.email });
    const majorCell = createElement('td', { text: student.major });

    // GPA tag color
    let gpaClass = 'gpa-mid';
    if (student.gpa >= 3.7) gpaClass = 'gpa-high';
    else if (student.gpa < 3.2) gpaClass = 'gpa-low';

    const gpaCell = createElement('td', {
      children: [
        createElement('span', {
          className: `gpa-tag ${gpaClass}`,
          text: student.gpa.toFixed(2)
        })
      ]
    });

    // Status badge
    const statusBadge = createElement('span', {
      className: `badge ${student.status === 'Active' ? 'badge-success' : 'badge-warning'}`,
      text: student.status
    });
    const statusCell = createElement('td', { children: [statusBadge] });

    const dateCell = createElement('td', { text: student.enrollDate || 'N/A' });

    // Action buttons
    const viewBtn = createElement('button', {
      className: 'btn-icon btn-sm',
      attributes: { title: 'View Student Details', 'aria-label': `View ${student.name}` },
      text: '👁',
      events: { click: () => onView(student) }
    });

    const editBtn = createElement('button', {
      className: 'btn-icon btn-sm',
      attributes: { title: 'Edit Student', 'aria-label': `Edit ${student.name}` },
      text: '✎',
      events: { click: () => onEdit(student) }
    });

    const deleteBtn = createElement('button', {
      className: 'btn-icon btn-sm text-danger',
      attributes: { title: 'Delete Student', 'aria-label': `Delete ${student.name}` },
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
      children: [nameCell, emailCell, majorCell, gpaCell, statusCell, dateCell, actionsCell]
    });
  }

  updateStats(stats) {
    const totalEl = qs('#q4-stat-total');
    const avgGpaEl = qs('#q4-stat-gpa');
    const activeEl = qs('#q4-stat-active');

    if (totalEl) totalEl.textContent = stats.total;
    if (avgGpaEl) avgGpaEl.textContent = stats.avgGpa;
    if (activeEl) activeEl.textContent = stats.activeCount;
  }
}
