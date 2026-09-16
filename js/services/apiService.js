/**
 * Robust REST API Service
 * Handles network requests, AbortController cancellation, timeouts, caching,
 * and user-controlled error simulation modes (404, 500, Offline, Timeout).
 */

import { APP_CONFIG } from '../config.js';

class ApiService {
  constructor() {
    this.cache = new Map();
    this.activeController = null;
    this.simulationMode = 'normal'; // 'normal' | 'error-404' | 'error-500' | 'error-timeout' | 'error-network'
    this.simulatedLatencyMs = 0;
  }

  setSimulationMode(mode) {
    this.simulationMode = mode;
  }

  setSimulatedLatency(ms) {
    this.simulatedLatencyMs = Number(ms) || 0;
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Fetches users from the public REST API
   * @param {Object} [options]
   * @param {boolean} [options.bypassCache=false]
   * @returns {Promise<Array>}
   */
  async fetchUsers({ bypassCache = false } = {}) {
    // 1. Check for Simulation Override Modes
    if (this.simulatedLatencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulatedLatencyMs));
    }

    if (this.simulationMode === 'error-404') {
      throw new Error('HTTP 404: The requested resource was not found on JSONPlaceholder server.');
    }
    if (this.simulationMode === 'error-500') {
      throw new Error('HTTP 500: Internal Server Error simulated on API endpoint.');
    }
    if (this.simulationMode === 'error-timeout') {
      throw new Error('Request Timeout: Server took too long to respond (simulated abort).');
    }
    if (this.simulationMode === 'error-network') {
      throw new Error('Network Error: Failed to fetch. Please check your internet connection.');
    }

    const cacheKey = 'users_list';
    if (!bypassCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Cancel any ongoing fetch if new one is triggered
    if (this.activeController) {
      this.activeController.abort();
    }

    this.activeController = new AbortController();
    const { signal } = this.activeController;

    const timeoutId = setTimeout(() => {
      this.activeController.abort();
    }, 10000); // 10 second timeout threshold

    try {
      const response = await fetch(APP_CONFIG.apiEndpoints.users, {
        signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled or timed out.');
      }

      // Check if navigator is offline
      if (!navigator.onLine) {
        throw new Error('Client is currently offline. Please reconnect to load live API data.');
      }

      throw error;
    } finally {
      this.activeController = null;
    }
  }

  /**
   * Fetches user posts for modal inspection
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async fetchUserPosts(userId) {
    try {
      const res = await fetch(`${APP_CONFIG.apiEndpoints.posts}?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[ApiService] Failed to fetch posts for user ${userId}:`, err);
      return [];
    }
  }
}

export const apiService = new ApiService();
