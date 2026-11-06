/**
 * Category presentation fallback (name, icon, colour per slug).
 * The live list and article counts come from GET /api/v1/categories; this map is only used
 * to style an article's category badge before (or without) that request.
 */
const DEFAULT_CATEGORIES = [
  { slug: 'technology',    name: 'Technology',        icon: '💻', color: '#6C63FF' },
  { slug: 'science',       name: 'Science',           icon: '🔬', color: '#4ECDC4' },
  { slug: 'business',      name: 'Business',          icon: '📈', color: '#FFD93D' },
  { slug: 'health',        name: 'Health & Wellness', icon: '🏃', color: '#FF6584' },
  { slug: 'arts',          name: 'Arts & Culture',    icon: '🎨', color: '#C77DFF' },
  { slug: 'travel',        name: 'Travel',            icon: '✈️', color: '#43AA8B' },
  { slug: 'food',          name: 'Food & Cooking',    icon: '🍳', color: '#F4845F' },
  { slug: 'finance',       name: 'Finance',           icon: '💰', color: '#52B788' },
  { slug: 'education',     name: 'Education',         icon: '📚', color: '#48CAE4' },
  { slug: 'environment',   name: 'Environment',       icon: '🌿', color: '#2DC653' },
  { slug: 'sports',        name: 'Sports',            icon: '⚽', color: '#FB8500' },
  { slug: 'entertainment', name: 'Entertainment',     icon: '🎬', color: '#E63946' },
].map(c => ({ ...c, id: c.slug, count: 0 }));

const registry = new Map(DEFAULT_CATEGORIES.map(c => [c.slug, c]));

/** Remember categories loaded from the API so article badges use the database names/colours. */
export function registerCategories(list = []) {
  list.forEach(c => registry.set(c.slug, { ...registry.get(c.slug), ...c, id: c.id || c.slug }));
}

/** Look up display info for a category slug (undefined if unknown). */
export function getCategoryMeta(slug) {
  return slug ? registry.get(String(slug).toLowerCase()) : undefined;
}

export default DEFAULT_CATEGORIES;
