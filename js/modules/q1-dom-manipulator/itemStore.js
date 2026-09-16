/**
 * Q1 Item Store: Manages in-memory and persistent tasks/items for DOM manipulation
 */

import { APP_CONFIG, INITIAL_Q1_ITEMS } from '../../config.js';
import { storageService } from '../../services/storageService.js';
import { eventBus } from '../../core/eventBus.js';

class ItemStore {
  constructor() {
    this.items = [];
    this.history = []; // For Undo functionality
    this.init();
  }

  init() {
    const saved = storageService.getItem(APP_CONFIG.storageKeys.q1Items);
    if (Array.isArray(saved) && saved.length > 0) {
      this.items = saved;
    } else {
      this.items = [...INITIAL_Q1_ITEMS];
      this.save();
    }
  }

  save() {
    storageService.setItem(APP_CONFIG.storageKeys.q1Items, this.items);
    eventBus.emit('q1:itemsChanged', this.getItems());
  }

  getItems() {
    return [...this.items];
  }

  addItem({ title, description = '', category, priority }) {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      category: category || 'General',
      priority: priority || 'Medium',
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.items.unshift(newItem);
    this.save();
    return newItem;
  }

  updateItem(id, updates) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.items[idx];
    }
    return null;
  }

  toggleComplete(id) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.items[idx].completed = !this.items[idx].completed;
      this.save();
      return this.items[idx];
    }
    return null;
  }

  removeItem(id) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      const [removed] = this.items.splice(idx, 1);
      this.history.push({ item: removed, index: idx });
      this.save();
      return removed;
    }
    return null;
  }

  undoLastDelete() {
    if (this.history.length === 0) return null;
    const { item, index } = this.history.pop();
    this.items.splice(Math.min(index, this.items.length), 0, item);
    this.save();
    return item;
  }

  clearAll() {
    this.items = [];
    this.save();
  }

  resetDefaults() {
    this.items = [...INITIAL_Q1_ITEMS];
    this.history = [];
    this.save();
  }
}

export const itemStore = new ItemStore();
