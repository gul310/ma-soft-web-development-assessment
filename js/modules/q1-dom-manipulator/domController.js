/**
 * Q1 DOM Controller: Advanced JavaScript & DOM Manipulation
 * Features:
 * - Dynamic add, update, remove, and display without page reloads
 * - Single-listener event delegation for superior performance
 * - DocumentFragment batch rendering
 * - Multi-field validation (Title, Description, Priority) with accessible inline error messages
 * - Rich toast feedback with Undo support
 * - Search across titles and descriptions & filtering by priority/status
 * - In-app 10-point Logic & Event Flow explanation drawer
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

    // Real-time error clearing on typing
    const titleInput = qs('#q1-item-title-input');
    const descInput = qs('#q1-item-desc-input');

    if (titleInput) {
      titleInput.addEventListener('input', () => {
        if (titleInput.classList.contains('is-invalid')) {
          this.validateTitle(titleInput.value);
        }
      });
    }

    if (descInput) {
      descInput.addEventListener('input', () => {
        if (descInput.classList.contains('is-invalid')) {
          this.validateDescription(descInput.value);
        }
      });
    }

    // 2. Event Delegation for List Container (Edit, Delete, Toggle Complete)
    this.container.addEventListener('click', (e) => {
      const target = e.target;

      // Handle Checkbox Toggle
      const toggleBtn = target.closest('[data-action="toggle-complete"]');
      if (toggleBtn) {
        const id = toggleBtn.closest('.q1-item-card').dataset.id;
        const updated = itemStore.toggleComplete(id);
        if (updated) {
          toast.info(updated.completed ? `Completed: "${updated.title}"` : `Reopened: "${updated.title}"`);
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

  validateTitle(rawTitle) {
    const errorEl = qs('#q1-error-title');
    const titleInput = qs('#q1-item-title-input');
    const trimmed = (rawTitle || '').trim();

    if (!trimmed) {
      if (errorEl) {
        errorEl.textContent = 'Item title is required and cannot be whitespace only.';
        errorEl.classList.add('visible');
      }
      if (titleInput) titleInput.classList.add('is-invalid');
      return false;
    }

    if (trimmed.length < 3) {
      if (errorEl) {
        errorEl.textContent = 'Title must be at least 3 characters long.';
        errorEl.classList.add('visible');
      }
      if (titleInput) titleInput.classList.add('is-invalid');
      return false;
    }

    if (trimmed.length > 60) {
      if (errorEl) {
        errorEl.textContent = 'Title cannot exceed 60 characters.';
        errorEl.classList.add('visible');
      }
      if (titleInput) titleInput.classList.add('is-invalid');
      return false;
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
    if (titleInput) {
      titleInput.classList.remove('is-invalid');
      titleInput.classList.add('is-valid');
    }
    return true;
  }

  validateDescription(rawDesc) {
    const errorEl = qs('#q1-error-description');
    const descInput = qs('#q1-item-desc-input');
    const desc = rawDesc || '';

    if (desc.length > 250) {
      if (errorEl) {
        errorEl.textContent = 'Description cannot exceed 250 characters.';
        errorEl.classList.add('visible');
      }
      if (descInput) descInput.classList.add('is-invalid');
      return false;
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
    if (descInput) {
      descInput.classList.remove('is-invalid');
    }
    return true;
  }

  handleAddItem() {
    const titleInput = qs('#q1-item-title-input');
    const descInput = qs('#q1-item-desc-input');
    const categorySelect = qs('#q1-item-category-input');
    const prioritySelect = qs('#q1-item-priority-input');

    const isTitleValid = this.validateTitle(titleInput.value);
    const isDescValid = this.validateDescription(descInput?.value || '');

    if (!isTitleValid) {
      titleInput.focus();
      toast.warning('Please enter a valid item title.');
      return;
    }

    if (!isDescValid) {
      descInput.focus();
      toast.warning('Please fix the description length.');
      return;
    }

    const title = cleanInputString(titleInput.value);
    const description = cleanInputString(descInput?.value || '');
    const category = categorySelect.value;
    const priority = prioritySelect.value;

    // Create item in store
    const newItem = itemStore.addItem({
      title,
      description,
      category,
      priority
    });

    // Reset inputs & states
    titleInput.value = '';
    titleInput.classList.remove('is-valid', 'is-invalid');
    if (descInput) {
      descInput.value = '';
      descInput.classList.remove('is-valid', 'is-invalid');
    }
    titleInput.focus();

    toast.success(`Added item: "${newItem.title}"`);
  }

  enableInlineEdit(itemCard) {
    const id = itemCard.dataset.id;
    const item = itemStore.getItems().find(i => i.id === id);
    if (!item) return;

    const contentContainer = qs('.q1-item-left', itemCard);
    const actionsContainer = qs('.q1-item-actions', itemCard);

    // Save original DOM representation in case of cancel
    const originalLeftHTML = contentContainer.cloneNode(true);
    const originalActionsHTML = actionsContainer.cloneNode(true);

    clearElement(contentContainer);
    clearElement(actionsContainer);

    // Edit Inputs
    const titleEditInput = createElement('input', {
      className: 'form-input form-input-sm mb-1',
      attributes: {
        type: 'text',
        value: item.title,
        maxlength: '60',
        'aria-label': 'Edit item title'
      }
    });

    const descEditInput = createElement('input', {
      className: 'form-input form-input-sm text-xs',
      attributes: {
        type: 'text',
        value: item.description || '',
        maxlength: '250',
        placeholder: 'Edit optional description...',
        'aria-label': 'Edit item description'
      }
    });

    const editWrapper = createElement('div', {
      className: 'flex-col w-full gap-1',
      children: [titleEditInput, descEditInput]
    });

    contentContainer.appendChild(editWrapper);

    const saveBtn = createElement('button', {
      className: 'btn btn-primary btn-sm',
      text: 'Save'
    });

    const cancelBtn = createElement('button', {
      className: 'btn btn-secondary btn-sm',
      text: 'Cancel'
    });

    actionsContainer.appendChild(saveBtn);
    actionsContainer.appendChild(cancelBtn);

    titleEditInput.focus();
    titleEditInput.select();

    const saveChanges = () => {
      const newTitle = cleanInputString(titleEditInput.value);
      const newDesc = cleanInputString(descEditInput.value);

      if (!newTitle || newTitle.length < 3) {
        toast.warning('Title must be at least 3 characters long.');
        titleEditInput.classList.add('is-invalid');
        titleEditInput.focus();
        return;
      }

      if (newTitle.length > 60) {
        toast.warning('Title cannot exceed 60 characters.');
        titleEditInput.classList.add('is-invalid');
        titleEditInput.focus();
        return;
      }

      if (newDesc.length > 250) {
        toast.warning('Description cannot exceed 250 characters.');
        descEditInput.classList.add('is-invalid');
        descEditInput.focus();
        return;
      }

      itemStore.updateItem(id, {
        title: newTitle,
        description: newDesc
      });

      toast.success('Item updated successfully.');
    };

    const cancelChanges = () => {
      this.render();
    };

    saveBtn.addEventListener('click', saveChanges);
    cancelBtn.addEventListener('click', cancelChanges);
    
    titleEditInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveChanges();
      if (e.key === 'Escape') cancelChanges();
    });

    descEditInput.addEventListener('keydown', (e) => {
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
        (i.description && i.description.toLowerCase().includes(query)) ||
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

    // Optional Description Span
    const childrenNodes = [titleSpan];
    if (item.description) {
      const descSpan = createElement('p', {
        className: 'text-xs text-secondary mt-1',
        text: item.description
      });
      childrenNodes.push(descSpan);
    }

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
      className: 'q1-item-meta mt-1',
      children: [priorityBadge, categoryBadge, timeSpan]
    });

    childrenNodes.push(metaDiv);

    const textGroup = createElement('div', {
      className: 'flex-col w-full',
      children: childrenNodes
    });

    const leftSection = createElement('div', {
      className: 'q1-item-left w-full',
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
        createElement('p', { className: 'text-sm text-muted', text: 'Try adding a new item or adjusting your active search/filters.' })
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
