/**
 * Security & Sanitization Utilities (XSS Defenses & Data Cleansing)
 */

/**
 * Escapes special HTML characters to prevent XSS injection
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips dangerous protocol schemes from links (javascript:, data:, vbscript:)
 * @param {string} url
 * @returns {string}
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^(javascript:|data:|vbscript:)/i.test(trimmed)) {
    return 'about:blank';
  }
  return trimmed;
}

/**
 * Trims and collapses multiple whitespace characters from user input
 * @param {string} str
 * @returns {string}
 */
export function cleanInputString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}
