/**
 * Q1 DOM Controller: Advanced JavaScript & DOM Manipulation
 * Features:
 * - Dynamic add, update, remove, and display without page reloads
 * - Single-listener event delegation for superior performance
 * - DocumentFragment batch rendering
 * - Input validation & rich toast feedback with Undo support
 * - Integrated Logic & Event Flow explanation drawer
 */

import { qs, qsa, createElement, batchRender, clearElement } from '../../utils/dom.js';
import { cleanInputString } from '../../utils/sanitizers.js';
import { formatTimeAgo } from '../../utils/formatters.js';
import { toast } from '../../core/toast.js';
import { eventBus } from '../../core/eventBus.js';
import { appStore } from '../../core/store.js';
import { itemStore } from './itemStore.js';

export class DomController {
  constructor() {
    this.currentFilter = 'all';
    this.container = null;
    this.form = null;
    this.searchInput = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.container = qs('#q1-items-container');
    this.form = qs('#q1-add-form');
    this.searchInput = qs('#q1-search-input');

    if (!this.container || !this.form) return;

    this.setupEventListeners();
    this.render();

    // Subscribe to store updates
    eventBus.on('q1:itemsChanged', () => {
      this.render();
      this.updateStats();
    });

    this.updateStats();
    this.isInitialized = true;
  }

  setupEventListeners() {
    // 1. Form Submission (Add Item)
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddItem();
    });

    // 2. Event Delegation for List Container (Edit, Delete, Toggle Complete)
    this.container.addEventListener('click', (e) => {
      const target = e.target;

      // Handle Checkbox Toggle
      const toggleBtn = target.closest('[data-action="toggle-complete"]');
      if (toggleBtn) {
        const id = toggleBtn.closest('.q1-item-card').dataset.id;
        const updated = itemStore.toggleComplete(id);
        if (updated) {
          toast.info(updated.completed ? 'Item marked as completed' : 'Item marked as pending');
        }
        return;
      }

      // Handle Delete Action
      const deleteBtn = target.closest('[data-action="delete"]');
      if (deleteBtn) {
        const itemCard = deleteBtn.closest('.q1-item-card');
        const id = itemCard.dataset.id;
        const deletedItem = itemStore.removeItem(id);
        if (deletedItem) {
          toast.success(`Removed: "${deletedItem.title}"`, {
            label: 'Undo',
            onClick: () => {
              const restored = itemStore.undoLastDelete();
              if (restored) {
                toast.info(`Restored: "${restored.title}"`);
              }
            }
          });
        }
        return;
      }

      // Handle Inline Edit Action
      const editBtn = target.closest('[data-action="edit"]');
      if (editBtn) {
        const itemCard = editBtn.closest('.q1-item-card');
        this.enableInlineEdit(itemCard);
        return;
      }
    });

    // 3. Priority Filter Buttons
    const filterButtons = qsa('.q1-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active', 'btn-primary'));
        filterButtons.forEach(b => b.classList.add('btn-secondary'));
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-secondary');

        this.currentFilter = btn.dataset.filter || 'all';
        this.render();
      });
    });

    // 4. Search Filter
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.render();
      });
    }

    // 5. Reset to defaults button
    const resetBtn = qs('#q1-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        itemStore.resetDefaults();
        toast.info('Q1 Item list reset to initial defaults.');
      });
    }

    // 6. Logic Explanation Modal Drawer Trigger
    const logicDrawerBtn = qs('#q1-open-logic-btn');
    const logicDrawer = qs('#q1-logic-drawer');
    const closeLogicBtn = qs('#q1-close-logic-btn');
    const backdrop = qs('#q1-logic-backdrop');

    if (logicDrawerBtn && logicDrawer) {
      logicDrawerBtn.addEventListener('click', () => {
        logicDrawer.classList.add('open');
        if (backdrop) backdrop.classList.add('open');
      });

      const closeDrawer = () => {
        logicDrawer.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
      };

      if (closeLogicBtn) closeLogicBtn.addEventListener('click', closeDrawer);
      if (backdrop) backdrop.addEventListener('click', closeDrawer);
    }
  }

  handleAddItem() {
    const titleInput = qs('#q1-item-title-input');
    const categorySelect = qs('#q1-item-category-input');
    const prioritySelect = qs('#q1-item-priority-input');

    const title = cleanInputString(titleInput.value);

    // Strict Validation
    if (!title) {
      toast.warning('Please enter an item title.');
      titleInput.classList.add('is-invalid');
      titleInput.focus();
      return;
    }

    if (title.length < 3) {
      toast.warning('Title must be at least 3 characters long.');
      titleInput.classList.add('is-invalid');
      titleInput.focus();
      return;
    }

    titleInput.classList.remove('is-invalid');

    // Create item in store
    const newItem = itemStore.addItem({
      title,
      category: categorySelect.value,
      priority: prioritySelect.value
    });

    // Reset input
    titleInput.value = '';
    titleInput.focus();

    toast.success(`Added item: "${newItem.title}"`);
  }

  enableInlineEdit(itemCard) {
    const id = itemCard.dataset.id;
    const titleElement = qs('.q1-item-title', itemCard);
    const currentTitle = titleElement.textContent;

    const input = createElement('input', {
      className: 'form-input form-input-sm',
      attributes: {
        type: 'text',
        value: currentTitle,
        'aria-label': 'Edit item title'
      }
    });

    const saveBtn = createElement('button', {
      className: 'btn btn-primary btn-sm',
      text: 'Save'
    });

    const cancelBtn = createElement('button', {
      className: 'btn btn-secondary btn-sm',
      text: 'Cancel'
    });

    const editContainer = createElement('div', {
      className: 'flex items-center gap-2 w-full',
      children: [input, saveBtn, cancelBtn]
    });

    clearElement(titleElement);
    titleElement.appendChild(editContainer);
    input.focus();
    input.select();

    const saveChanges = () => {
      const newTitle = cleanInputString(input.value);
      if (!newTitle) {
        toast.warning('Title cannot be empty.');
        return;
      }
      itemStore.updateItem(id, { title: newTitle });
      toast.success('Item updated successfully.');
    };

    const cancelChanges = () => {
      this.render();
    };

    saveBtn.addEventListener('click', saveChanges);
    cancelBtn.addEventListener('click', cancelChanges);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveChanges();
      if (e.key === 'Escape') cancelChanges();
    });
  }

  render() {
    if (!this.container) return;

    let items = itemStore.getItems();
    const query = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';

    // Apply Filters
    if (this.currentFilter === 'active') {
      items = items.filter(i => !i.completed);
    } else if (this.currentFilter === 'completed') {
      items = items.filter(i => i.completed);
    } else if (['Critical', 'High', 'Medium', 'Low'].includes(this.currentFilter)) {
      items = items.filter(i => i.priority === this.currentFilter);
    }

    if (query) {
      items = items.filter(i => 
        i.title.toLowerCase().includes(query) || 
        i.category.toLowerCase().includes(query)
      );
    }

    if (items.length === 0) {
      this.renderEmptyState();
      return;
    }

    batchRender(this.container, items, (item) => this.createItemCard(item));
  }

  createItemCard(item) {
    const priorityColors = {
      Critical: 'badge-danger',
      High: 'badge-warning',
      Medium: 'badge-primary',
      Low: 'badge-neutral'
    };

    // Checkbox
    const checkbox = createElement('input', {
      attributes: {
        type: 'checkbox',
        'aria-label': `Mark ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`
      },
      dataset: { action: 'toggle-complete' }
    });
    if (item.completed) checkbox.checked = true;

    // Title Span
    const titleSpan = createElement('div', {
      className: 'q1-item-title',
      text: item.title
    });

    // Metadata Badges
    const priorityBadge = createElement('span', {
      className: `badge ${priorityColors[item.priority] || 'badge-neutral'}`,
      text: item.priority
    });

    const categoryBadge = createElement('span', {
      className: 'badge badge-neutral text-xs',
      text: item.category
    });

    const timeSpan = createElement('span', {
      className: 'text-xs text-muted',
      text: formatTimeAgo(item.createdAt)
    });

    const metaDiv = createElement('div', {
      className: 'q1-item-meta',
      children: [priorityBadge, categoryBadge, timeSpan]
    });

    const textGroup = createElement('div', {
      children: [titleSpan, metaDiv]
    });

    const leftSection = createElement('div', {
      className: 'q1-item-left',
      children: [checkbox, textGroup]
    });

    // Action buttons
    const editBtn = createElement('button', {
      className: 'btn-icon btn-sm',
      attributes: { 'aria-label': `Edit ${item.title}`, title: 'Edit Item' },
      dataset: { action: 'edit' },
      text: '✎'
    });

    const deleteBtn = createElement('button', {
      className: 'btn-icon btn-sm text-danger',
      attributes: { 'aria-label': `Delete ${item.title}`, title: 'Delete Item' },
      dataset: { action: 'delete' },
      text: '🗑'
    });

    const actionsDiv = createElement('div', {
      className: 'q1-item-actions',
      children: [editBtn, deleteBtn]
    });

    const card = createElement('li', {
      className: `q1-item-card ${item.completed ? 'completed' : ''}`,
      dataset: { id: item.id },
      children: [leftSection, actionsDiv]
    });

    return card;
  }

  renderEmptyState() {
    clearElement(this.container);
    const emptyBox = createElement('div', {
      className: 'empty-state-box',
      children: [
        createElement('div', { className: 'empty-state-icon', text: '📋' }),
        createElement('h4', { text: 'No Items Found' }),
        createElement('p', { className: 'text-sm text-muted', text: 'Try adding a new item or adjusting your active filters.' })
      ]
    });
    this.container.appendChild(emptyBox);
  }

  updateStats() {
    const items = itemStore.getItems();
    const total = items.length;
    const completed = items.filter(i => i.completed).length;
    const pending = total - completed;
    const critical = items.filter(i => i.priority === 'Critical' && !i.completed).length;

    const totalEl = qs('#q1-stat-total');
    const completedEl = qs('#q1-stat-completed');
    const pendingEl = qs('#q1-stat-pending');
    const criticalEl = qs('#q1-stat-critical');

    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (pendingEl) pendingEl.textContent = pending;
    if (criticalEl) criticalEl.textContent = critical;

    appStore.setState({ q1Stats: { total, completed } });
  }
}

export const domController = new DomController();
