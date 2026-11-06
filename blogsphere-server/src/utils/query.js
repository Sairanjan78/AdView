/** Escape user input before using it inside a RegExp (prevents ReDoS / regex injection). */
const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Parse a positive integer query param, clamped to [min, max]. */
const parseLimit = (value, fallback, max = 50, min = 1) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

module.exports = { escapeRegex, parseLimit };
