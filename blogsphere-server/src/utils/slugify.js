const MAX_SLUG_LENGTH = 80;

/**
 * Turn any title into a clean, URL-safe slug:
 *   "The Baker's Café & Sourdough — Part 2!" -> "the-bakers-cafe-and-sourdough-part-2"
 * - accents are removed (é -> e), apostrophes dropped, "&" -> "and"
 * - only a-z, 0-9 and single hyphens; no leading/trailing hyphens
 * - cut to 80 characters at a word boundary
 */
function slugify(text = '') {
  let slug = String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length > MAX_SLUG_LENGTH) {
    const cut = slug.slice(0, MAX_SLUG_LENGTH + 1);
    const lastHyphen = cut.lastIndexOf('-');
    slug = (lastHyphen > 20 ? cut.slice(0, lastHyphen) : cut.slice(0, MAX_SLUG_LENGTH)).replace(/-+$/, '');
  }
  return slug;
}

module.exports = slugify;
module.exports.MAX_SLUG_LENGTH = MAX_SLUG_LENGTH;
