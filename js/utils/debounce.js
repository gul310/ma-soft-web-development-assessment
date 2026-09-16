/**
 * Debounce and Throttle utilities to optimize event handling and network calls.
 */

/**
 * Creates a debounced version of a function that delays execution until wait ms have elapsed.
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeoutId;
  return function executedFunction(...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Creates a throttled version of a function that fires at most once per limit ms.
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
  let inThrottle = false;
  return function executedFunction(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
