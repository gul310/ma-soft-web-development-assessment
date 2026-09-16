/**
 * DOM Utility Module: Safe element creation, query helpers, event delegation, and fragment builders.
 * Guarantees XSS-safe DOM construction using standard browser APIs without innerHTML risks.
 */

export const qs = (selector, scope = typeof document !== 'undefined' ? document : null) => scope ? scope.querySelector(selector) : null;
export const qsa = (selector, scope = typeof document !== 'undefined' ? document : null) => scope ? Array.from(scope.querySelectorAll(selector)) : [];

/**
 * Creates an element with attributes, dataset, classes, and children safely
 * @param {string} tag
 * @param {Object} [options]
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}) {
  const el = document.createElement(tag);

  if (options.className) {
    el.className = options.className;
  }

  if (options.text !== undefined && options.text !== null) {
    el.textContent = options.text;
  }

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([attr, val]) => {
      if (val !== undefined && val !== null && val !== false) {
        el.setAttribute(attr, val === true ? '' : String(val));
      }
    });
  }

  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, val]) => {
      el.dataset[key] = String(val);
    });
  }

  if (options.children) {
    options.children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    });
  }

  if (options.events) {
    Object.entries(options.events).forEach(([evt, handler]) => {
      el.addEventListener(evt, handler);
    });
  }

  return el;
}

/**
 * Sets textContent safely on an element by selector or node
 */
export function safeText(target, text, scope = document) {
  const el = typeof target === 'string' ? qs(target, scope) : target;
  if (el) {
    el.textContent = text ?? '';
  }
}

/**
 * Clears all children of an element safely without innerHTML = ''
 */
export function clearElement(el) {
  if (!el) return;
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Attaches a single event listener to a container and delegates actions to matching child targets
 */
export function delegate(container, eventType, selector, handler) {
  if (!container) return () => {};
  
  const listener = (event) => {
    const targetElement = event.target.closest(selector);
    if (targetElement && container.contains(targetElement)) {
      handler(event, targetElement);
    }
  };

  container.addEventListener(eventType, listener);
  return () => container.removeEventListener(eventType, listener);
}

/**
 * Batch renders items to a container using DocumentFragment to avoid multiple reflows
 */
export function batchRender(container, items, renderFn) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => {
    const node = renderFn(item, index);
    if (node instanceof Node) {
      fragment.appendChild(node);
    }
  });
  clearElement(container);
  container.appendChild(fragment);
}
