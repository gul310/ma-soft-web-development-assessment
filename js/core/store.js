/**
 * Central State Store with Subscription Management
 */

class Store {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.subscribers = new Map();
  }

  getState() {
    return { ...this.state };
  }

  get(key) {
    return this.state[key];
  }

  setState(partialState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...partialState };
    
    Object.keys(partialState).forEach(key => {
      if (this.subscribers.has(key)) {
        this.subscribers.get(key).forEach(callback => {
          callback(this.state[key], prevState[key]);
        });
      }
    });

    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(callback => {
        callback(this.state, prevState);
      });
    }
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    return () => this.subscribers.get(key).delete(callback);
  }
}

export const appStore = new Store({
  activeView: 'overview',
  theme: 'dark',
  online: navigator.onLine,
  q1Stats: { total: 0, completed: 0 },
  q4Stats: { totalStudents: 0, avgGpa: '0.00' }
});
